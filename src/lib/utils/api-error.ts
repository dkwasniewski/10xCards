import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Standard API error response structure.
 */
interface ApiErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * Logs an error event to the event_logs table for debugging and monitoring.
 * Failures in logging are silently ignored to avoid breaking the main error flow.
 *
 * @param supabase - Supabase client instance
 * @param service - Name of the service/endpoint where error occurred
 * @param error - The error object or message
 * @param userId - Optional user ID if available
 */
export async function logError(
  supabase: SupabaseClient,
  service: string,
  error: unknown,
  userId?: string
): Promise<void> {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    await supabase.from("event_logs").insert({
      user_id: userId || null,
      event_type: "error",
      event_source: "manual", // API errors are manual/system events
      metadata: {
        service,
        error: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Silently fail - logging errors shouldn't break the main flow
    // In production, you might want to use a fallback logging mechanism
  }
}

/**
 * Creates a standardized error response with consistent formatting.
 * Optionally logs the error to the event_logs table.
 *
 * @param status - HTTP status code
 * @param error - Error message
 * @param details - Optional additional error details (e.g., validation errors)
 * @param supabase - Optional Supabase client for error logging
 * @param service - Optional service name for error logging
 * @param userId - Optional user ID for error logging
 * @returns Response object with JSON error body
 */
export async function handleApiError(
  status: number,
  error: string,
  details?: unknown,
  supabase?: SupabaseClient,
  service?: string,
  userId?: string
): Promise<Response> {
  // Log server errors (5xx) to event_logs if supabase client is available
  if (status >= 500 && supabase && service) {
    await logError(supabase, service, { error, details }, userId);
  }

  const body: ApiErrorResponse = details ? { error, details } : { error };

  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a simple error response without logging.
 * Useful for client errors (4xx) that don't need to be logged.
 *
 * @param status - HTTP status code
 * @param error - Error message
 * @param details - Optional additional error details
 * @returns Response object with JSON error body
 */
export function errorResponse(status: number, error: string, details?: unknown): Response {
  const body: ApiErrorResponse = details ? { error, details } : { error };

  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Standard error messages for common HTTP status codes.
 */
export const ErrorMessages = {
  UNAUTHORIZED: "Unauthorized",
  BAD_REQUEST: "Bad request",
  VALIDATION_ERROR: "Validation error",
  NOT_FOUND: "Resource not found",
  INTERNAL_SERVER_ERROR: "Internal server error",
  INVALID_JSON: "Invalid JSON body",
  SUPABASE_CLIENT_UNAVAILABLE: "Supabase client not available",
} as const;

