import type { APIRoute } from "astro";
import type { GetCandidatesResponseDto } from "../../../types";
import { errorResponse, ErrorMessages } from "../../../lib/utils/api-error";

export const prerender = false;

/**
 * GET /api/candidates/pending
 *
 * Retrieves ALL pending AI-generated flashcard candidates for the authenticated user,
 * across all generation sessions. A candidate is "pending" if it has a non-null ai_session_id.
 *
 * Flow:
 * 1. Verify user authentication
 * 2. Fetch all flashcards with ai_session_id set (pending candidates)
 * 3. Return candidates as JSON array
 *
 * @returns 200 - Array of CandidateDto objects
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async ({ locals }) => {
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

  // Fetch all pending candidates (flashcards with ai_session_id set)
  try {
    const { data, error } = await supabase
      .from("flashcards")
      .select("id, front, back, prompt, ai_session_id")
      .eq("user_id", userId)
      .not("ai_session_id", "is", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching pending candidates:", error);
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
    console.error("Error fetching pending candidates:", error);
    return errorResponse(500, ErrorMessages.INTERNAL_SERVER_ERROR);
  }
};
