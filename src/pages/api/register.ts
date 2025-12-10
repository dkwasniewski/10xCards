import type { APIRoute } from "astro";

import { registerSchema } from "../../lib/schemas/auth.schemas";
import { authService } from "../../lib/services/auth.service";
import { logEvent } from "../../lib/services/event-log.service";
import { errorResponse, ErrorMessages, handleApiError } from "../../lib/utils/api-error";

/**
 * POST /api/register
 *
 * Registers a new user with email and password.
 * Sends email confirmation link to user's email address.
 * Note: User must confirm their email before they can log in.
 *
 * Request Body:
 * {
 *   email: string;
 *   password: string;
 * }
 *
 * Response (200 OK):
 * {
 *   id: string;
 *   email: string;
 *   created_at: string;
 *   message: string;
 * }
 *
 * Response (400 Bad Request):
 * {
 *   error: string;
 *   details?: object;
 * }
 *
 * Response (409 Conflict):
 * {
 *   error: "An account with this email already exists";
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
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(400, ErrorMessages.VALIDATION_ERROR, parseResult.error.errors);
    }

    const { email, password } = parseResult.data;

    // 3. Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return errorResponse(500, ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE);
    }

    // 4. Get site URL from request origin
    const siteUrl = url.origin;

    // 5. Attempt registration
    const result = await authService.register(supabase, email, password, siteUrl);

    // 6. Log successful registration event
    // Note: User is created but not yet confirmed, so we can log the event
    await logEvent(supabase, {
      userId: result.id,
      eventType: "user_registered",
      eventSource: "manual",
    });

    // 7. Return success response with informative message
    return new Response(
      JSON.stringify({
        ...result,
        message: "Registration successful. Please check your email to confirm your account.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle registration errors
    if (error instanceof Error) {
      // Check for specific registration errors
      if (error.message.includes("already exists") || error.message.includes("already registered")) {
        return errorResponse(409, "An account with this email already exists");
      }

      if (error.message.includes("Invalid email")) {
        return errorResponse(400, "Please enter a valid email address");
      }

      if (error.message.includes("Password")) {
        return errorResponse(400, error.message);
      }
    }

    // Log unexpected errors
    // eslint-disable-next-line no-console
    console.error("Registration error:", error);
    return await handleApiError(
      500,
      "Registration failed. Please try again",
      error,
      locals.supabase,
      "POST /api/register"
    );
  }
};
