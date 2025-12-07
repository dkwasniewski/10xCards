import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing as per guidelines
    environment: "jsdom",

    // Setup files for global mocks and custom matchers
    setupFiles: ["./test/setup.ts"],

    // Include test files
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

    // Exclude common directories
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/e2e/**",
    ],

    // Coverage configuration (run only when explicitly requested)
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules/", "test/", "**/*.d.ts", "**/*.config.*", "**/dist/**", "**/.astro/**"],
      // Thresholds for critical code paths
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Enable globals for cleaner test syntax (optional)
    globals: true,

    // Watch mode configuration
    watch: false,

    // Reporter configuration
    reporters: ["verbose"],

    // Test timeout
    testTimeout: 10000,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
