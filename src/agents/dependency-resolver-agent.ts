import { Agent } from "agents";
import { generateId } from "ai";
import { tools } from "../tools";
import {
  type Env,
  type ResolutionRequest,
  type DependencyReport,
  type ResolutionResult,
  type RequirementsGeneratorResult,
  generateReportKey,
  ResolutionRequestSchema,
} from "../shared";
import {
  createLogger,
  createMetrics,
  timeAsync,
  generateTraceId,
  generateRequestId,
  enrichErrorContext,
  type Logger,
  type MetricsCollector,
} from "../logger";
import {
  PackageResearchService,
  type PackageResearchResult,
} from "../services/package-research";

/**
 * Main Dependency Resolver Agent
 * Orchestrates the entire dependency resolution process
 */
export class DependencyResolverAgent extends Agent<Env> {
  private logger: Logger;
  private packageResearchService: PackageResearchService;

  constructor(state: any, env: Env) {
    super(state, env);
    this.logger = createLogger(env, "DependencyResolverAgent");
    this.packageResearchService = new PackageResearchService(env);
  }

  async onRequest(request: Request) {
    const traceId = generateTraceId();
    const requestId = generateRequestId();
    const logger = this.logger.withTracing(traceId, requestId);
    const metrics = createMetrics(traceId);

    logger.info("Incoming request", {
      method: request.method,
      url: request.url,
      user_agent: request.headers.get("user-agent"),
    });

    try {
      const url = new URL(request.url);
      const method = request.method;

      if (method === "POST" && url.pathname.endsWith("/resolve")) {
        return await this.handleResolutionRequest(request, logger, metrics);
      }

      if (method === "GET" && url.pathname.endsWith("/status")) {
        const reportId = url.searchParams.get("id");
        if (reportId) {
          return await this.getResolutionStatus(reportId, logger, metrics);
        }
      }

      logger.warn("Route not found", { method, pathname: url.pathname });
      return new Response("Not found", { status: 404 });
    } catch (error) {
      const enrichedError = enrichErrorContext(error as Error, {
        trace_id: traceId,
        request_id: requestId,
      });
      logger.error("DependencyResolverAgent error", enrichedError);
      metrics.counter("agent.errors", 1, { agent: "DependencyResolverAgent" });
      return new Response(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        { status: 500 }
      );
    }
  }

  private async handleResolutionRequest(
    request: Request,
    logger: Logger,
    metrics: MetricsCollector
  ): Promise<Response> {
    return await timeAsync(
      async () => {
        const body = await request.json();
        const resolutionRequest = ResolutionRequestSchema.parse(body);

        logger.info("Resolution request parsed", {
          requirement_count: resolutionRequest.requirements.length,
          python_version: resolutionRequest.python_version,
          allow_prereleases: resolutionRequest.allow_prereleases,
        });

        const reportId = generateId();
        const startTime = Date.now();

        // Store initial processing status
        try {
          const processingStatus = {
            id: reportId,
            status: "processing",
            created_at: new Date().toISOString(),
            request: resolutionRequest,
          };
          const key = generateReportKey(reportId);
          await this.env.REPORTS_STORAGE.put(key, JSON.stringify(processingStatus));
          logger.debug("Initial processing status stored", { report_id: reportId });
        } catch (error) {
          logger.error("Failed to store initial processing status", error as Error, {
            report_id: reportId,
          });
        }

        // Start the resolution process asynchronously
        this.ctx.waitUntil(
          this.processResolution(
            reportId,
            resolutionRequest,
            startTime,
            logger,
            metrics
          )
        );

        logger.info("Resolution process started", { report_id: reportId });
        metrics.counter("resolution.started", 1);

        return Response.json({
          id: reportId,
          status: "processing",
          message:
            "Dependency resolution started. Use the /status endpoint to check progress.",
        });
      },
      logger,
      "handleResolutionRequest"
    ).then((result) => result.result);
  }

  private async processResolution(
    reportId: string,
    request: ResolutionRequest,
    startTime: number,
    logger: Logger,
    metrics: MetricsCollector
  ) {
    const childLogger = logger.child({ report_id: reportId });

    try {
      childLogger.info("Starting resolution process", {
        packages: request.requirements.map((r) => r.name),
        python_version: request.python_version,
      });

      // Phase 1: Research each package using the service
      childLogger.info("Starting package research phase");
      const { result: packageResearchResults, duration_ms: researchDuration } =
        await timeAsync(
          () =>
            this.packageResearchService.researchMultiplePackages(
              request.requirements.map((r) => r.name),
              childLogger,
              metrics
            ),
          childLogger,
          "package research phase"
        );

      metrics.timing("resolution.research_duration", researchDuration);

      // Phase 2: Resolve dependencies
      childLogger.info("Starting dependency resolution phase");
      const { result: resolutionResult, duration_ms: resolutionDuration } =
        await timeAsync(
          () =>
            this.resolveDependencies(
              request,
              packageResearchResults,
              childLogger,
              metrics
            ),
          childLogger,
          "dependency resolution phase"
        );

      metrics.timing("resolution.resolution_duration", resolutionDuration);

      // Phase 3: Generate comprehensive report
      childLogger.info("Starting report generation phase");
      const { result: report, duration_ms: reportDuration } = await timeAsync(
        () =>
          this.generateReport(
            reportId,
            request,
            resolutionResult,
            packageResearchResults,
            startTime,
            childLogger
          ),
        childLogger,
        "report generation phase"
      );

      metrics.timing("resolution.report_duration", reportDuration);

      // Store the report
      await this.storeReport(reportId, report, childLogger);

      const totalDuration = Date.now() - startTime;
      childLogger.info("Resolution completed successfully", {
        total_duration: totalDuration,
        success: report.result?.success,
        package_count: report.metadata.total_packages,
        deprecated_count: report.metadata.deprecated_count,
        conflict_count: report.metadata.conflict_count,
      });

      metrics.timing("resolution.total_duration", totalDuration);
      metrics.counter("resolution.completed", 1, { success: "true" });
    } catch (error) {
      const enrichedError = enrichErrorContext(error as Error, {
        report_id: reportId,
      });
      childLogger.error("Resolution failed", enrichedError);
      metrics.counter("resolution.failed", 1);
      await this.storeError(
        reportId,
        error instanceof Error ? error.message : "Unknown error",
        childLogger
      );
    }
  }

  private async resolveDependencies(
    request: ResolutionRequest,
    researchResults: Map<string, PackageResearchResult | { error: string }>,
    logger: Logger,
    metrics: MetricsCollector
  ): Promise<ResolutionResult> {
    try {
      logger.info("Starting dependency resolution", {
        requirement_count: request.requirements.length,
        python_version: request.python_version,
      });

      // Convert requirements to the format expected by the resolution tool
      const requirements = request.requirements.map((req) => ({
        name: req.name,
        operator: req.operator,
        version: req.version,
        original_spec: req.original_spec,
        fixed: req.fixed,
      }));

      const resolutionResult = (await tools.dependency_resolution.execute(
        {
          requirements,
          python_version: request.python_version,
          allow_prereleases: request.allow_prereleases,
        },
        { env: this.env } as any
      )) as ResolutionResult;

      // Enhance the result with deprecation information
      if (resolutionResult.resolved_packages) {
        const deprecatedPackages = [];
        for (const pkg of resolutionResult.resolved_packages) {
          const research = researchResults.get(pkg.name);
          if (
            research &&
            !("error" in research) &&
            research.deprecation_analysis?.is_deprecated
          ) {
            deprecatedPackages.push({
              name: pkg.name,
              version: pkg.version,
              reason: research.deprecation_analysis.evidence.join("; "),
              suggested_alternative:
                research.deprecation_analysis.alternatives[0],
            });
          }
        }
        if (deprecatedPackages.length > 0) {
          resolutionResult.deprecated_packages = deprecatedPackages;
        }
      }

      logger.info("Dependency resolution completed", {
        success: resolutionResult.success,
        resolved_count: resolutionResult.resolved_packages?.length || 0,
        conflict_count: resolutionResult.conflicts?.length || 0,
        deprecated_count: resolutionResult.deprecated_packages?.length || 0,
      });

      metrics.counter("resolution.dependency_resolution_completed", 1, {
        success: String(resolutionResult.success),
      });

      return resolutionResult;
    } catch (error) {
      logger.error("Dependency resolution failed", error as Error);
      metrics.counter("resolution.dependency_resolution_failed", 1);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async generateReport(
    reportId: string,
    request: ResolutionRequest,
    resolutionResult: ResolutionResult,
    researchResults: Map<string, PackageResearchResult | { error: string }>,
    startTime: number,
    logger: Logger
  ): Promise<DependencyReport> {
    logger.info("Generating report", { report_id: reportId });

    // Generate requirements.txt file
    let requirementsTxt = "";
    if (resolutionResult.resolved_packages) {
      // Add source property to resolved packages for requirements generator
      const packagesWithSource = resolutionResult.resolved_packages.map((pkg) => ({
        ...pkg,
        source: "pypi",
      }));

      const reqResult = (await tools.requirements_generator.execute(
        {
          resolved_packages: packagesWithSource,
          include_comments: true,
          pin_versions: true,
        },
        {} as any
      )) as RequirementsGeneratorResult;
      requirementsTxt = reqResult.requirements_txt;
    }

    // Generate detailed markdown report
    const detailedReport = await this.generateDetailedReport(
      request,
      resolutionResult,
      researchResults,
      logger
    );

    // Create package analysis using the service
    const packageAnalysis = Array.from(researchResults.entries()).map(
      ([name, research]) => {
        const resolvedPkg = resolutionResult.resolved_packages?.find(
          (p) => p.name === name
        );

        return {
          name,
          current_version:
            research && !("error" in research) && research.pypi_info && !("error" in research.pypi_info)
              ? research.pypi_info.latest_version || "unknown"
              : "unknown",
          recommended_version: resolvedPkg?.version || "unresolved",
          analysis:
            this.packageResearchService.generatePackageAnalysis(research),
          security_notes: [],
          compatibility_notes: [],
        };
      }
    );

    const report: DependencyReport = {
      id: reportId,
      created_at: new Date(),
      request,
      result: resolutionResult,
      requirements_txt: requirementsTxt,
      detailed_report: detailedReport,
      package_analysis: packageAnalysis,
      metadata: {
        python_version: request.python_version,
        total_packages: request.requirements.length,
        deprecated_count: resolutionResult.deprecated_packages?.length || 0,
        conflict_count: resolutionResult.conflicts?.length || 0,
        processing_time_ms: Date.now() - startTime,
      },
    };

    logger.info("Report generated successfully", {
      report_id: reportId,
      total_packages: report.metadata.total_packages,
      deprecated_count: report.metadata.deprecated_count,
      conflict_count: report.metadata.conflict_count,
      processing_time_ms: report.metadata.processing_time_ms,
    });

    return report;
  }

  private async generateDetailedReport(
    request: ResolutionRequest,
    resolutionResult: ResolutionResult,
    researchResults: Map<string, PackageResearchResult | { error: string }>,
    logger: Logger
  ): Promise<string> {
    logger.debug("Generating detailed markdown report");

    let report = "# Python Dependency Resolution Report\n\n";
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Python Version:** ${request.python_version}\n`;
    report += `**Total Packages:** ${request.requirements.length}\n\n`;

    // Summary
    report += "## Summary\n\n";
    if (resolutionResult.success) {
      report += "✅ **Resolution Status:** Successful\n";
    } else {
      report += "❌ **Resolution Status:** Failed\n";
    }

    if (resolutionResult.conflicts && resolutionResult.conflicts.length > 0) {
      report += `⚠️ **Conflicts:** ${resolutionResult.conflicts.length}\n`;
    }

    if (
      resolutionResult.deprecated_packages &&
      resolutionResult.deprecated_packages.length > 0
    ) {
      report += `🔄 **Deprecated Packages:** ${resolutionResult.deprecated_packages.length}\n`;
    }

    // Resolved packages
    if (
      resolutionResult.resolved_packages &&
      resolutionResult.resolved_packages.length > 0
    ) {
      report += "\n## Resolved Packages\n\n";
      for (const pkg of resolutionResult.resolved_packages) {
        report += `- **${pkg.name}** = ${pkg.version}\n`;
      }
    }

    // Deprecated packages
    if (
      resolutionResult.deprecated_packages &&
      resolutionResult.deprecated_packages.length > 0
    ) {
      report += "\n## ⚠️ Deprecated Packages\n\n";
      for (const pkg of resolutionResult.deprecated_packages) {
        report += `### ${pkg.name}\n`;
        report += `- **Version:** ${pkg.version}\n`;
        report += `- **Reason:** ${pkg.reason}\n`;
        if (pkg.suggested_alternative) {
          report += `- **Suggested Alternative:** ${pkg.suggested_alternative}\n`;
        }
        report += "\n";
      }
    }

    // Conflicts
    if (resolutionResult.conflicts && resolutionResult.conflicts.length > 0) {
      report += "\n## ❌ Conflicts\n\n";
      for (const conflict of resolutionResult.conflicts) {
        report += `### ${conflict.packages.join(", ")}\n`;
        report += `**Reason:** ${conflict.reason}\n`;
        if (conflict.suggested_resolution) {
          report += `**Suggested Resolution:** ${conflict.suggested_resolution}\n`;
        }
        report += "\n";
      }
    }

    return report;
  }

  private async storeReport(
    reportId: string,
    report: DependencyReport,
    logger: Logger
  ) {
    try {
      const key = generateReportKey(reportId);
      await this.env.REPORTS_STORAGE.put(key, JSON.stringify(report));
      logger.info("Report stored successfully", { report_id: reportId, key });
    } catch (error) {
      logger.error("Failed to store report", error as Error, {
        report_id: reportId,
      });
      throw error;
    }
  }

  private async storeError(reportId: string, error: string, logger: Logger) {
    try {
      const key = generateReportKey(reportId);
      const errorReport = {
        id: reportId,
        status: "failed",
        error,
        created_at: new Date().toISOString(),
      };
      await this.env.REPORTS_STORAGE.put(key, JSON.stringify(errorReport));
      logger.warn("Error report stored", { report_id: reportId, error });
    } catch (storageError) {
      logger.error("Failed to store error report", storageError as Error, {
        report_id: reportId,
        original_error: error,
      });
    }
  }

  private async getResolutionStatus(
    reportId: string,
    logger: Logger,
    metrics: MetricsCollector
  ): Promise<Response> {
    try {
      logger.debug("Retrieving resolution status", { report_id: reportId });

      const key = generateReportKey(reportId);
      const stored = await this.env.REPORTS_STORAGE.get(key);

      if (!stored) {
        logger.warn("Report not found", { report_id: reportId });
        metrics.counter("status.not_found", 1);
        return Response.json({ 
          error: "Report not found",
          message: "The requested report ID does not exist or has expired." 
        }, { status: 404 });
      }

      const data = await stored.json() as any;
      
      // Check if this is still processing
      if (data.status === "processing") {
        logger.info("Resolution still processing", { report_id: reportId });
        metrics.counter("status.processing", 1);
        return Response.json({
          id: reportId,
          status: "processing",
          created_at: data.created_at,
          request: data.request,
          message: "Dependency resolution is still in progress. Please check again in a few seconds."
        });
      }

      // Check if this is an error report
      if (data.error && !data.result) {
        logger.info("Resolution failed", { report_id: reportId, error: data.error });
        metrics.counter("status.failed", 1);
        return Response.json({
          id: reportId,
          status: "failed",
          error: data.error,
          created_at: data.created_at
        });
      }

      // This is a completed report
      logger.info("Status retrieved successfully", {
        report_id: reportId,
        has_error: "error" in data,
      });
      metrics.counter("status.retrieved", 1);

      // Add status field for completed reports
      const completedData = {
        ...data,
        status: "completed"
      };

      return Response.json(completedData);
    } catch (error) {
      logger.error("Failed to retrieve report status", error as Error, {
        report_id: reportId,
      });
      metrics.counter("status.error", 1);
      return Response.json(
        { error: "Failed to retrieve report" },
        { status: 500 }
      );
    }
  }
}
