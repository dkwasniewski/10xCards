#!/usr/bin/env node
/**
 * Start Astro dev server with E2E test environment variables
 * This script copies .env.test to .env.local (which Astro loads with higher priority)
 * and then starts the dev server
 */

import { spawn } from "child_process";
import { copyFileSync, unlinkSync, existsSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, "..");
const envTestPath = resolve(projectRoot, ".env.test");
const envLocalPath = resolve(projectRoot, ".env.local");

// Check if .env.local already exists (shouldn't in clean setup)
if (existsSync(envLocalPath)) {
  console.warn("Warning: .env.local already exists. It will be overwritten for E2E testing.");
}

// Copy .env.test to .env.local (Astro loads .env.local with higher priority than .env)
console.log("Copying .env.test to .env.local for E2E testing...");
copyFileSync(envTestPath, envLocalPath);

console.log("Starting Astro dev server with E2E test environment...");

// Start Astro dev server with E2E_TEST flag to disable dev toolbar
const astro = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  env: {
    ...process.env,
    E2E_TEST: "true",
  },
  shell: true,
});

// Cleanup function to remove temporary .env.local
const cleanup = () => {
  console.log("\nCleaning up E2E environment...");

  // Remove the temporary .env.local created for testing
  if (existsSync(envLocalPath)) {
    console.log("Removing temporary .env.local");
    unlinkSync(envLocalPath);
  }
};

// Handle process termination
process.on("SIGINT", () => {
  cleanup();
  astro.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanup();
  astro.kill("SIGTERM");
  process.exit(0);
});

astro.on("exit", (code) => {
  cleanup();
  process.exit(code || 0);
});
