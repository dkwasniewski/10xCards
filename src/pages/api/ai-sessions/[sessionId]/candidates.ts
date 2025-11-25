import type { APIRoute } from "astro";
import type { GetCandidatesResponseDto } from "../../../../types";
import { sessionIdSchema } from "../../../../lib/schemas/ai-sessions.schemas";
import { getAiSessionCandidates } from "../../../../lib/services/ai-sessions.service";
import { errorResponse, ErrorMessages } from "../../../../lib/utils/api-error";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";

export const prerender = false;

/**
 * GET /api/ai-sessions/{sessionId}/candidates
 *
 * Retrieves all AI-generated flashcard candidates for a specific generation session.
 * Only the owner of the session can access their candidates.
 *
 * Flow:
 * 1. Extract and validate sessionId from path params
 * 2. Verify user authentication (using DEFAULT_USER_ID for now)
 * 3. Fetch candidates via service layer (includes ownership check)
 * 4. Return candidates as JSON array
 *
 * @returns 200 - Array of CandidateDto objects
 * @returns 400 - Invalid sessionId format
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 404 - Session not found or not owned by user
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  // Verify Supabase client is available
  if (!supabase) {
    return errorResponse(500, ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE);
  }

  // For now, use DEFAULT_USER_ID. In production, this would be from auth:
  // const { data: { user }, error: authError } = await supabase.auth.getUser();
  // if (authError || !user) {
  //   return errorResponse(401, ErrorMessages.UNAUTHORIZED);
  // }
  const userId = DEFAULT_USER_ID;

  // 1. Validate sessionId path parameter
  const { sessionId } = params;
  const validationResult = sessionIdSchema.safeParse(sessionId);

  if (!validationResult.success) {
    return errorResponse(400, "Invalid sessionId", {
      details: validationResult.error.errors,
    });
  }

  // 2. Fetch candidates from service layer
  try {
    const candidates: GetCandidatesResponseDto = await getAiSessionCandidates(
      supabase,
      validationResult.data,
      userId
    );

    // 3. Return successful response with cache-control headers
    return new Response(JSON.stringify(candidates), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch (error) {
    // Handle NotFoundError (session not found or not owned by user)
    if (error instanceof Error && error.name === "NotFoundError") {
      return errorResponse(404, "Session not found");
    }

    // Log and return 500 for unexpected errors
    console.error("Error fetching AI session candidates:", error);
    return errorResponse(500, ErrorMessages.INTERNAL_SERVER_ERROR);
  }
};

