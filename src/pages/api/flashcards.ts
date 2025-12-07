import type { APIRoute } from "astro";
import {
  bulkCreateFlashcardsSchema,
  bulkDeleteFlashcardsSchema,
  listFlashcardsQuerySchema,
} from "../../lib/schemas/flashcards.schemas";
import { flashcardsService } from "../../lib/services/flashcards.service";
import { errorResponse, handleApiError, ErrorMessages } from "../../lib/utils/api-error";

export const prerender = false;

/**
 * GET /api/flashcards
 * Retrieves a paginated, optionally searchable list of flashcards for the authenticated user.
 * Query parameters: search, page, limit, sort
 */
export const GET: APIRoute = async ({ request, locals }) => {
  // Get Supabase client from locals (provided by middleware)
  const supabase = locals.supabase;
  if (!supabase) {
    return await handleApiError(
      500,
      ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE,
      undefined,
      undefined,
      "GET /api/flashcards",
      undefined
    );
  }

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse(401, "Unauthorized");
  }
  const userId = user.id;

  // Extract and parse query parameters
  const url = new URL(request.url);
  const queryParams = {
    search: url.searchParams.get("search") || undefined,
    page: url.searchParams.get("page") || undefined,
    limit: url.searchParams.get("limit") || undefined,
    sort: url.searchParams.get("sort") || undefined,
  };

  // Validate query parameters with Zod
  const parseResult = listFlashcardsQuerySchema.safeParse(queryParams);
  if (!parseResult.success) {
    return errorResponse(400, ErrorMessages.VALIDATION_ERROR, parseResult.error.errors);
  }

  const query = parseResult.data;

  try {
    // Call service to retrieve flashcards
    const result = await flashcardsService.listFlashcards(supabase, userId, query);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to list flashcards:", error);
    return await handleApiError(500, "Failed to retrieve flashcards", error, supabase, "GET /api/flashcards", userId);
  }
};

/**
 * POST /api/flashcards
 * Creates multiple flashcards in bulk.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Get Supabase client from locals (provided by middleware)
  const supabase = locals.supabase;
  if (!supabase) {
    return await handleApiError(
      500,
      ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE,
      undefined,
      undefined,
      "POST /api/flashcards",
      undefined
    );
  }

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse(401, "Unauthorized");
  }
  const userId = user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, ErrorMessages.INVALID_JSON);
  }

  const parseResult = bulkCreateFlashcardsSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse(400, ErrorMessages.VALIDATION_ERROR, parseResult.error.errors);
  }

  const commands = parseResult.data;

  try {
    const created = await flashcardsService.createBulkFlashcards(supabase, userId, commands);
    const responseBody = { created };
    return new Response(JSON.stringify(responseBody), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create flashcards:", error);
    return await handleApiError(500, "Failed to create flashcards", error, supabase, "POST /api/flashcards", userId);
  }
};

/**
 * DELETE /api/flashcards
 * Soft-deletes multiple flashcards in bulk (up to 100 at once).
 */
export const DELETE: APIRoute = async ({ request, locals }) => {
  // Get Supabase client from locals (provided by middleware)
  const supabase = locals.supabase;
  if (!supabase) {
    return await handleApiError(
      500,
      ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE,
      undefined,
      undefined,
      "DELETE /api/flashcards",
      undefined
    );
  }

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return errorResponse(401, "Unauthorized");
  }
  const userId = user.id;

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, ErrorMessages.INVALID_JSON);
  }

  const parseResult = bulkDeleteFlashcardsSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse(400, ErrorMessages.VALIDATION_ERROR, parseResult.error.errors);
  }

  const { ids } = parseResult.data;

  try {
    // Call service to bulk-delete flashcards
    const deletedCount = await flashcardsService.bulkDeleteFlashcards(supabase, userId, ids);

    // If no flashcards were deleted, return 404
    if (deletedCount === 0) {
      return errorResponse(404, "No flashcards found to delete");
    }

    // Return the count of deleted flashcards
    return new Response(JSON.stringify({ deleted: deletedCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to bulk-delete flashcards:", error);
    return await handleApiError(500, "Failed to delete flashcards", error, supabase, "DELETE /api/flashcards", userId);
  }
};
