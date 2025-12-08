import type { APIRoute } from "astro";

import { errorResponse, ErrorMessages } from "../../../lib/utils/api-error";

/**
 * POST /api/auth/exchange-code
 *
 * Exchanges a PKCE authorization code for a session.
 * This is used for password reset flow with PKCE enabled.
 *
 * Request Body:
 * {
 *   code: string;
 * }
 *
 * Response (200 OK):
 * {
 *   success: true;
 * }
 *
 * Response (400 Bad Request):
 * {
 *   success: false;
 *   error: string;
 * }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    let body: { code?: string };
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, ErrorMessages.INVALID_JSON);
    }

    const { code } = body;

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or missing authorization code",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return errorResponse(500, ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE);
    }

    // 3. Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Code exchange error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Failed to verify reset link",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.session) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create session",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success - the session is automatically set in cookies
    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in code exchange:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
