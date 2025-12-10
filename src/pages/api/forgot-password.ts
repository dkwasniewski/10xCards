import type { APIRoute } from "astro";

import { forgotPasswordSchema } from "../../lib/schemas/auth.schemas";
import { authService } from "../../lib/services/auth.service";
import { errorResponse, ErrorMessages } from "../../lib/utils/api-error";

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
 *   message: "If an account exists with this email, a password reset link has been sent";
 * }
 *
 * Response (400 Bad Request):
 * {
 *   error: string;
 *   details?: object;
 * }
 */
export const POST: APIRoute = async ({ request, locals, url }) => {
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

    // 4. Construct redirect URL for password reset
    // User will be redirected here after clicking the email link
    const redirectUrl = `${url.origin}/reset-password`;

    // 5. Send password reset email
    // Note: This method always succeeds to prevent email enumeration
    await authService.requestPasswordReset(supabase, email, redirectUrl);

    // 6. Return generic success message
    return new Response(
      JSON.stringify({
        message: "If an account exists with this email, a password reset link has been sent",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log unexpected errors
    // eslint-disable-next-line no-console
    console.error("Forgot password error:", error);

    // Always return generic message to prevent email enumeration
    return new Response(
      JSON.stringify({
        message: "If an account exists with this email, a password reset link has been sent",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
