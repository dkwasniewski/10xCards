import type { SupabaseClient } from "../../db/supabase.client";
import type {
  BulkCreateFlashcardsCommand,
  FlashcardDto,
  ListFlashcardsResponseDto,
  UpdateFlashcardCommand,
} from "../../types";
import type { ListFlashcardsQuery } from "../schemas/flashcards.schemas";

export class FlashcardsService {
  /**
   * Creates multiple flashcards in bulk.
   *
   * @param supabase - Supabase client instance (from context.locals with user auth)
   * @param userId - ID of the authenticated user
   * @param commands - Array of flashcard creation commands
   * @returns Array of created flashcards
   * @throws Error if the database operation fails
   */
  async createBulkFlashcards(
    supabase: SupabaseClient,
    userId: string,
    commands: BulkCreateFlashcardsCommand
  ): Promise<FlashcardDto[]> {
    const { data, error } = await supabase
      .from("flashcards")
      .insert(commands.map((cmd) => ({ ...cmd, user_id: userId })))
      .select("*");
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("Failed to create flashcards: no data returned");
    }
    return data;
  }

  /**
   * Retrieves a paginated, optionally searchable list of flashcards for a user.
   * Supports full-text search on both front and back fields and basic sorting.
   *
   * @param supabase - Supabase client instance (from context.locals)
   * @param userId - ID of the authenticated user
   * @param query - Query parameters for pagination, search, and sorting
   * @returns Paginated list of flashcards with metadata
   */
  async listFlashcards(
    supabase: SupabaseClient,
    userId: string,
    query: ListFlashcardsQuery
  ): Promise<ListFlashcardsResponseDto> {
    const { search, page, limit, sort } = query;

    // Calculate pagination offset
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build base query
    // Filter out candidates (flashcards with ai_session_id set are still under review)
    let queryBuilder = supabase
      .from("flashcards")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .is("deleted_at", null)
      .is("ai_session_id", null); // Only show processed/manual flashcards

    // Apply full-text search if provided
    if (search && search.trim()) {
      queryBuilder = queryBuilder.textSearch("tsv", `'${search.trim()}'`, {
        type: "plain",
        config: "english",
      });
    }

    // Apply sorting
    // created_at descending by default, front ascending
    const ascending = sort === "front";
    queryBuilder = queryBuilder.order(sort, { ascending });

    // Apply pagination
    queryBuilder = queryBuilder.range(from, to);

    // Execute query
    const { data, error, count } = await queryBuilder;

    if (error) {
      throw error;
    }

    // Prepare response
    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  /**
   * Updates an existing flashcard's front and/or back text.
   * Only the owner of the flashcard can perform the update.
   *
   * @param supabase - Supabase client instance (from context.locals)
   * @param userId - ID of the authenticated user
   * @param id - UUID of the flashcard to update
   * @param command - Update command containing front and/or back text
   * @returns Updated flashcard
   * @throws Error if flashcard not found or user is not the owner
   */
  async updateFlashcard(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    command: UpdateFlashcardCommand
  ): Promise<FlashcardDto> {
    // Build update object with only provided fields
    const updateData: Record<string, string> = {};
    if (command.front !== undefined) {
      updateData.front = command.front;
    }
    if (command.back !== undefined) {
      updateData.back = command.back;
    }

    // Perform update with authorization check
    const { data, error } = await supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) {
      // Check if it's a "no rows returned" error
      if (error.code === "PGRST116") {
        throw new Error("Flashcard not found or you do not have permission to update it");
      }
      throw error;
    }

    if (!data) {
      throw new Error("Flashcard not found or you do not have permission to update it");
    }

    return data;
  }

  /**
   * Soft-deletes a single flashcard.
   * Only the owner of the flashcard can delete it.
   *
   * @param supabase - Supabase client instance (from context.locals)
   * @param userId - ID of the authenticated user
   * @param id - UUID of the flashcard to delete
   * @throws Error if flashcard not found or user is not the owner
   */
  async deleteFlashcard(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
    const { data, error } = await supabase
      .from("flashcards")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select("id");

    if (error) {
      throw error;
    }

    // If no rows were updated, flashcard wasn't found
    if (!data || data.length === 0) {
      throw new Error("Flashcard not found");
    }
  }

  /**
   * Soft-deletes multiple flashcards in bulk.
   * Only flashcards belonging to the user can be deleted.
   *
   * @param supabase - Supabase client instance (from context.locals)
   * @param userId - ID of the authenticated user
   * @param ids - Array of flashcard UUIDs to delete (max 100)
   * @returns Number of flashcards deleted
   * @throws Error if the database operation fails
   */
  async bulkDeleteFlashcards(supabase: SupabaseClient, userId: string, ids: string[]): Promise<number> {
    // Use select to get the actual rows updated (not head: true) for accurate count
    const { data, error } = await supabase
      .from("flashcards")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select("id");

    if (error) {
      throw error;
    }

    return data?.length ?? 0;
  }
}

export const flashcardsService = new FlashcardsService();
