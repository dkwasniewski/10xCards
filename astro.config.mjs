// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // Prevent Node.js polyfills in Cloudflare Workers environment
        // Map to empty module to avoid bundling Node.js crypto
        "node:crypto": new globalThis.URL("./src/lib/utils/empty.ts", import.meta.url).pathname,
      },
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  // Disable dev toolbar in E2E tests to prevent click interception
  devToolbar: {
    enabled: false,
  },
});
