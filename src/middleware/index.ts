import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client";

/**
 * Middleware that creates a request-scoped Supabase client and retrieves the current session.
 * The Supabase client is configured to handle cookies for SSR authentication.
 * Session and user data are added to context.locals for use in pages and API endpoints.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Create request-scoped Supabase client with cookie handling
  const supabase = createSupabaseServerInstance({
    headers: context.request.headers,
    cookies: context.cookies,
  });

  // Add Supabase client to context
  context.locals.supabase = supabase;

  // Retrieve current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Add session and user to context
  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  return next();
});
