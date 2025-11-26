import type { AstroCookies } from "astro";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Singleton client for non-SSR contexts (kept for backward compatibility)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
export function createSupabaseServerInstance(context: { headers: Headers; cookies: AstroCookies }): SupabaseClient {
  // Create a client with custom storage that uses Astro cookies
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: {
        getItem: (key: string) => {
          const cookies = parseCookieHeader(context.headers.get("Cookie") ?? "");
          const cookie = cookies.find((c) => c.name === key);
          return cookie?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          context.cookies.set(key, value, cookieOptions);
        },
        removeItem: (key: string) => {
          context.cookies.delete(key, { path: "/" });
        },
      },
    },
  });
}
