import { Agent, routeAgentRequest, type Schedule } from "agents";
import {
  createDataStreamResponse,
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  type ToolSet,
} from "ai";
import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import { tools } from "./tools";
import {
  type Env,
  type ResolutionRequest,
  type DependencyReport,
  parseRequirementString,
  generateReportKey,
  ResolutionRequestSchema,
} from "./shared";
import {
  createLogger,
  createMetrics,
  timeAsync,
  generateTraceId,
  generateRequestId,
  enrichErrorContext,
  type Logger,
  type MetricsCollector,
} from "./logger";

// Get the appropriate AI client based on environment configuration
const getAIClient = (env: Env) => {
  if (env.AZURE_OPENAI_RESOURCE_NAME && env.AZURE_OPENAI_DEPLOYMENT_NAME) {
    if (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_GATEWAY_ID) {
      const baseURL = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_GATEWAY_ID}/azure-openai/${env.AZURE_OPENAI_RESOURCE_NAME}/${env.AZURE_OPENAI_DEPLOYMENT_NAME}`;

      return createAzure({
        apiKey: env.AZURE_OPENAI_API_KEY!,
        resourceName: env.AZURE_OPENAI_RESOURCE_NAME,
        apiVersion: env.AZURE_OPENAI_API_VERSION || "2024-10-01-preview",
        baseURL,
      });
    }

    return createAzure({
      apiKey: env.AZURE_OPENAI_API_KEY!,
      resourceName: env.AZURE_OPENAI_RESOURCE_NAME,
      apiVersion: env.AZURE_OPENAI_API_VERSION || "2024-10-01-preview",
    });
  }

  const baseURL =
    env.OPENAI_GATEWAY_BASEURL ||
    (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_GATEWAY_ID
      ? `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_GATEWAY_ID}/openai`
      : undefined);

  return createOpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL,
  });
};

/**
 * Main Dependency Resolver Agent
 * Orchestrates the entire dependency resolution process
 */
export class DependencyResolverAgent extends Agent<Env> {
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor(state: any, env: Env) {
    super(state, env);
    this.logger = createLogger(env, "DependencyResolverAgent");
    this.metrics = createMetrics();
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

      // Phase 1: Research each package
      childLogger.info("Starting package research phase");
      const { result: packageResearchResults, duration_ms: researchDuration } =
        await timeAsync(
          () =>
            this.researchPackages(
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

  private async researchPackages(
    packageNames: string[],
    logger: Logger,
    metrics: MetricsCollector
  ): Promise<Map<string, any>> {
    const results = new Map();

    logger.info("Starting package research", {
      package_count: packageNames.length,
    });

    for (const packageName of packageNames) {
      const packageLogger = logger.child({ package: packageName });

      try {
        packageLogger.debug("Researching package");

        // Get basic package info from PyPI
        const pypiInfo = await tools.pypi_lookup.execute(
          { package_name: packageName, include_versions: true },
          { env: this.env } as any
        );

        // Search for deprecation information
        const deprecationSearch = await tools.web_search.execute(
          {
            query: `${packageName} python package deprecated unmaintained`,
            package_name: packageName,
            search_type: "deprecation" as const,
          },
          { env: this.env } as any
        );

        // Search for alternatives
        const alternativesSearch = await tools.web_search.execute(
          {
            query: `${packageName} python package alternatives replacement`,
            package_name: packageName,
            search_type: "alternatives" as const,
          },
          { env: this.env } as any
        );

        // Analyze deprecation status
        let deprecationAnalysis = null;
        if (!("error" in pypiInfo) && !("error" in deprecationSearch)) {
          deprecationAnalysis =
            await tools.package_deprecation_analysis.execute(
              {
                package_name: packageName,
                search_results: deprecationSearch.results || [],
                package_info: {
                  latest_version: pypiInfo.latest_version,
                  author: pypiInfo.author,
                  description: pypiInfo.description,
                },
              },
              {} as any
            );
        }

        const packageResult = {
          pypi_info: pypiInfo,
          deprecation_search: deprecationSearch,
          alternatives_search: alternativesSearch,
          deprecation_analysis: deprecationAnalysis,
        };

        results.set(packageName, packageResult);

        packageLogger.info("Package research completed", {
          has_pypi_info: !("error" in pypiInfo),
          has_deprecation_info: !("error" in deprecationSearch),
          is_deprecated: deprecationAnalysis?.is_deprecated || false,
        });

        metrics.counter("research.package_completed", 1, {
          package: packageName,
          deprecated: String(deprecationAnalysis?.is_deprecated || false),
        });
      } catch (error) {
        const enrichedError = enrichErrorContext(error as Error, {
          package: packageName,
        });
        packageLogger.error("Error researching package", enrichedError);
        results.set(packageName, {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        metrics.counter("research.package_failed", 1, { package: packageName });
      }
    }

    logger.info("Package research completed", {
      total_packages: packageNames.length,
      successful: Array.from(results.values()).filter((r) => !r.error).length,
      failed: Array.from(results.values()).filter((r) => r.error).length,
    });

    return results;
  }

  private async resolveDependencies(
    request: ResolutionRequest,
    researchResults: Map<string, any>,
    logger: Logger,
    metrics: MetricsCollector
  ) {
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
        fixed: req.fixed,
      }));

      const resolutionResult = await tools.dependency_resolution.execute(
        {
          requirements,
          python_version: request.python_version,
          allow_prereleases: request.allow_prereleases,
        },
        { env: this.env } as any
      );

      // Enhance the result with deprecation information
      if (
        "resolved_packages" in resolutionResult &&
        resolutionResult.resolved_packages
      ) {
        for (const pkg of resolutionResult.resolved_packages) {
          const research = researchResults.get(pkg.name);
          if (research?.deprecation_analysis?.is_deprecated) {
            // Add deprecated_packages property if it doesn't exist
            if (!("deprecated_packages" in resolutionResult)) {
              (resolutionResult as any).deprecated_packages = [];
            }
            (resolutionResult as any).deprecated_packages.push({
              name: pkg.name,
              version: pkg.version,
              reason: research.deprecation_analysis.evidence.join("; "),
              suggested_alternative:
                research.deprecation_analysis.alternatives[0],
            });
          }
        }
      }

      const success =
        "success" in resolutionResult ? resolutionResult.success : false;
      logger.info("Dependency resolution completed", {
        success,
        resolved_count: resolutionResult.resolved_packages?.length || 0,
        conflict_count: resolutionResult.conflicts?.length || 0,
        deprecated_count:
          (resolutionResult as any).deprecated_packages?.length || 0,
      });

      metrics.counter("resolution.dependency_resolution_completed", 1, {
        success: String(success),
      });

      return resolutionResult;
    } catch (error) {
      logger.error("Dependency resolution failed", error as Error);
      metrics.counter("resolution.dependency_resolution_failed", 1);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async generateReport(
    reportId: string,
    request: ResolutionRequest,
    resolutionResult: any,
    researchResults: Map<string, any>,
    startTime: number,
    logger: Logger
  ): Promise<DependencyReport> {
    logger.info("Generating report", { report_id: reportId });

    // Generate requirements.txt file
    let requirementsTxt = "";
    if ("resolved_packages" in resolutionResult) {
      const reqResult = await tools.requirements_generator.execute(
        {
          resolved_packages: resolutionResult.resolved_packages,
          include_comments: true,
          pin_versions: true,
        },
        {} as any
      );
      requirementsTxt = reqResult.requirements_txt;
    }

    // Generate detailed markdown report
    const detailedReport = await this.generateDetailedReport(
      request,
      resolutionResult,
      researchResults,
      logger
    );

    // Create package analysis
    const packageAnalysis = Array.from(researchResults.entries()).map(
      ([name, research]) => {
        const resolvedPkg =
          "resolved_packages" in resolutionResult
            ? resolutionResult.resolved_packages.find(
                (p: any) => p.name === name
              )
            : null;

        return {
          name,
          current_version: research.pypi_info?.latest_version || "unknown",
          recommended_version: resolvedPkg?.version || "unresolved",
          analysis: this.generatePackageAnalysis(research),
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
        deprecated_count:
          (resolutionResult as any).deprecated_packages?.length || 0,
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
    resolutionResult: any,
    researchResults: Map<string, any>,
    logger: Logger
  ): Promise<string> {
    logger.debug("Generating detailed markdown report");

    let report = "# Python Dependency Resolution Report\n\n";
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Python Version:** ${request.python_version}\n`;
    report += `**Total Packages:** ${request.requirements.length}\n\n`;

    // Summary
    if ("success" in resolutionResult) {
      report += "## Summary\n\n";
      if (resolutionResult.success) {
        report += "✅ **Resolution Status:** Successful\n";
      } else {
        report += "❌ **Resolution Status:** Failed\n";
      }

      if (resolutionResult.conflicts?.length > 0) {
        report += `⚠️ **Conflicts:** ${resolutionResult.conflicts.length}\n`;
      }

      if (resolutionResult.deprecated_packages?.length > 0) {
        report += `🔄 **Deprecated Packages:** ${resolutionResult.deprecated_packages.length}\n`;
      }
    }

    // Resolved packages
    if (
      "resolved_packages" in resolutionResult &&
      resolutionResult.resolved_packages.length > 0
    ) {
      report += "\n## Resolved Packages\n\n";
      for (const pkg of resolutionResult.resolved_packages) {
        report += `- **${pkg.name}** = ${pkg.version}\n`;
      }
    }

    // Deprecated packages
    if (resolutionResult.deprecated_packages?.length > 0) {
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
    if (resolutionResult.conflicts?.length > 0) {
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

  private generatePackageAnalysis(research: any): string {
    if (research.error) {
      return `Error: ${research.error}`;
    }

    let analysis = "";

    if (research.pypi_info && !("error" in research.pypi_info)) {
      analysis += `PyPI package with ${research.pypi_info.versions?.length || 0} versions. `;
    }

    if (research.deprecation_analysis?.is_deprecated) {
      analysis += `⚠️ DEPRECATED (confidence: ${Math.round(research.deprecation_analysis.confidence * 100)}%). `;
      if (research.deprecation_analysis.alternatives.length > 0) {
        analysis += `Consider: ${research.deprecation_analysis.alternatives.join(", ")}. `;
      }
    }

    return analysis || "No specific issues found.";
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
        return Response.json({ error: "Report not found" }, { status: 404 });
      }

      const data = (await stored.json()) as any;
      logger.info("Status retrieved successfully", {
        report_id: reportId,
        has_error: !!data.error,
      });
      metrics.counter("status.retrieved", 1);

      return Response.json(data);
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

/**
 * Package Research Agent - Specialized for gathering package information
 */
export class PackageResearchAgent extends Agent<Env> {
  private logger: Logger;

  constructor(state: any, env: Env) {
    super(state, env);
    this.logger = createLogger(env, "PackageResearchAgent");
  }

  async onRequest(request: Request) {
    const traceId = generateTraceId();
    const requestId = generateRequestId();
    const logger = this.logger.withTracing(traceId, requestId);

    try {
      const body = (await request.json()) as { package_name?: string };
      const { package_name } = body;

      if (!package_name) {
        logger.warn("Missing package_name in request");
        return Response.json(
          { error: "package_name is required" },
          { status: 400 }
        );
      }

      logger.info("Research request received", { package_name });
      const research = await this.researchPackage(package_name, logger);
      return Response.json(research);
    } catch (error) {
      logger.error("Package research failed", error as Error);
      return Response.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  }

  private async researchPackage(packageName: string, logger: Logger) {
    logger.info("Starting package research", { package: packageName });
    // Implementation similar to the research logic in DependencyResolverAgent
    // This can be extracted into a shared service
    return {
      message: "Package research functionality - to be implemented",
      package: packageName,
    };
  }
}

/**
 * Report Generator Agent - Specialized for generating comprehensive reports
 */
export class ReportGeneratorAgent extends Agent<Env> {
  private logger: Logger;

  constructor(state: any, env: Env) {
    super(state, env);
    this.logger = createLogger(env, "ReportGeneratorAgent");
  }

  async onRequest(request: Request) {
    const traceId = generateTraceId();
    const logger = this.logger.withTracing(traceId);

    try {
      const body = await request.json();
      logger.info("Report generation request received");
      // Implementation for generating reports
      return Response.json({
        message: "Report generation functionality - to be implemented",
      });
    } catch (error) {
      logger.error("Report generation failed", error as Error);
      return Response.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  }
}

/**
 * Worker entry point that routes incoming requests
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const logger = createLogger(env);
    const metrics = createMetrics();

    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      logger.info("Health check requested");
      metrics.counter("health_check", 1);
      return Response.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT || "unknown",
      });
    }

    // API key check
    if (url.pathname === "/check-api-keys") {
      const hasOpenAI = !!(env.OPENAI_API_KEY || env.AZURE_OPENAI_API_KEY);
      const hasSearch = !!(
        env.GOOGLE_SEARCH_API_KEY && env.GOOGLE_SEARCH_ENGINE_ID
      );

      logger.info("API key check requested", { hasOpenAI, hasSearch });

      return Response.json({
        openai: hasOpenAI,
        search: hasSearch,
        provider: env.AZURE_OPENAI_API_KEY ? "azure" : "openai",
      });
    }

    // Test bindings directly
    if (url.pathname === "/test-bindings") {
      logger.info("Testing bindings directly");
      try {
        // Test KV namespace
        await env.PACKAGE_CACHE.put("test-key", "test-value", {
          expirationTtl: 60,
        });
        const kvValue = await env.PACKAGE_CACHE.get("test-key");

        // Test R2 bucket
        await env.REPORTS_STORAGE.put(
          "test-report.json",
          JSON.stringify({ test: "data" })
        );
        const r2Object = await env.REPORTS_STORAGE.get("test-report.json");
        const r2Content = r2Object ? await r2Object.text() : null;

        return Response.json({
          success: true,
          tests: {
            kv_write_read: kvValue === "test-value",
            r2_write_read: r2Content === '{"test":"data"}',
            kv_value: kvValue,
            r2_content: r2Content,
          },
          bindings_available: {
            package_cache: !!env.PACKAGE_CACHE,
            reports_storage: !!env.REPORTS_STORAGE,
            agent_namespace: !!env.DependencyResolverAgent,
          },
        });
      } catch (error) {
        logger.error("Bindings test failed", error as Error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    // Check for required API keys
    if (!(env.OPENAI_API_KEY || env.AZURE_OPENAI_API_KEY)) {
      logger.error("No AI API key configured");
      metrics.counter("configuration_error", 1, { type: "missing_api_key" });
      return Response.json(
        {
          error: "AI service not configured",
        },
        { status: 503 }
      );
    }

    // Route to agents
    logger.debug("Routing request to agents", { pathname: url.pathname });
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
