import type { APIRoute } from "astro";
import { z } from "zod";

import { logEvent } from "../../lib/services/event-log.service";
import { errorResponse, ErrorMessages, handleApiError } from "../../lib/utils/api-error";

// Simplified schema - only new password needed
// The session is established when user clicks the reset link
const resetPasswordBodySchema = z.object({
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*]/, "Password must contain at least one special character (!@#$%^&*)"),
});

/**
 * POST /api/reset-password
 *
 * Resets user password using an active session established from the reset email link.
 * When users click the reset link, Supabase automatically verifies the token and creates a session.
 * This endpoint updates the password for that authenticated session.
 *
 * Request Body:
 * {
 *   new_password: string; // New password meeting strength requirements
 * }
 *
 * Response (200 OK):
 * {
 *   message: "Password reset successful";
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
 *   error: "No active session. Please use the link from your email";
 * }
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // 1. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, ErrorMessages.INVALID_JSON);
    }

    // 2. Validate input
    const parseResult = resetPasswordBodySchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(400, ErrorMessages.VALIDATION_ERROR, parseResult.error.errors);
    }

    const { new_password } = parseResult.data;

    // 3. Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return errorResponse(500, ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE);
    }

    // 4. Check if user has an active session
    // The session is established when the user clicks the reset link from their email
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error("No active session for password reset:", sessionError);
      return errorResponse(401, "No active session. Please use the reset link from your email");
    }

    console.log("Password reset for user:", session.user.id);

    // 5. Update password directly (bypass service to avoid potential hanging)
    console.log("Updating password...");
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      console.error("Password update error:", updateError);

      // Handle specific error cases
      if (updateError.message.includes("same") && updateError.message.includes("password")) {
        return errorResponse(400, "New password must be different from your current password");
      }

      if (updateError.message.includes("weak") || updateError.message.includes("strength")) {
        return errorResponse(400, "Password does not meet security requirements");
      }

      // Generic error
      return errorResponse(400, updateError.message || "Failed to update password");
    }
    console.log("Password updated successfully");

    // 6. Log password reset event
    console.log("Logging password reset event...");
    try {
      await Promise.race([
        logEvent(supabase, {
          userId: session.user.id,
          eventType: "password_reset",
          eventSource: "manual",
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Event logging timeout")), 5000)),
      ]);
      console.log("Event logged");
    } catch (err) {
      console.error("Event logging error (non-fatal):", err);
      // Don't fail the request if logging fails
    }

    // 7. Clear session cookies to sign out user
    // They need to log in with their new password
    console.log("Clearing session cookies...");

    // Get the storage key prefix used by Supabase
    // Format: sb-<project-ref>-auth-token
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || "127-0-0-1-54321";
    const storageKey = `sb-${projectRef}-auth-token`;

    console.log("Supabase storage key:", storageKey);

    // Delete all possible Supabase auth cookie names
    const cookieNames = [
      storageKey,
      `${storageKey}.0`,
      `${storageKey}.1`,
      "sb-access-token",
      "sb-refresh-token",
      "sb-auth-token",
    ];

    let deletedCount = 0;
    cookieNames.forEach((cookieName) => {
      // Always try to delete, even if has() returns false
      try {
        cookies.delete(cookieName, { path: "/" });
        console.log("Deleted cookie:", cookieName);
        deletedCount++;
      } catch (err) {
        console.log("Could not delete cookie:", cookieName, err);
      }
    });

    console.log(`Password reset complete - deleted ${deletedCount} cookies`);

    return new Response(
      JSON.stringify({
        message: "Password reset successful",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle password reset errors
    if (error instanceof Error) {
      // Check for specific auth errors
      if (error.message.includes("same as the old password")) {
        return errorResponse(400, "New password must be different from your old password");
      }

      if (error.message.includes("Invalid") || error.message.includes("expired")) {
        return errorResponse(401, "Invalid or expired reset token");
      }
    }

    // Log unexpected errors
    console.error("Password reset error:", error);
    return await handleApiError(
      500,
      "Password reset failed. Please try again",
      error,
      locals.supabase,
      "POST /api/reset-password"
    );
  }
};
