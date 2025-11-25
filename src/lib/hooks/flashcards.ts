// src/lib/hooks/flashcards.ts

import { useState, useEffect, useCallback } from "react";
import type {
  FlashcardDto,
  ListFlashcardsResponseDto,
  UpdateFlashcardCommand,
  PaginationDto,
  SearchParams,
  FlashcardsState,
} from "@/types";

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Record<string, string>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Result interface for the useFlashcards hook
 */
export interface UseFlashcardsResult {
  // Data state
  flashcards: FlashcardDto[];
  pagination: PaginationDto;
  isLoading: boolean;
  error: string | null;

  // Search and pagination
  searchParams: SearchParams;
  updateSearch: (search: string) => void;
  updatePage: (page: number) => void;

  // Mutations
  updateFlashcard: (id: string, command: UpdateFlashcardCommand) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  bulkDeleteFlashcards: (ids: string[]) => Promise<number>;

  // Utility
  refetch: () => Promise<void>;
}

/**
 * Fetch flashcards from the API
 */
async function fetchFlashcards(params: SearchParams): Promise<ListFlashcardsResponseDto> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    sort: params.sort,
  });

  if (params.search) {
    queryParams.append("search", params.search);
  }

  const response = await fetch(`/api/flashcards?${queryParams.toString()}`);

  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      window.location.href = "/";
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch flashcards");
  }

  return await response.json();
}

/**
 * Update a flashcard
 */
async function updateFlashcardApi(id: string, command: UpdateFlashcardCommand): Promise<FlashcardDto> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json();
      throw new ValidationError(error.message, error.errors || {});
    }
    if (response.status === 404) {
      throw new Error("Flashcard not found");
    }
    throw new Error("Failed to update flashcard");
  }

  return await response.json();
}

/**
 * Delete a single flashcard
 */
async function deleteFlashcardApi(id: string): Promise<void> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Flashcard not found");
    }
    throw new Error("Failed to delete flashcard");
  }
}

/**
 * Bulk delete flashcards
 */
async function bulkDeleteFlashcardsApi(ids: string[]): Promise<{ deletedCount: number }> {
  const response = await fetch("/api/flashcards", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json();
      throw new ValidationError(error.message, error.errors || {});
    }
    if (response.status === 404) {
      // Flashcards not found - they may have been already deleted
      // This is not a critical error, return 0 deleted count
      return { deletedCount: 0 };
    }
    throw new Error("Failed to delete flashcards");
  }

  // Parse the actual deleted count from the API response
  const result = await response.json();
  return { deletedCount: result.deleted };
}

/**
 * Create flashcards (bulk)
 */
async function createFlashcardsApi(
  flashcards: { front: string; back: string; source: string; ai_session_id?: string }[]
): Promise<void> {
  const response = await fetch("/api/flashcards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(flashcards),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json();
      throw new ValidationError(error.message, error.errors || {});
    }
    throw new Error("Failed to create flashcards");
  }
}

/**
 * Custom hook to manage flashcards data and operations
 */
export function useFlashcards(): UseFlashcardsResult {
  const [state, setState] = useState<FlashcardsState>({
    flashcards: [],
    pagination: { page: 1, limit: 10, total: 0 },
    searchParams: {
      search: "",
      page: 1,
      limit: 10,
      sort: "created_at",
    },
    isLoading: false,
    error: null,
  });

  /**
   * Fetch flashcards when search params change
   */
  useEffect(() => {
    const fetchData = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await fetchFlashcards(state.searchParams);
        setState((prev) => ({
          ...prev,
          flashcards: result.data,
          pagination: result.pagination,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Failed to fetch flashcards:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to load flashcards",
          isLoading: false,
        }));
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.searchParams.search, state.searchParams.page, state.searchParams.limit, state.searchParams.sort]);

  /**
   * Update search query and reset to page 1
   */
  const updateSearch = useCallback((search: string) => {
    setState((prev) => ({
      ...prev,
      searchParams: {
        ...prev.searchParams,
        search,
        page: 1, // Reset to first page on search
      },
    }));
  }, []);

  /**
   * Update current page
   */
  const updatePage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      searchParams: {
        ...prev.searchParams,
        page: Math.max(1, page), // Ensure page is at least 1
      },
    }));
  }, []);

  /**
   * Refetch flashcards manually
   */
  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetchFlashcards(state.searchParams);
      setState((prev) => ({
        ...prev,
        flashcards: result.data,
        pagination: result.pagination,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to load flashcards",
        isLoading: false,
      }));
    }
  }, [state.searchParams]);

  /**
   * Update a flashcard
   */
  const updateFlashcard = useCallback(
    async (id: string, command: UpdateFlashcardCommand) => {
      try {
        await updateFlashcardApi(id, command);
        await refetch(); // Refetch to get updated data
      } catch (error) {
        console.error("Failed to update flashcard:", error);
        throw error; // Re-throw to allow component to handle
      }
    },
    [refetch]
  );

  /**
   * Delete a single flashcard
   */
  const deleteFlashcard = useCallback(
    async (id: string) => {
      try {
        await deleteFlashcardApi(id);
        await refetch(); // Refetch to get updated list
      } catch (error) {
        console.error("Failed to delete flashcard:", error);
        throw error; // Re-throw to allow component to handle
      }
    },
    [refetch]
  );

  /**
   * Bulk delete flashcards
   */
  const bulkDeleteFlashcards = useCallback(
    async (ids: string[]) => {
      try {
        const result = await bulkDeleteFlashcardsApi(ids);
        await refetch(); // Refetch to get updated list
        return result.deletedCount;
      } catch (error) {
        console.error("Failed to bulk delete flashcards:", error);
        throw error; // Re-throw to allow component to handle
      }
    },
    [refetch]
  );

  return {
    flashcards: state.flashcards,
    pagination: state.pagination,
    isLoading: state.isLoading,
    error: state.error,
    searchParams: state.searchParams,
    updateSearch,
    updatePage,
    updateFlashcard,
    deleteFlashcard,
    bulkDeleteFlashcards,
    refetch,
  };
}

/**
 * Custom hook to create flashcards
 */
export function useCreateFlashcard() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(
    async (flashcards: { front: string; back: string; source: string; ai_session_id?: string }[]) => {
      setIsLoading(true);
      try {
        await createFlashcardsApi(flashcards);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { mutate, isLoading };
}
