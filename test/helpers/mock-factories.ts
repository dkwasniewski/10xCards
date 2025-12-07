/**
 * Mock factory functions for creating test data
 * Following Vitest best practices for reusable test doubles
 */

import type { User } from "@supabase/supabase-js";
import type { CandidateCreateDto } from "@/types";
import type { ChatSuccess, OpenRouterMessage } from "@/lib/openrouter.types";

/**
 * Create a mock user object for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: "test-user-id",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

/**
 * Create a mock flashcard for testing
 */
export function createMockFlashcard(overrides?: any) {
  return {
    id: "test-flashcard-id",
    user_id: "test-user-id",
    front: "Test Question",
    back: "Test Answer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock AI session for testing
 */
export function createMockAISession(overrides?: any) {
  return {
    id: "test-session-id",
    user_id: "test-user-id",
    input_text: "Test input text",
    status: "pending",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock candidate for testing
 */
export function createMockCandidate(overrides?: Partial<CandidateCreateDto>): CandidateCreateDto {
  return {
    front: "Test Question",
    back: "Test Answer",
    prompt: "Test Prompt",
    ...overrides,
  };
}

/**
 * Create multiple mock candidates for testing
 */
export function createMockCandidates(count: number): CandidateCreateDto[] {
  return Array.from({ length: count }, (_, i) =>
    createMockCandidate({
      front: `Question ${i + 1}`,
      back: `Answer ${i + 1}`,
      prompt: `Prompt ${i + 1}`,
    })
  );
}

/**
 * Create a mock OpenRouter chat success response
 */
export function createMockChatSuccess(overrides?: Partial<ChatSuccess>): ChatSuccess {
  return {
    id: "test-chat-id",
    created: Date.now(),
    model: "test-model",
    usage: {
      prompt: 100,
      completion: 50,
    },
    choices: [
      {
        message: {
          role: "assistant",
          content: "Test response",
        },
        finish_reason: "stop",
        index: 0,
      },
    ],
    ...overrides,
  };
}

/**
 * Create a mock OpenRouter message
 */
export function createMockMessage(overrides?: Partial<OpenRouterMessage>): OpenRouterMessage {
  return {
    role: "user",
    content: "Test message",
    ...overrides,
  };
}

/**
 * Create a mock fetch Response for testing
 */
export function createMockFetchResponse(data: any, options?: { status?: number; ok?: boolean }) {
  return {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  } as Response;
}

/**
 * Create a mock fetch implementation for testing
 */
export function createMockFetch(response: any) {
  return async () => createMockFetchResponse(response);
}
