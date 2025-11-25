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
  prompt: string;
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
  const response = await fetch(`/api/ai-sessions/${sessionId}/candidates`);

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = "/";
      throw new Error("Unauthorized");
    }
    if (response.status === 404) {
      throw new Error("Session not found");
    }
    throw new Error("Failed to fetch candidates");
  }

  return await response.json();
}

/**
 * Custom hook to fetch and manage candidates for a specific session
 */
export function useCandidates(sessionId: string | null): UseCandidatesResult {
  const [data, setData] = useState<CandidateViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const candidates = await fetchCandidates(sessionId);
      const viewModels: CandidateViewModel[] = candidates.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        prompt: c.prompt,
        aiSessionId: sessionId,
        created_at: new Date().toISOString(), // Backend doesn't return this yet
        status: "pending" as const,
      }));
      setData(viewModels);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setError(err instanceof Error ? err.message : "Failed to load candidates");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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


