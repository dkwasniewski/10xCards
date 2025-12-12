import type { APIRoute } from "astro";
import type { GetCandidatesResponseDto } from "../../../types";
import { errorResponse, ErrorMessages } from "../../../lib/utils/api-error";

export const prerender = false;

/**
 * GET /api/candidates/other-pending?excludeSessionId={sessionId}
 *
 * Retrieves pending candidates from previous sessions, excluding the current session.
 * This allows users to see and manage candidates from other generation sessions
 * without losing access when creating a new session.
 *
 * Flow:
 * 1. Verify user authentication
 * 2. Get excludeSessionId from query params (current session)
 * 3. Fetch all flashcards with ai_session_id set, excluding the current session
 * 4. Return candidates from other sessions
 *
 * @returns 200 - Array of CandidateDto objects from other sessions
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const supabase = locals.supabase;

  // Verify Supabase client is available
  if (!supabase) {
    return errorResponse(500, ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE);
  }

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse(401, ErrorMessages.UNAUTHORIZED);
  }
  const userId = user.id;

  // Get the session ID to exclude (current session)
  const excludeSessionId = url.searchParams.get("excludeSessionId");

  // Fetch all pending candidates from other sessions
  try {
    let query = supabase
      .from("flashcards")
      .select("id, front, back, prompt, ai_session_id")
      .eq("user_id", userId)
      .not("ai_session_id", "is", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    // Exclude current session if provided
    if (excludeSessionId) {
      query = query.neq("ai_session_id", excludeSessionId);
    }

    const { data, error } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching other pending candidates:", error);
      return errorResponse(500, ErrorMessages.INTERNAL_SERVER_ERROR);
    }

    const candidates: GetCandidatesResponseDto = data || [];

    // Return successful response with cache-control headers
    return new Response(JSON.stringify(candidates), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch (error) {
    // Log and return 500 for unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error fetching other pending candidates:", error);
    return errorResponse(500, ErrorMessages.INTERNAL_SERVER_ERROR);
  }
};
