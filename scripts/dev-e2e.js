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
const envLocalBackupPath = resolve(projectRoot, ".env.local.backup");

// Backup existing .env.local if it exists
if (existsSync(envLocalPath)) {
  console.log("Backing up existing .env.local to .env.local.backup");
  copyFileSync(envLocalPath, envLocalBackupPath);
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

// Cleanup function to restore original .env.local
const cleanup = () => {
  console.log("\nCleaning up E2E environment...");

  // Remove the test .env.local
  if (existsSync(envLocalPath)) {
    unlinkSync(envLocalPath);
  }

  // Restore backup if it existed
  if (existsSync(envLocalBackupPath)) {
    console.log("Restoring original .env.local from backup");
    copyFileSync(envLocalBackupPath, envLocalPath);
    unlinkSync(envLocalBackupPath);
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
