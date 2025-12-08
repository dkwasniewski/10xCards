import type { AstroCookies } from "astro";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// Helper function to get environment variables
function getEnvVar(key: string): string | undefined {
  // Try import.meta.env first (works in dev and build time)
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }

  // Try process.env (works in Node.js environments)
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }

  return undefined;
}

// Lazy initialization of singleton client
let _supabaseClient: SupabaseClientType<Database> | null = null;

// Singleton client for non-SSR contexts (kept for backward compatibility)
// This is lazily initialized to avoid errors when environment variables aren't available at module load time
export const supabaseClient = new Proxy({} as SupabaseClientType<Database>, {
  get(target, prop) {
    if (!_supabaseClient) {
      const supabaseUrl = getEnvVar("SUPABASE_URL");
      const supabaseAnonKey = getEnvVar("SUPABASE_KEY");

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_KEY.");
      }

      _supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return (_supabaseClient as Record<string, unknown>)[prop as string];
  },
});

export type SupabaseClient = SupabaseClientType<Database>;

// Default user ID for development/testing without authentication
export const DEFAULT_USER_ID = "ec8598b7-0f1e-49eb-93d7-fb1e6924dff5";

/**
 * Cookie configuration for Supabase Auth
 */
export const cookieOptions = {
  path: "/",
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: "lax" as const,
};

/**
 * Parses cookie header string into array of name-value pairs
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Creates a Supabase client configured for server-side rendering with cookie handling.
 * This implementation uses the standard createClient but with custom cookie storage
 * that integrates with Astro's cookie management.
 *
 * @param context - Object containing request headers and Astro cookies
 * @returns Configured Supabase client for SSR
 */
export function createSupabaseServerInstance(
  context: { headers: Headers; cookies: AstroCookies },
  envUrl?: string,
  envKey?: string
): SupabaseClient {
  // Local cache for cookies that have been set during this request
  // This ensures that getItem can read cookies that were just set via setItem
  const cookieCache = new Map<string, string>();

  // Use provided env vars or fall back to getEnvVar
  const url = envUrl || getEnvVar("SUPABASE_URL");
  const key = envKey || getEnvVar("SUPABASE_KEY");

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables in createSupabaseServerInstance");
  }

  // Create a client with custom storage that uses Astro cookies
  return createClient<Database>(url, key, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: false, // Disable auto-refresh to prevent network requests that can hang
      detectSessionInUrl: false, // Disable URL detection in server-side context
      persistSession: true,
      storage: {
        getItem: (key: string) => {
          // First check the cache for recently set cookies
          const cachedValue = cookieCache.get(key);
          if (cachedValue !== undefined) {
            return cachedValue;
          }

          // Then check Astro's cookies (which includes both request and response cookies)
          const cookieValue = context.cookies.get(key);
          if (cookieValue) {
            return cookieValue.value;
          }

          // Fallback to parsing the Cookie header (for initial request)
          const cookies = parseCookieHeader(context.headers.get("Cookie") ?? "");
          const cookie = cookies.find((c) => c.name === key);
          return cookie?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          // Store in cache for immediate retrieval
          cookieCache.set(key, value);
          // Set in Astro cookies for response
          context.cookies.set(key, value, cookieOptions);
        },
        removeItem: (key: string) => {
          // Remove from cache
          cookieCache.delete(key);
          // Remove from Astro cookies
          context.cookies.delete(key, { path: "/" });
        },
      },
    },
  });
}
