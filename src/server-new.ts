import { routeAgentRequest } from "agents";
import { DependencyResolverAgent } from "./agents/dependency-resolver-agent";
import { PackageResearchAgent } from "./agents/package-research-agent";
import { ReportGeneratorAgent } from "./agents/report-generator-agent";
import { getAIClient } from "./services/ai-client";
import { type Env } from "./shared";
import {
  createLogger,
  createMetrics,
} from "./logger";

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
        await env.PACKAGE_CACHE.put("test-key", "test-value", { expirationTtl: 60 });
        const kvValue = await env.PACKAGE_CACHE.get("test-key");
        
        // Test R2 bucket
        await env.REPORTS_STORAGE.put("test-report.json", JSON.stringify({ test: "data" }));
        const r2Object = await env.REPORTS_STORAGE.get("test-report.json");
        const r2Content = r2Object ? await r2Object.text() : null;
        
        return Response.json({
          success: true,
          tests: {
            kv_write_read: kvValue === "test-value",
            r2_write_read: r2Content === '{"test":"data"}',
            kv_value: kvValue,
            r2_content: r2Content
          },
          bindings_available: {
            package_cache: !!env.PACKAGE_CACHE,
            reports_storage: !!env.REPORTS_STORAGE,
            agent_namespace: !!env.DependencyResolverAgent
          }
        });
      } catch (error) {
        logger.error("Bindings test failed", error as Error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    // AI client test endpoint
    if (url.pathname === "/test-ai-client") {
      try {
        getAIClient(env); // Test AI client initialization
        logger.info("AI client initialized successfully", {
          provider: env.AZURE_OPENAI_API_KEY ? "azure" : "openai",
        });
        return Response.json({
          success: true,
          provider: env.AZURE_OPENAI_API_KEY ? "azure" : "openai",
          message: "AI client initialized successfully"
        });
      } catch (error) {
        logger.error("AI client test failed", error as Error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
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

// Export agent classes for the agents framework
export {
  DependencyResolverAgent,
  PackageResearchAgent,
  ReportGeneratorAgent,
}; 