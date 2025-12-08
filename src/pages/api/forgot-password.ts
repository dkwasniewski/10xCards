import type { APIRoute } from "astro";

import { forgotPasswordSchema } from "../../lib/schemas/auth.schemas";
import { authService } from "../../lib/services/auth.service";
import { errorResponse, ErrorMessages } from "../../lib/utils/api-error";
import { getEnv } from "../../lib/utils";

/**
 * POST /api/forgot-password
 *
 * Sends a password reset email to the user.
 * Always returns success to prevent email enumeration attacks.
 *
 * Request Body:
 * {
 *   email: string;
 * }
 *
 * Response (200 OK):
 * {
 *   message: "If an account exists with this email, you will receive password reset instructions";
 * }
 *
 * Response (400 Bad Request):
 * {
 *   error: string;
 *   details?: object;
 * }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, ErrorMessages.INVALID_JSON);
    }

    // 2. Validate input
    const parseResult = forgotPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(400, ErrorMessages.VALIDATION_ERROR, parseResult.error.errors);
    }

    const { email } = parseResult.data;

    // 3. Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return errorResponse(500, ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE);
    }

    // 4. Get site URL from environment
    const siteUrl = getEnv("PUBLIC_SITE_URL", locals.runtime);
    if (!siteUrl) {
      return errorResponse(500, "Site URL not configured");
    }

    // 5. Request password reset
    // The redirect URL will be where users are sent after clicking the reset link
    const redirectUrl = `${siteUrl}/reset-password`;

    await authService.requestPasswordReset(supabase, email, redirectUrl);

    // 6. Always return success to prevent email enumeration
    // Don't reveal whether the email exists in the system
    return new Response(
      JSON.stringify({
        message: "If an account exists with this email, you will receive password reset instructions",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log unexpected errors but still return success to prevent enumeration
    // eslint-disable-next-line no-console
    console.error("Forgot password error:", error);

    // Return success even on error to prevent email enumeration
    return new Response(
      JSON.stringify({
        message: "If an account exists with this email, you will receive password reset instructions",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
