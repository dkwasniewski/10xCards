import type { APIRoute } from "astro";
import { errorResponse, ErrorMessages } from "../../../lib/utils/api-error";

export const prerender = false;

/**
 * GET /api/candidates/orphaned
 *
 * Retrieves orphaned AI-generated flashcard candidates for the authenticated user.
 * Orphaned candidates are those with ai_session_id set but older than 7 days,
 * meaning they're no longer in an active review session.
 *
 * Flow:
 * 1. Verify user authentication
 * 2. Fetch all flashcards with ai_session_id set, older than 7 days
 * 3. Return count and candidates
 *
 * @returns 200 - Object with count and array of orphaned candidates
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

  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffDate = sevenDaysAgo.toISOString();

  // Fetch orphaned candidates (older than 7 days with ai_session_id set)
  try {
    const { data, error } = await supabase
      .from("flashcards")
      .select("id, front, back, prompt, ai_session_id, created_at")
      .eq("user_id", userId)
      .not("ai_session_id", "is", null)
      .is("deleted_at", null)
      .lt("created_at", cutoffDate)
      .order("created_at", { ascending: true });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching orphaned candidates:", error);
      return errorResponse(500, ErrorMessages.INTERNAL_SERVER_ERROR);
    }

    const orphanedCandidates = data || [];

    // Return successful response with count and candidates
    return new Response(
      JSON.stringify({
        count: orphanedCandidates.length,
        candidates: orphanedCandidates,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=0",
        },
      }
    );
  } catch (error) {
    // Log and return 500 for unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error fetching orphaned candidates:", error);
    return errorResponse(500, ErrorMessages.INTERNAL_SERVER_ERROR);
  }
};

/**
 * DELETE /api/candidates/orphaned
 *
 * Deletes orphaned AI-generated flashcard candidates for the authenticated user.
 * Orphaned candidates are those with ai_session_id set but older than 7 days.
 *
 * Flow:
 * 1. Verify user authentication
 * 2. Soft-delete all flashcards with ai_session_id set, older than 7 days
 * 3. Return count of deleted candidates
 *
 * @returns 200 - Object with count of deleted candidates
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 500 - Internal server error
 */
export const DELETE: APIRoute = async ({ locals }) => {
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

  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffDate = sevenDaysAgo.toISOString();

  // Soft-delete orphaned candidates
  try {
    const { data, error } = await supabase
      .from("flashcards")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId)
      .not("ai_session_id", "is", null)
      .is("deleted_at", null)
      .lt("created_at", cutoffDate)
      .select("id");

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting orphaned candidates:", error);
      return errorResponse(500, ErrorMessages.INTERNAL_SERVER_ERROR);
    }

    const deletedCount = data?.length || 0;

    // Return successful response with count
    return new Response(
      JSON.stringify({
        deleted: deletedCount,
        message: `Deleted ${deletedCount} orphaned candidate${deletedCount !== 1 ? "s" : ""}`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error deleting orphaned candidates:", error);
    return errorResponse(500, ErrorMessages.INTERNAL_SERVER_ERROR);
  }
};
