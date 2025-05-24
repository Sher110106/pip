import { z } from "zod";

// Approval string to be shared across frontend and backend
export const APPROVAL = {
  YES: "Yes, confirmed.",
  NO: "No, denied.",
} as const;

// Environment interface for Cloudflare bindings
export interface Env {
  // AI and API Keys
  OPENAI_API_KEY?: string;
  AZURE_OPENAI_API_KEY?: string;
  AZURE_OPENAI_RESOURCE_NAME?: string;
  AZURE_OPENAI_DEPLOYMENT_NAME?: string;
  AZURE_OPENAI_API_VERSION?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_GATEWAY_ID?: string;
  OPENAI_GATEWAY_BASEURL?: string;
  GOOGLE_SEARCH_API_KEY?: string;
  GOOGLE_SEARCH_ENGINE_ID?: string;

  // GitHub App Configuration
  GITHUB_APP_ID?: string;
  GITHUB_PRIVATE_KEY?: string;
  GITHUB_WEBHOOK_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_ENTERPRISE_HOST?: string;

  // Application Configuration
  BASE_URL?: string;
  ENVIRONMENT?: string;
  LOG_LEVEL?: string;

  // Cloudflare Bindings
  PACKAGE_CACHE: KVNamespace;
  REPORTS_STORAGE: R2Bucket;

  // Agent Bindings
  DependencyResolverAgent: DurableObjectNamespace;
  PackageResearchAgent: DurableObjectNamespace;
  ReportGeneratorAgent: DurableObjectNamespace;
  DEPENDENCY_RESOLUTION_QUEUE: Queue;
}

// Package information schemas
export const PackageVersionSchema = z.object({
  name: z.string(),
  version: z.string(),
  requires_python: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  upload_time: z.string().optional(),
  yanked: z.boolean().default(false),
  yanked_reason: z.string().optional(),
});

export const PackageInfoSchema = z.object({
  name: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  home_page: z.string().optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  versions: z.array(PackageVersionSchema),
  latest_version: z.string(),
  requires_python: z.string().optional(),
  deprecated: z.boolean().default(false),
  deprecation_reason: z.string().optional(),
  alternatives: z.array(z.string()).default([]),
  maintainer_status: z
    .enum(["active", "maintenance", "deprecated", "abandoned"])
    .default("active"),
});

// Dependency resolution schemas
export const DependencyConstraintSchema = z.object({
  name: z.string(),
  operator: z
    .enum(["==", ">=", ">", "<=", "<", "!=", "~=", "===", ""])
    .default(""),
  version: z.string().optional(),
  fixed: z.boolean().default(false), // User explicitly wants this version
  original_spec: z.string(), // Original requirement string like "package>=1.0,<2.0"
});

export const ResolutionRequestSchema = z.object({
  requirements: z.array(DependencyConstraintSchema),
  python_version: z.string().default("3.9"),
  allow_prereleases: z.boolean().default(false),
  prefer_stable: z.boolean().default(true),
  exclude_deprecated: z.boolean().default(true),
  suggest_alternatives: z.boolean().default(true),
});

export const ConflictInfoSchema = z.object({
  packages: z.array(z.string()),
  reason: z.string(),
  suggested_resolution: z.string().optional(),
});

export const ResolutionResultSchema = z.object({
  success: z.boolean(),
  resolved_packages: z
    .array(
      z.object({
        name: z.string(),
        version: z.string(),
      })
    )
    .optional(),
  deprecated_packages: z
    .array(
      z.object({
        name: z.string(),
        version: z.string(),
        reason: z.string(),
        suggested_alternative: z.string().optional(),
      })
    )
    .optional(),
  conflicts: z.array(ConflictInfoSchema).optional(),
  error: z.string().optional(),
});

export const RequirementsGeneratorResultSchema = z.object({
  requirements_txt: z.string(),
});

// Agent communication schemas
export const AgentTaskSchema = z.object({
  id: z.string(),
  type: z.enum([
    "parse_requirements",
    "research_packages",
    "resolve_dependencies",
    "verify_compatibility",
    "generate_report",
  ]),
  data: z.record(z.any()),
  priority: z.number().default(1),
  created_at: z.date(),
  timeout_ms: z.number().default(300000), // 5 minutes
});

export const AgentResponseSchema = z.object({
  task_id: z.string(),
  success: z.boolean(),
  data: z.record(z.any()),
  error: z.string().optional(),
  processing_time_ms: z.number(),
  agent_id: z.string(),
});

// Report generation schemas
export const DependencyReportSchema = z.object({
  id: z.string(),
  created_at: z.date(),
  request: ResolutionRequestSchema,
  result: ResolutionResultSchema,
  requirements_txt: z.string(),
  detailed_report: z.string(), // Markdown formatted report
  package_analysis: z.array(
    z.object({
      name: z.string(),
      current_version: z.string(),
      recommended_version: z.string(),
      analysis: z.string(),
      security_notes: z.array(z.string()).default([]),
      compatibility_notes: z.array(z.string()).default([]),
    })
  ),
  metadata: z.object({
    python_version: z.string(),
    total_packages: z.number(),
    deprecated_count: z.number(),
    conflict_count: z.number(),
    processing_time_ms: z.number(),
  }),
});

// Search and research schemas
export const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  relevance_score: z.number().optional(),
});

export const PackageResearchSchema = z.object({
  package_name: z.string(),
  pypi_data: PackageInfoSchema.optional(),
  search_results: z.array(SearchResultSchema).default([]),
  deprecation_analysis: z.object({
    is_deprecated: z.boolean(),
    confidence: z.number(), // 0-1
    evidence: z.array(z.string()),
    alternatives: z.array(z.string()),
  }),
  security_analysis: z.object({
    known_vulnerabilities: z.array(z.string()).default([]),
    last_updated: z.string().optional(),
    maintenance_status: z.string(),
  }),
  compatibility_analysis: z.object({
    python_versions: z.array(z.string()),
    platform_support: z.array(z.string()),
    dependency_conflicts: z.array(z.string()).default([]),
  }),
});

// Type exports
export type PackageVersion = z.infer<typeof PackageVersionSchema>;
export type PackageInfo = z.infer<typeof PackageInfoSchema>;
export type DependencyConstraint = z.infer<typeof DependencyConstraintSchema>;
export type ResolutionRequest = z.infer<typeof ResolutionRequestSchema>;
export type ConflictInfo = z.infer<typeof ConflictInfoSchema>;
export type ResolutionResult = z.infer<typeof ResolutionResultSchema>;
export type RequirementsGeneratorResult = z.infer<
  typeof RequirementsGeneratorResultSchema
>;
export type AgentTask = z.infer<typeof AgentTaskSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
export type DependencyReport = z.infer<typeof DependencyReportSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type PackageResearch = z.infer<typeof PackageResearchSchema>;

// Utility functions
export function parseRequirementString(
  requirement: string
): DependencyConstraint {
  // Parse strings like "numpy>=1.19.0,<2.0.0" or "django==3.2.5"
  const patterns = [
    /^([a-zA-Z0-9\-_.]+)\s*(==|>=|>|<=|<|!=|~=|===)\s*([^,\s]+)(.*)$/,
    /^([a-zA-Z0-9\-_.]+)(.*)$/,
  ];

  for (const pattern of patterns) {
    const match = requirement.trim().match(pattern);
    if (match) {
      const [, name, operator = "", version = ""] = match;
      return {
        name: name.toLowerCase(),
        operator: (operator as DependencyConstraint["operator"]) || "",
        version: version || undefined,
        fixed: operator === "==",
        original_spec: requirement.trim(),
      };
    }
  }

  throw new Error(`Invalid requirement format: ${requirement}`);
}

export function generatePackageKey(name: string): string {
  return `package:${name.toLowerCase()}`;
}

export function generateReportKey(id: string): string {
  return `report:${id}`;
}
