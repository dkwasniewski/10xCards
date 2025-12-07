import { defineConfig, devices } from "@playwright/test";
import path from "path";

import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
/**
 * Playwright E2E Testing Configuration
 * Following guidelines: Chromium only, Page Object Model, visual comparison
 */
export default defineConfig({
  // Test directory
  testDir: "./e2e",

  // Global teardown - cleanup database after all tests
  globalTeardown: "./e2e/global-teardown.ts",

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Run tests sequentially to avoid login conflicts with remote Supabase
  // Remote Supabase can't handle multiple simultaneous logins from same user
  workers: 1,

  // Reporter to use
  reporter: [["html"], ["list"], ["json", { outputFile: "test-results/results.json" }]],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",
  },

  // Configure projects for Chromium only (as per guidelines)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: "node scripts/dev-e2e.js",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
