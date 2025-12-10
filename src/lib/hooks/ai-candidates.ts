// src/lib/hooks/ai-candidates.ts

import { useState, useEffect, useCallback } from "react";
import type {
  CandidateDto,
  CandidateCreateDto,
  CandidateActionCommand,
  CandidateActionResponseDto,
  GenerationSessionResponseDto,
  CreateGenerationSessionCommand,
} from "@/types";

/**
 * View model for candidates with additional UI state
 */
export interface CandidateViewModel {
  id: string;
  front: string;
  back: string;
  prompt: string | null;
  aiSessionId: string;
  created_at: string;
  status: "pending" | "new";
}

/**
 * Hook result for useCandidates
 */
export interface UseCandidatesResult {
  data: CandidateViewModel[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook result for useGeneration
 */
export interface UseGenerationResult {
  isGenerating: boolean;
  error: string | null;
  generate: (command: CreateGenerationSessionCommand) => Promise<{
    sessionId: string;
    candidates: CandidateCreateDto[];
  }>;
}

/**
 * Hook result for useCandidateActions
 */
export interface UseCandidateActionsResult {
  isProcessing: boolean;
  error: string | null;
  processActions: (sessionId: string, command: CandidateActionCommand) => Promise<CandidateActionResponseDto>;
}

/**
 * Fetch candidates for a specific AI session
 */
async function fetchCandidates(sessionId: string): Promise<CandidateDto[]> {
  const url = `/api/ai-sessions/${sessionId}/candidates`;
  // eslint-disable-next-line no-console
  console.log("[fetchCandidates] About to fetch:", url);

  const response = await fetch(url);
  // eslint-disable-next-line no-console
  console.log("[fetchCandidates] Response received. Status:", response.status);

  if (!response.ok) {
    if (response.status === 401) {
      // eslint-disable-next-line no-console
      console.error("[fetchCandidates] 401 Unauthorized - redirecting");
      window.location.href = "/";
      throw new Error("Unauthorized");
    }
    if (response.status === 404) {
      // eslint-disable-next-line no-console
      console.warn("[fetchCandidates] 404 Not Found - returning empty array");
      // Session not found - this is expected for new users or sessions from other users
      // Return empty array instead of throwing error
      return [];
    }
    // eslint-disable-next-line no-console
    console.error("[fetchCandidates] Error response status:", response.status);
    throw new Error("Failed to fetch candidates");
  }

  const data = await response.json();
  // eslint-disable-next-line no-console
  console.log("[fetchCandidates] Parsed response data:", data);
  return data;
}

/**
 * Custom hook to fetch and manage candidates for a specific session
 */
export function useCandidates(sessionId: string | null): UseCandidatesResult {
  // eslint-disable-next-line no-console
  console.log("[useCandidates] Hook called with sessionId:", sessionId);

  const [data, setData] = useState<CandidateViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // eslint-disable-next-line no-console
    console.log("[useCandidates.refresh] Called with sessionId:", sessionId);

    setIsLoading(true);
    setError(null);

    try {
      let candidates: CandidateDto[];

      if (!sessionId) {
        // No session ID - fetch ALL pending candidates across all sessions
        // eslint-disable-next-line no-console
        console.log("[useCandidates.refresh] No sessionId, fetching ALL pending candidates");
        const response = await fetch("/api/candidates/pending");

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/";
            throw new Error("Unauthorized");
          }
          throw new Error("Failed to fetch pending candidates");
        }

        candidates = await response.json();
        // eslint-disable-next-line no-console
        console.log("[useCandidates.refresh] Received ALL pending candidates:", candidates.length);
      } else {
        // Session ID provided - fetch candidates for specific session
        // eslint-disable-next-line no-console
        console.log("[useCandidates.refresh] Starting fetch for sessionId:", sessionId);
        candidates = await fetchCandidates(sessionId);
        // eslint-disable-next-line no-console
        console.log("[useCandidates.refresh] Received candidates for session:", candidates.length);

        // If we got an empty array back (404 was handled), clear the invalid session
        if (candidates.length === 0) {
          // Clear localStorage if this session doesn't exist or doesn't belong to current user
          if (typeof window !== "undefined") {
            const storedSessionId = localStorage.getItem("10xCards_lastSessionId");
            if (storedSessionId === sessionId) {
              localStorage.removeItem("10xCards_lastSessionId");
            }
          }
        }
      }

      const viewModels: CandidateViewModel[] = candidates.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        prompt: c.prompt,
        aiSessionId: c.ai_session_id || sessionId || "", // Use candidate's session ID if available
        created_at: new Date().toISOString(), // Backend doesn't return this yet
        status: "pending" as const,
      }));
      setData(viewModels);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch candidates:", err);
      setError(err instanceof Error ? err.message : "Failed to load candidates");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[useCandidates.useEffect] Running effect, calling refresh()");
    refresh();
  }, [refresh]);

  // eslint-disable-next-line no-console
  console.log("[useCandidates] Returning state:", { dataLength: data.length, isLoading, error });

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Custom hook to generate new AI candidates
 */
export function useGeneration(): UseGenerationResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (command: CreateGenerationSessionCommand) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Validation failed");
        }
        if (response.status === 401) {
          window.location.href = "/";
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to generate candidates");
      }

      const result: GenerationSessionResponseDto = await response.json();
      return {
        sessionId: result.id,
        candidates: result.candidates,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to generate candidates:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate candidates";
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    error,
    generate,
  };
}

/**
 * Custom hook to process candidate actions (accept/edit/reject)
 */
export function useCandidateActions(): UseCandidateActionsResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processActions = useCallback(
    async (sessionId: string, command: CandidateActionCommand): Promise<CandidateActionResponseDto> => {
      setIsProcessing(true);
      setError(null);

      try {
        const response = await fetch(`/api/ai-sessions/${sessionId}/candidates/actions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Validation failed");
          }
          if (response.status === 404) {
            throw new Error("Session or candidates not found");
          }
          if (response.status === 401) {
            window.location.href = "/";
            throw new Error("Unauthorized");
          }
          throw new Error("Failed to process actions");
        }

        const result: CandidateActionResponseDto = await response.json();
        return result;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to process candidate actions:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to process actions";
        setError(errorMessage);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    isProcessing,
    error,
    processActions,
  };
}
