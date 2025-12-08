import type { APIRoute } from "astro";

import { loginSchema } from "../../lib/schemas/auth.schemas";
import { authService } from "../../lib/services/auth.service";
import { logEvent } from "../../lib/services/event-log.service";
import { errorResponse, ErrorMessages, handleApiError } from "../../lib/utils/api-error";

/**
 * POST /api/login
 *
 * Authenticates a user with email and password.
 * Sets session cookies automatically via Supabase client.
 *
 * Request Body:
 * {
 *   email: string;
 *   password: string;
 * }
 *
 * Response (200 OK):
 * {
 *   access_token: string;
 *   expires_in: number;
 * }
 *
 * Response (400 Bad Request):
 * {
 *   error: string;
 *   details?: object;
 * }
 *
 * Response (401 Unauthorized):
 * {
 *   error: "Invalid email or password";
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
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(400, ErrorMessages.VALIDATION_ERROR, parseResult.error.errors);
    }

    const { email, password } = parseResult.data;

    // 3. Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return errorResponse(500, ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE);
    }

    // 4. Attempt login
    const result = await authService.login(supabase, email, password);

    // 5. Log successful login event
    // Get the session to retrieve user ID
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id) {
      await logEvent(supabase, {
        userId: session.user.id,
        eventType: "user_logged_in",
        eventSource: "manual",
      });
    }

    // 6. Return success response with redirect URL
    return new Response(
      JSON.stringify({
        ...result,
        redirect: "/generate",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error) {
      // Check for specific auth errors
      if (error.message.includes("Invalid email or password") || error.message.includes("Invalid login credentials")) {
        return errorResponse(401, "Invalid email or password");
      }

      if (error.message.includes("Email not confirmed")) {
        return errorResponse(403, "Please confirm your email address before logging in");
      }
    }

    // Log unexpected errors
    // eslint-disable-next-line no-console
    console.error("Login error:", error);
    return await handleApiError(500, "Login failed. Please try again", error, locals.supabase, "POST /api/login");
  }
};
