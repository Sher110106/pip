import { tools } from "../tools";
import type { Env } from "../shared";
import {
  enrichErrorContext,
  type Logger,
  type MetricsCollector,
} from "../logger";

// Tool return type interfaces
export interface PyPILookupResult {
  name: string;
  summary?: string;
  description?: string;
  home_page?: string;
  author?: string;
  license?: string;
  latest_version: string;
  requires_python?: string;
  versions: Array<{
    name: string;
    version: string;
    requires_python?: string;
    dependencies: string[];
    upload_time?: string;
    yanked: boolean;
    yanked_reason?: string;
  }>;
  deprecated: boolean;
  alternatives: string[];
  maintainer_status: "active" | "maintenance" | "deprecated" | "abandoned";
}

export interface WebSearchResult {
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    relevance_score?: number;
  }>;
  total_results: number;
}

export interface DeprecationAnalysisResult {
  is_deprecated: boolean;
  confidence: number;
  evidence: string[];
  alternatives: string[];
}

export interface PackageResearchResult {
  pypi_info: PyPILookupResult | { error: string };
  deprecation_search: WebSearchResult | { error: string };
  alternatives_search: WebSearchResult | { error: string };
  deprecation_analysis: DeprecationAnalysisResult | null;
}

/**
 * Service for researching Python packages
 * Centralizes the package research logic used by multiple agents
 */
export class PackageResearchService {
  constructor(private env: Env) {}

  async researchPackage(
    packageName: string,
    logger: Logger,
    metrics?: MetricsCollector
  ): Promise<PackageResearchResult | { error: string }> {
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
      let deprecationAnalysis: DeprecationAnalysisResult | null = null;
      if (!("error" in pypiInfo) && !("error" in deprecationSearch)) {
        deprecationAnalysis = await tools.package_deprecation_analysis.execute(
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
        ) as DeprecationAnalysisResult;
      }

      const result: PackageResearchResult = {
        pypi_info: pypiInfo,
        deprecation_search: deprecationSearch,
        alternatives_search: alternativesSearch,
        deprecation_analysis: deprecationAnalysis,
      };

      packageLogger.info("Package research completed", {
        has_pypi_info: !("error" in pypiInfo),
        has_deprecation_info: !("error" in deprecationSearch),
        is_deprecated: deprecationAnalysis?.is_deprecated || false,
      });

      if (metrics) {
        metrics.counter("research.package_completed", 1, {
          package: packageName,
          deprecated: String(deprecationAnalysis?.is_deprecated || false),
        });
      }

      return result;
    } catch (error) {
      const enrichedError = enrichErrorContext(error as Error, {
        package: packageName,
      });
      packageLogger.error("Error researching package", enrichedError);

      if (metrics) {
        metrics.counter("research.package_failed", 1, { package: packageName });
      }

      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async researchMultiplePackages(
    packageNames: string[],
    logger: Logger,
    metrics?: MetricsCollector
  ): Promise<Map<string, PackageResearchResult | { error: string }>> {
    const results = new Map();

    logger.info("Starting package research", {
      package_count: packageNames.length,
    });

    for (const packageName of packageNames) {
      const result = await this.researchPackage(packageName, logger, metrics);
      results.set(packageName, result);
    }

    logger.info("Package research completed", {
      total_packages: packageNames.length,
      successful: Array.from(results.values()).filter((r) => !("error" in r))
        .length,
      failed: Array.from(results.values()).filter((r) => "error" in r).length,
    });

    return results;
  }

  generatePackageAnalysis(
    research: PackageResearchResult | { error: string }
  ): string {
    if ("error" in research) {
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
}