import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import type { Env } from "../shared";

/**
 * Get the appropriate AI client based on environment configuration
 */
export const getAIClient = (env: Env) => {
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
