import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const environment = process.env.CLOUDFLARE_ENVIRONMENT || (mode === "production" ? "production" : undefined);
  
  return {
    plugins: [
      cloudflare({
        environment,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        // Proxy agent requests to the Wrangler dev server
        "/agents": {
          target: "http://localhost:5173",
          changeOrigin: true,
        },
        // Proxy other API endpoints too
        "/health": {
          target: "http://localhost:5173",
          changeOrigin: true,
        },
        "/check-api-keys": {
          target: "http://localhost:5173",
          changeOrigin: true,
        },
        "/test-bindings": {
          target: "http://localhost:5173",
          changeOrigin: true,
        },
        "/test-ai-client": {
          target: "http://localhost:5173",
          changeOrigin: true,
        },
      },
    },
  };
});
