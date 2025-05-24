/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool } from "ai";
import { z } from "zod";

import { getCurrentAgent } from "agents";
import { unstable_scheduleSchema } from "agents/schedule";
import {
  type PackageInfo,
  type SearchResult,
  type DependencyConstraint,
  generatePackageKey,
} from "./shared";

/**
 * Weather information tool that requires human confirmation
 * When invoked, this will present a confirmation dialog to the user
 * The actual implementation is in the executions object below
 */
const getWeatherInformation = tool({
  description: "show the weather in a given city to the user",
  parameters: z.object({
    city: z.string().describe("The city to get the weather for"),
  }),
  // No execute function - this will require human confirmation
});

/**
 * Local time tool that executes automatically
 * This demonstrates a tool that runs without confirmation
 */
const getLocalTime = tool({
  description: "get the current local time",
  parameters: z.object({
    location: z.string().optional().describe("The location to get time for"),
  }),
  execute: async ({ location }) => {
    const time = new Date().toLocaleString();
    if (location) {
      return `The current time in ${location} is ${time}`;
    }
    return `The current local time is ${time}`;
  },
});

/**
 * Task scheduling tool
 * Shows how to work with scheduled agents
 */
const scheduleTask = tool({
  description: "schedule a task to run later",
  parameters: z.object({
    schedule: unstable_scheduleSchema,
    task: z.string().describe("description of the task to schedule"),
  }),
  execute: async ({ schedule, task }, context: any) => {
    const agentContext = getCurrentAgent();
    if (!agentContext?.agent) {
      throw new Error("No agent available for scheduling");
    }

    // Note: This is a placeholder - actual scheduling implementation depends on the agents framework
    return `Task "${task}" scheduled successfully with schedule: ${JSON.stringify(schedule)}`;
  },
});

const getScheduledTasks = tool({
  description: "get list of scheduled tasks",
  parameters: z.object({}),
  execute: async (params, context: any) => {
    const agentContext = getCurrentAgent();
    if (!agentContext?.agent) {
      throw new Error("No agent available");
    }

    // Implementation would depend on how scheduled tasks are stored
    return "No scheduled tasks found";
  },
});

const cancelScheduledTask = tool({
  description: "cancel a scheduled task",
  parameters: z.object({
    taskId: z.string().describe("ID of the task to cancel"),
  }),
  execute: async ({ taskId }, context: any) => {
    const agentContext = getCurrentAgent();
    if (!agentContext?.agent) {
      throw new Error("No agent available");
    }

    // Implementation would depend on how scheduled tasks are stored
    return `Task ${taskId} cancelled`;
  },
});

/**
 * Simplified PyPI Package Lookup Tool
 * Fetches basic but reliable package information from PyPI
 */
export const pypiLookupTool = tool({
  description: "Look up Python package information from PyPI",
  parameters: z.object({
    package_name: z
      .string()
      .describe("Name of the Python package to look up"),
    include_versions: z
      .boolean()
      .default(false)
      .describe("Include version information (may be slow for large packages)"),
  }),
  execute: async ({ package_name, include_versions }, context: any) => {
    try {
      console.log(`Looking up package: ${package_name}`);
      
      // Validate package name
      if (!package_name || package_name.trim().length === 0) {
        return { 
          success: false, 
          error: "Package name is required" 
        };
      }

      const cleanPackageName = package_name.trim().toLowerCase();
      
      // Try to get from cache first if available
      const { env } = context || {};
      let cached = null;
      if (env?.PACKAGE_CACHE) {
        try {
          const cacheKey = generatePackageKey(cleanPackageName);
          cached = await env.PACKAGE_CACHE.get(cacheKey);
          if (cached) {
            console.log(`Cache hit for ${cleanPackageName}`);
            const cachedData = JSON.parse(cached);
            console.log(`Cached data structure:`, Object.keys(cachedData));
            console.log(`Cached package version:`, cachedData.package?.latest_version);
            
            // Ensure the cached data has the expected structure
            if (cachedData.success && cachedData.package && cachedData.package.latest_version) {
              return cachedData;
            } else {
              console.log(`Cache data invalid, will re-fetch for ${cleanPackageName}`);
              // Clear invalid cache entry
              await env.PACKAGE_CACHE.delete(cacheKey);
            }
          }
        } catch (cacheError) {
          console.log("Cache error (continuing without cache):", cacheError);
        }
      }

      // Fetch from PyPI
      const pypiUrl = `https://pypi.org/pypi/${encodeURIComponent(cleanPackageName)}/json`;
      console.log(`Fetching from PyPI: ${pypiUrl}`);
      
      const response = await fetch(pypiUrl, {
        headers: {
          'User-Agent': 'Python-Dependency-Resolver/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { 
            success: false, 
            error: `Package '${package_name}' not found on PyPI. Check the spelling or try a different package name.` 
          };
        }
        return { 
          success: false, 
          error: `PyPI API error (${response.status}): ${response.statusText}` 
        };
      }

      const data = await response.json();
      
      // Type the PyPI API response structure
      const pypiData = data as {
        info?: {
          name?: string;
          summary?: string;
          description?: string;
          home_page?: string;
          project_url?: string;
          author?: string;
          license?: string;
          version?: string;
          requires_python?: string;
          keywords?: string;
          classifiers?: string[];
          maintainer?: string;
        };
        releases?: Record<string, Array<{
          upload_time?: string;
          yanked?: boolean;
          yanked_reason?: string;
        }>>;
      };
      
      // Extract basic information
      const packageInfo: {
        name: string;
        summary: string;
        description: string;
        home_page: string | null;
        author: string;
        license: string;
        latest_version: string;
        requires_python: string | null;
        keywords: string;
        classifiers: string[];
        maintainer: string;
        package_url: string;
        last_updated: string | null;
        total_downloads: null;
        versions?: Array<{
          version: string;
          upload_time: string | null;
          yanked: boolean;
          yanked_reason: string | null;
        }>;
      } = {
        name: pypiData.info?.name || package_name,
        summary: pypiData.info?.summary || "No summary available",
        description: pypiData.info?.description ? 
          (pypiData.info.description.length > 500 ? 
            pypiData.info.description.substring(0, 500) + "..." : 
            pypiData.info.description) : 
          "No description available",
        home_page: pypiData.info?.home_page || pypiData.info?.project_url || null,
        author: pypiData.info?.author || "Unknown",
        license: pypiData.info?.license || "Not specified",
        latest_version: pypiData.info?.version || "Unknown",
        requires_python: pypiData.info?.requires_python || null,
        keywords: pypiData.info?.keywords || "",
        classifiers: pypiData.info?.classifiers?.slice(0, 10) || [], // Limit to first 10
        maintainer: pypiData.info?.maintainer || pypiData.info?.author || "Unknown",
        package_url: `https://pypi.org/project/${pypiData.info?.name || package_name}/`,
        last_updated: null, // We'll get this from releases if needed
        total_downloads: null, // PyPI doesn't provide this in the JSON API
      };

      // Add version information if requested
      if (include_versions && pypiData.releases) {
        const versions = Object.keys(pypiData.releases)
          .filter(version => pypiData.releases![version] && pypiData.releases![version].length > 0)
          .map(version => {
            const release = pypiData.releases![version][0]; // Get first file info
            return {
              version,
              upload_time: release?.upload_time || null,
              yanked: release?.yanked || false,
              yanked_reason: release?.yanked_reason || null,
            };
          })
          .sort((a, b) => {
            // Simple version sort - latest first
            if (a.upload_time && b.upload_time) {
              return new Date(b.upload_time).getTime() - new Date(a.upload_time).getTime();
            }
            return 0;
          })
          .slice(0, 20); // Limit to 20 most recent versions
          
        packageInfo.versions = versions;
        
        // Get the upload time of the latest version
        const latestVersionData = versions.find(v => v.version === packageInfo.latest_version);
        if (latestVersionData?.upload_time) {
          packageInfo.last_updated = latestVersionData.upload_time;
        }
      }

      const result = {
        success: true,
        package: packageInfo,
        fetched_at: new Date().toISOString(),
        cache_used: false
      };

      // Cache the result if possible
      if (env?.PACKAGE_CACHE) {
        try {
          const cacheKey = generatePackageKey(cleanPackageName);
          await env.PACKAGE_CACHE.put(cacheKey, JSON.stringify(result), {
            expirationTtl: 3600, // 1 hour
          });
          console.log(`Cached result for ${cleanPackageName}`);
        } catch (cacheError) {
          console.log("Failed to cache result:", cacheError);
        }
      }

      return result;
      
    } catch (error: any) {
      console.error("PyPI lookup error:", error);
      return { 
        success: false, 
        error: `Failed to fetch package information: ${error.message}` 
      };
    }
  },
});

/**
 * Simple Package Deprecation Check Tool
 * Uses known deprecated packages and basic heuristics
 */
export const packageDeprecationAnalysisTool = tool({
  description: "Check if a Python package is deprecated or has known issues",
  parameters: z.object({
    package_name: z.string().describe("Name of the package to analyze"),
    check_detailed: z.boolean().default(false).describe("Perform detailed analysis (slower)"),
  }),
  execute: async ({ package_name, check_detailed }) => {
    try {
      const cleanPackageName = package_name.trim().toLowerCase();
      
      // Known deprecated packages database (expanded and more accurate)
      const deprecatedPackages: Record<string, {
        deprecated: boolean;
        reason: string;
        alternatives: string[];
        confidence: number;
        last_release: string;
        warning?: string;
      }> = {
        "nose": {
          deprecated: true,
          reason: "Nose has been in maintenance mode for several years and is not compatible with Python 3.10+",
          alternatives: ["pytest", "unittest"],
          confidence: 0.95,
          last_release: "2015-04-06"
        },
        "nose2": {
          deprecated: true,
          reason: "Nose2 development has slowed significantly, pytest is the recommended modern testing framework",
          alternatives: ["pytest"],
          confidence: 0.8,
          last_release: "2021-12-14"
        },
        "imp": {
          deprecated: true,
          reason: "The imp module is deprecated since Python 3.4 and removed in Python 3.12",
          alternatives: ["importlib"],
          confidence: 1.0,
          last_release: "built-in"
        },
        "distutils": {
          deprecated: true,
          reason: "distutils is deprecated since Python 3.10 and removed in Python 3.12",
          alternatives: ["setuptools", "build", "hatchling"],
          confidence: 1.0,
          last_release: "built-in"
        },
        "optparse": {
          deprecated: true,
          reason: "optparse is deprecated since Python 2.7 in favor of argparse",
          alternatives: ["argparse", "click", "typer"],
          confidence: 0.9,
          last_release: "built-in"
        },
        "setuptools": {
          deprecated: false,
          reason: "setuptools < 65.0 has various compatibility issues with modern Python",
          alternatives: ["setuptools>=65.0", "build", "poetry", "hatchling"],
          confidence: 0.3,
          last_release: "ongoing",
          warning: "Ensure you're using a recent version (>=65.0)"
        },
        "pkg_resources": {
          deprecated: true,
          reason: "pkg_resources is deprecated, use importlib.metadata instead",
          alternatives: ["importlib.metadata", "packaging"],
          confidence: 0.8,
          last_release: "part of setuptools"
        },
        "2to3": {
          deprecated: true,
          reason: "2to3 tool is deprecated as Python 2 end-of-life was reached",
          alternatives: ["modern Python 3 code"],
          confidence: 1.0,
          last_release: "built-in"
        }
      };

      const knownInfo = deprecatedPackages[cleanPackageName];
      
      if (knownInfo) {
        return {
          success: true,
          package_name: cleanPackageName,
          is_deprecated: knownInfo.deprecated,
          warning: knownInfo.warning || null,
          confidence: knownInfo.confidence,
          reason: knownInfo.reason,
          alternatives: knownInfo.alternatives,
          evidence: [`Known ${knownInfo.deprecated ? 'deprecated' : 'problematic'} package in database`],
          last_release: knownInfo.last_release,
          analysis_type: "database_lookup"
        };
      }

      // If not in database and detailed check is requested, do basic analysis
      if (check_detailed) {
        // This could be expanded to check PyPI metadata, GitHub activity, etc.
        return {
          success: true,
          package_name: cleanPackageName,
          is_deprecated: false,
          confidence: 0.1,
          reason: "No deprecation information found",
          alternatives: [],
          evidence: ["Package not found in known deprecated packages database"],
          analysis_type: "basic_check",
          note: "For detailed analysis, consider checking the package's PyPI page, GitHub repository, or documentation manually."
        };
      }

      return {
        success: true,
        package_name: cleanPackageName,
        is_deprecated: false,
        confidence: 0.0,
        reason: "Package not in known deprecated packages list",
        alternatives: [],
        evidence: [],
        analysis_type: "quick_check"
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to analyze package deprecation: ${error.message}`
      };
    }
  },
});

/**
 * Simplified Dependency Resolution Tool
 * Provides basic conflict detection and suggestions - compatible with existing agent interface
 */
export const dependencyResolutionTool = tool({
  description: "Analyze Python package dependencies and detect potential conflicts",
  parameters: z.object({
    requirements: z
      .array(z.object({
        name: z.string(),
        operator: z.string(),
        version: z.string().optional(),
        fixed: z.boolean().default(false),
        original_spec: z.string(),
      }))
      .describe("List of dependency constraint objects"),
    python_version: z.string().default("3.9").describe("Target Python version"),
    allow_prereleases: z.boolean().default(false).describe("Allow pre-release versions"),
  }),
  execute: async ({ requirements, python_version, allow_prereleases }, context: any) => {
    try {
      console.log(`Analyzing ${requirements.length} requirements for Python ${python_version}`);
      
      if (!requirements || requirements.length === 0) {
        return {
          success: false,
          error: "No requirements provided"
        };
      }

      const startTime = Date.now();
      const resolved_packages: Array<{ name: string; version: string }> = [];
      const deprecated_packages: Array<{
        name: string;
        version: string;
        reason: string;
        suggested_alternative?: string;
      }> = [];
      const conflicts: Array<{
        packages: string[];
        reason: string;
        suggested_resolution?: string;
      }> = [];
      const warnings: string[] = [];

      // Built-in Python modules that are deprecated but not on PyPI
      const builtInDeprecated: Record<string, {
        deprecated: boolean;
        reason: string;
        alternatives: string[];
        version: string;
      }> = {
        "imp": {
          deprecated: true,
          reason: "The imp module is deprecated since Python 3.4 and removed in Python 3.12",
          alternatives: ["importlib"],
          version: "built-in"
        },
        "optparse": {
          deprecated: true,
          reason: "optparse is deprecated since Python 2.7 in favor of argparse",
          alternatives: ["argparse", "click", "typer"],
          version: "built-in"
        },
        "distutils": {
          deprecated: true,
          reason: "distutils is deprecated since Python 3.10 and removed in Python 3.12",
          alternatives: ["setuptools", "build", "hatchling"],
          version: "built-in"
        }
      };

      // Process each requirement
      for (const req of requirements) {
        try {
          // Validate package name
          const cleanName = req.name?.trim();
          if (!cleanName || cleanName.length === 0) {
            warnings.push(`Empty package name provided: '${req.name}'`);
            continue;
          }

          // Check if it's a built-in module first
          const builtInInfo = builtInDeprecated[cleanName.toLowerCase()];
          if (builtInInfo) {
            // Add to resolved packages
            resolved_packages.push({
              name: cleanName,
              version: builtInInfo.version
            });

            // Add to deprecated if applicable
            if (builtInInfo.deprecated) {
              deprecated_packages.push({
                name: cleanName,
                version: builtInInfo.version,
                reason: builtInInfo.reason,
                suggested_alternative: builtInInfo.alternatives[0]
              });
            }
            continue;
          }

          // Look up package info from PyPI
          const packageLookup = await pypiLookupTool.execute(
            { package_name: cleanName, include_versions: false },
            context
          );
          
          if (!packageLookup.success) {
            warnings.push(`Could not find package '${cleanName}': ${packageLookup.error}`);
            continue;
          }

          // Determine the version to use
          let resolvedVersion = packageLookup.package?.latest_version || "unknown";
          
          // If a specific version is requested, validate it exists
          if (req.version && req.operator) {
            if (req.operator === "==" || req.fixed) {
              // For exact versions, we should validate but for now just use it
              resolvedVersion = req.version;
            } else if (req.operator === ">=" || req.operator === ">") {
              // For minimum versions, use latest if it's newer
              resolvedVersion = packageLookup.package?.latest_version || req.version;
            } else {
              // For other operators, use the specified version or latest
              resolvedVersion = req.version || packageLookup.package?.latest_version || "unknown";
            }
          } else {
            // No version constraint specified, use latest available
            resolvedVersion = packageLookup.package?.latest_version || "unknown";
          }

          // Add to resolved packages
          resolved_packages.push({
            name: cleanName,
            version: resolvedVersion
          });

          // Check for deprecation
          const deprecationCheck = await packageDeprecationAnalysisTool.execute(
            { package_name: cleanName, check_detailed: false },
            context
          );
          
          if (deprecationCheck.success && deprecationCheck.is_deprecated) {
            deprecated_packages.push({
              name: cleanName,
              version: resolvedVersion,
              reason: deprecationCheck.reason || "Package is deprecated",
              suggested_alternative: deprecationCheck.alternatives?.[0]
            });
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          warnings.push(`Error processing requirement '${req.name}': ${errorMessage}`);
        }
      }

      // Basic conflict detection
      const packageNames = new Set();
      const duplicatePackages: string[] = [];
      
      for (const pkg of resolved_packages) {
        if (packageNames.has(pkg.name)) {
          duplicatePackages.push(pkg.name);
        } else {
          packageNames.add(pkg.name);
        }
      }
      
      if (duplicatePackages.length > 0) {
        conflicts.push({
          packages: duplicatePackages,
          reason: "Multiple requirements for the same package found",
          suggested_resolution: "Review and consolidate duplicate package requirements"
        });
      }

      // Determine overall success - succeed if we have deprecated packages to report, even with warnings
      const hasSignificantIssues = conflicts.length > 0;
      const hasUsefulResults = resolved_packages.length > 0 || deprecated_packages.length > 0;
      const success = !hasSignificantIssues && hasUsefulResults;

      const result = {
        success,
        resolved_packages,
        deprecated_packages: deprecated_packages.length > 0 ? deprecated_packages : undefined,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
        error: (!success && hasSignificantIssues) ? `Found ${conflicts.length} conflicts` : 
               (!success && !hasUsefulResults) ? `No packages could be resolved` :
               undefined,
        // Additional metadata for compatibility
        processing_time_ms: Date.now() - startTime,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      return result;
      
    } catch (error: any) {
      return {
        success: false,
        error: `Dependency analysis failed: ${error.message}`
      };
    }
  },
});

/**
 * Simple Requirements File Generator - compatible with existing agent interface
 */
export const requirementsGeneratorTool = tool({
  description: "Generate a requirements.txt file from resolved dependencies",
  parameters: z.object({
    resolved_packages: z
      .array(z.object({
        name: z.string(),
        version: z.string(),
        source: z.string(),
      }))
      .describe("List of resolved packages with source"),
    include_comments: z
      .boolean()
      .default(true)
      .describe("Include helpful comments in the output"),
    pin_versions: z
      .boolean()
      .default(false)
      .describe("Pin to exact versions (==) instead of minimum versions (>=)"),
  }),
  execute: async ({ resolved_packages, include_comments, pin_versions }) => {
    try {
      let content = "";

      if (include_comments) {
        content += "# Python Requirements File\n";
        content += `# Generated on: ${new Date().toISOString()}\n`;
        content += `# Total packages: ${resolved_packages.length}\n`;
        content += "#\n";
        content += "# Install with: pip install -r requirements.txt\n";
        content += "#\n\n";
      }

      // Sort packages alphabetically
      const sortedPackages = [...resolved_packages].sort((a, b) => a.name.localeCompare(b.name));

      for (const pkg of sortedPackages) {
        const operator = pin_versions ? "==" : ">=";
        content += `${pkg.name}${operator}${pkg.version}`;
        
        if (include_comments && pkg.source && pkg.source !== "pypi") {
          content += `  # ${pkg.source}`;
        }
        
        content += "\n";
      }

      if (include_comments && resolved_packages.length > 0) {
        content += "\n# End of requirements\n";
      }

      return {
        requirements_txt: content
      };
      
    } catch (error: any) {
      return {
        error: `Failed to generate requirements file: ${error.message}`
      };
    }
  },
});

/**
 * Simplified Web Search Tool (fallback when Google API not available)
 */
export const webSearchTool = tool({
  description: "Search for package information (requires Google Search API configuration)",
  parameters: z.object({
    query: z.string().describe("Search query"),
    package_name: z.string().optional().describe("Package name for context"),
    max_results: z.number().default(5).describe("Maximum number of results"),
  }),
  execute: async ({ query, package_name, max_results }, context: any) => {
    const { env } = context || {};
    
    if (!env?.GOOGLE_SEARCH_API_KEY || !env?.GOOGLE_SEARCH_ENGINE_ID) {
      return {
        success: false,
        error: "Web search not configured. Please set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables.",
        fallback_suggestions: [
          `Search manually: https://www.google.com/search?q=${encodeURIComponent(query)}`,
          package_name ? `Check PyPI directly: https://pypi.org/project/${encodeURIComponent(package_name)}/` : null,
          package_name ? `Check GitHub: https://github.com/search?q=${encodeURIComponent(package_name)}&type=repositories` : null,
        ].filter(Boolean)
      };
    }

    try {
      const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
      searchUrl.searchParams.set("key", env.GOOGLE_SEARCH_API_KEY);
      searchUrl.searchParams.set("cx", env.GOOGLE_SEARCH_ENGINE_ID);
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("num", Math.min(max_results, 10).toString());

      const response = await fetch(searchUrl.toString());
      
      if (!response.ok) {
        throw new Error(`Search API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Type the Google Search API response structure
      const searchData = data as {
        items?: Array<{
          title: string;
          link: string;
          snippet: string;
          displayLink: string;
        }>;
        searchInformation?: {
          searchTime?: string;
        };
      };
      
      const results = (searchData.items || []).map((item) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink,
      }));

      return {
        success: true,
        results,
        query,
        total_results: results.length,
        search_time: searchData.searchInformation?.searchTime || null
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: `Search failed: ${error.message}`,
        fallback_suggestions: [
          `Search manually: https://www.google.com/search?q=${encodeURIComponent(query)}`,
        ]
      };
    }
  },
});

// Helper functions
function parseRequirement(requirement: string): { name: string; operator: string; version?: string } {
  // Simple parser for requirements like "numpy>=1.19.0" or "django==3.2.5"
  const patterns = [
    /^([a-zA-Z0-9\-_.]+)\s*(==|>=|>|<=|<|!=|~=|===)\s*([^,\s;]+)/,
    /^([a-zA-Z0-9\-_.]+)$/,
  ];

  const cleanReq = requirement.trim();
  
  for (const pattern of patterns) {
    const match = cleanReq.match(pattern);
    if (match) {
      const [, name, operator = "", version] = match;
      return {
        name: name.toLowerCase().trim(),
        operator: operator || "",
        version: version ? version.trim() : undefined,
      };
    }
  }

  throw new Error(`Invalid requirement format: ${requirement}`);
}

/**
 * Export all available tools
 * These will be provided to the AI model to describe available capabilities
 */
export const tools = {
  getWeatherInformation,
  getLocalTime,
  scheduleTask,
  getScheduledTasks,
  cancelScheduledTask,
  pypi_lookup: pypiLookupTool,
  web_search: webSearchTool,
  dependency_resolution: dependencyResolutionTool,
  package_deprecation_analysis: packageDeprecationAnalysisTool,
  requirements_generator: requirementsGeneratorTool,
};

/**
 * Implementation of confirmation-required tools
 * This object contains the actual logic for tools that need human approval
 * Each function here corresponds to a tool above that doesn't have an execute function
 */
export const executions = {
  getWeatherInformation: async ({ city }: { city: string }) => {
    console.log(`Getting weather information for ${city}`);
    return `The weather in ${city} is sunny`;
  },
};
