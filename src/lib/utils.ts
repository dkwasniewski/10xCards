import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets an environment variable value from multiple sources.
 * Tries runtime env first (Cloudflare), then import.meta.env (dev/build time).
 *
 * @param key - Environment variable key
 * @param runtime - Optional runtime environment object from context.locals
 * @returns Environment variable value or undefined
 */
export function getEnv(key: string, runtime?: { env?: Record<string, string | undefined> }): string | undefined {
  // Try runtime env first (Cloudflare Workers/Pages)
  if (runtime?.env?.[key]) {
    return runtime.env[key];
  }

  // Try import.meta.env (works in dev and build time)
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }

  // Try process.env (Node.js environments)
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }

  return undefined;
}
