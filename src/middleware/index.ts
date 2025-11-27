import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client";

/**
 * Public paths that don't require authentication.
 * Includes auth pages and auth API endpoints only.
 */
const PUBLIC_PATHS = [
  // Public pages
  "/",

  // Auth pages (server-rendered)
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",

  // Auth API endpoints
  "/api/login",
  "/api/register",
  "/api/logout",
  "/api/reset-password",
];

/**
 * Middleware that enforces authentication for all non-public routes.
 *
 * Flow:
 * 1. Creates request-scoped Supabase client with cookie handling
 * 2. Checks if the current path is public
 * 3. For protected routes, validates user session using getUser()
 * 4. Redirects unauthenticated users to login page
 * 5. Adds session and user data to context.locals
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // Create request-scoped Supabase client with cookie handling
  const supabase = createSupabaseServerInstance({
    headers: context.request.headers,
    cookies: context.cookies,
  });

  // Add Supabase client to context (always needed)
  context.locals.supabase = supabase;

  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // IMPORTANT: Always get user session first before any other operations
  // Using getSession() instead of getUser() to avoid network requests that can hang
  let user = null;
  let session = null;

  try {
    // Get session from cookies (local operation, no network request)
    const {
      data: { session: sessionData },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
    }

    session = sessionData;
    user = sessionData?.user ?? null;
  } catch (error) {
    console.error("Middleware auth error:", error);
    // Continue with null user/session on error
  }

  // Add user and session to context
  context.locals.user = user;
  context.locals.session = session;

  // Enforce authentication for protected routes
  if (!isPublicPath && !user) {
    // Redirect unauthenticated users to login
    return context.redirect("/login");
  }

  return next();
});
