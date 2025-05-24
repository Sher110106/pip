import { routeAgentRequest } from "agents";
import { getAIClient } from "./services";
import type { Env } from "./shared";
import { createLogger, createMetrics } from "./logger";
import { GitHubAppService, getGitHubAppConfig } from "./services/github-app";

// Import and re-export agent classes for the agents framework
export { DependencyResolverAgent } from "./agents/dependency-resolver-agent";
export { PackageResearchAgent } from "./agents/package-research-agent";
export { ReportGeneratorAgent } from "./agents/report-generator-agent";

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
        features: {
          ai_provider: env.AZURE_OPENAI_API_KEY ? "azure" : "openai",
          github_app: !!(env.GITHUB_APP_ID && env.GITHUB_PRIVATE_KEY),
          search_enabled: !!(env.GOOGLE_SEARCH_API_KEY && env.GOOGLE_SEARCH_ENGINE_ID),
        },
      });
    }

    // GitHub webhook handler
    if (url.pathname === "/api/webhooks/github" && request.method === "POST") {
      const githubConfig = getGitHubAppConfig(env);
      
      if (!githubConfig) {
        logger.error("GitHub App not configured");
        return Response.json(
          { error: "GitHub App not configured" },
          { status: 503 }
        );
      }

      try {
        const githubApp = new GitHubAppService(githubConfig, env);
        
        logger.info("Received GitHub webhook", {
          event: request.headers.get("x-github-event"),
          delivery: request.headers.get("x-github-delivery"),
          hasSignature: !!request.headers.get("x-hub-signature-256"),
        });

        // Use the new webhook verification method
        const result = await githubApp.verifyAndReceiveWebhook(request);

        logger.info("GitHub webhook processed successfully", {
          event: request.headers.get("x-github-event"),
          delivery: request.headers.get("x-github-delivery"),
          status: result.status,
        });

        return result;

      } catch (error) {
        logger.error("Error processing GitHub webhook", error as Error);
        return Response.json(
          { error: "Webhook processing failed" },
          { status: 500 }
        );
      }
    }

    // API key check
    if (url.pathname === "/check-api-keys") {
      const hasOpenAI = !!(env.OPENAI_API_KEY || env.AZURE_OPENAI_API_KEY);
      const hasSearch = !!(
        env.GOOGLE_SEARCH_API_KEY && env.GOOGLE_SEARCH_ENGINE_ID
      );
      const hasGitHub = !!(env.GITHUB_APP_ID && env.GITHUB_PRIVATE_KEY);

      logger.info("API key check requested", { hasOpenAI, hasSearch, hasGitHub });

      return Response.json({
        openai: hasOpenAI,
        search: hasSearch,
        github: hasGitHub,
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

    // Test Durable Object Agent directly
    if (url.pathname === "/test-agent-direct") {
      logger.info("Testing DependencyResolverAgent directly");
      try {
        // Get a reference to the DependencyResolverAgent Durable Object
        const agentId = env.DependencyResolverAgent.idFromName("test-instance");
        const agentStub = env.DependencyResolverAgent.get(agentId);
        
        // Test a simple health request
        const testRequest = new Request("https://test.com/health", {
          method: "GET",
        });
        
        const response = await agentStub.fetch(testRequest);
        const result = await response.text();
        
        return Response.json({
          success: true,
          agent_response_status: response.status,
          agent_response_body: result,
          message: "Agent direct test completed"
        });
      } catch (error) {
        logger.error("Agent direct test failed", error as Error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
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
    try {
      const agentResponse = await routeAgentRequest(request, env);
      if (agentResponse) {
        logger.debug("Agent routing successful", { 
          status: agentResponse.status,
          pathname: url.pathname 
        });
        return agentResponse;
      } else {
        logger.warn("No agent route matched", { pathname: url.pathname });
        return new Response("Not found", { status: 404 });
      }
    } catch (error) {
      logger.error("Agent routing failed", error as Error, {
        pathname: url.pathname,
        method: request.method,
        stack: error instanceof Error ? error.stack : undefined,
      });
      metrics.counter("agent_routing_error", 1, { 
        pathname: url.pathname, 
        error_type: error instanceof Error ? error.constructor.name : "unknown" 
      });
      return Response.json({
        error: "Internal server error during agent routing",
        details: error instanceof Error ? error.message : "Unknown error",
      }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
