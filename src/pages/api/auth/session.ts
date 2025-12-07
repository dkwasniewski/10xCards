import type { APIRoute } from "astro";

import { errorResponse, ErrorMessages } from "../../../lib/utils/api-error";

/**
 * POST /api/auth/session
 *
 * Establishes a session from access and refresh tokens (from password reset email).
 * Used when user clicks the password reset link with tokens in the URL hash.
 *
 * Request Body:
 * {
 *   access_token: string;
 *   refresh_token: string;
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
    let body: { access_token?: string; refresh_token?: string };
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, ErrorMessages.INVALID_JSON);
    }

    const { access_token, refresh_token } = body;

    // 2. Validate tokens
    if (!access_token || !refresh_token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing access_token or refresh_token",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return errorResponse(500, ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE);
    }

    // 4. Set the session with the provided tokens
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error("Session establishment error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Failed to establish session",
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
          error: "Invalid or expired tokens",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Session established for user:", data.user?.id);

    // 5. Return success
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
    console.error("Session establishment exception:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to establish session",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

