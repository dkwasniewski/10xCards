import type { APIRoute } from "astro";
import { updateFlashcardSchema, uuidParamSchema } from "../../../lib/schemas/flashcards.schemas";
import { flashcardsService } from "../../../lib/services/flashcards.service";
import { errorResponse, handleApiError, ErrorMessages } from "../../../lib/utils/api-error";

export const prerender = false;

/**
 * PATCH /api/flashcards/{id}
 * Updates an existing flashcard's front and/or back text.
 * Only the owner of the flashcard can perform the update.
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // Get Supabase client from locals (provided by middleware)
  const supabase = locals.supabase;
  if (!supabase) {
    return await handleApiError(
      500,
      ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE,
      undefined,
      undefined,
      `PATCH /api/flashcards/${params.id}`,
      undefined
    );
  }

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse(401, "Unauthorized");
  }
  const userId = user.id;

  // Validate path parameter (flashcard ID)
  const { id } = params;
  const idValidation = uuidParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse(400, "Invalid flashcard ID format", idValidation.error.errors);
  }

  const flashcardId = idValidation.data;

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, ErrorMessages.INVALID_JSON);
  }

  const parseResult = updateFlashcardSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse(400, ErrorMessages.VALIDATION_ERROR, parseResult.error.errors);
  }

  const command = parseResult.data;

  try {
    // Call service to update the flashcard
    const updatedFlashcard = await flashcardsService.updateFlashcard(supabase, userId, flashcardId, command);

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Check if it's a "not found" error
    if (error instanceof Error && error.message.includes("not found")) {
      return errorResponse(404, error.message);
    }

    // Log and return server error for unexpected errors
    // eslint-disable-next-line no-console
    console.error("Failed to update flashcard:", error);
    return await handleApiError(
      500,
      "Failed to update flashcard",
      error,
      supabase,
      `PATCH /api/flashcards/${flashcardId}`,
      userId
    );
  }
};

/**
 * DELETE /api/flashcards/{id}
 * Soft-deletes a single flashcard by setting deleted_at timestamp.
 * Only the owner of the flashcard can delete it.
 * Returns 204 No Content on success with an empty body.
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  // Get Supabase client from locals (provided by middleware)
  const supabase = locals.supabase;
  if (!supabase) {
    return await handleApiError(
      500,
      ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE,
      undefined,
      undefined,
      `DELETE /api/flashcards/${params.id}`,
      undefined
    );
  }

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse(401, "Unauthorized");
  }
  const userId = user.id;

  // Validate path parameter (flashcard ID)
  const { id } = params;
  const idValidation = uuidParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse(400, "Invalid flashcard ID format", idValidation.error.errors);
  }

  const flashcardId = idValidation.data;

  try {
    // Call service to soft-delete the flashcard
    await flashcardsService.deleteFlashcard(supabase, userId, flashcardId);

    // Return 204 No Content on success (empty body)
    return new Response(null, { status: 204 });
  } catch (error) {
    // Check if it's a "not found" error
    if (error instanceof Error && error.message.includes("not found")) {
      return errorResponse(404, error.message);
    }

    // Log and return server error for unexpected errors
    // eslint-disable-next-line no-console
    console.error("Failed to delete flashcard:", error);
    return await handleApiError(
      500,
      "Failed to delete flashcard",
      error,
      supabase,
      `DELETE /api/flashcards/${flashcardId}`,
      userId
    );
  }
};
