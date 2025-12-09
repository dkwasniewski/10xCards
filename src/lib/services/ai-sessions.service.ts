import type { SupabaseClient } from "../../db/supabase.client";
import type { CandidateCreateDto, CandidateDto, CandidateActionCommand, CandidateActionResponseDto } from "../../types";
import { generateFlashcards } from "./ai.service";

interface CreateGenerationSessionParams {
  userId: string;
  inputText: string;
  model: string;
}

interface CreateGenerationSessionResult {
  sessionId: string;
  createdAt: string;
  inputTextHash: string;
}

/**
 * Generates SHA-256 hash of input text for duplicate detection.
 * Uses Web Crypto API for compatibility with Cloudflare Workers/Pages.
 *
 * @param text - The input text to hash
 * @returns SHA-256 hash string (hex encoded)
 */
export async function hashInputText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  // Use crypto from globalThis and call digest with proper binding
  const crypto = globalThis.crypto;
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Creates a new generation session record in the database.
 *
 * @param supabase - The Supabase client instance
 * @param params - Session creation parameters (userId, inputText, model)
 * @returns Object containing the created session ID, timestamp, and input text hash
 * @throws Error if database operation fails
 */
export async function createGenerationSession(
  supabase: SupabaseClient,
  params: CreateGenerationSessionParams
): Promise<CreateGenerationSessionResult> {
  const inputTextHash = await hashInputText(params.inputText);

  const { data, error } = await supabase
    .from("ai_generation_sessions")
    .insert({
      user_id: params.userId,
      input_text: params.inputText,
      model: params.model,
      generation_duration: 0,
    })
    .select("id, created_at")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create generation session");

  return {
    sessionId: data.id,
    createdAt: data.created_at,
    inputTextHash,
  };
}

/**
 * Checks if a generation session with the same input text hash already exists.
 * Note: This is a placeholder for future duplicate detection implementation.
 * Would require storing the hash in the database schema.
 *
 * @returns Session ID if duplicate found, null otherwise
 */
export async function findDuplicateSession(): Promise<string | null> {
  // Placeholder for future duplicate detection implementation
  return null;
}

/**
 * Stores generated flashcard candidates in the database.
 *
 * @param supabase - The Supabase client instance
 * @param sessionId - The generation session UUID
 * @param userId - The user's UUID
 * @param model - The AI model used for generation
 * @param candidates - Array of candidate flashcards to store
 * @throws Error if database operation fails
 */
export async function storeCandidates(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  model: string,
  candidates: CandidateCreateDto[]
): Promise<void> {
  const flashcardsToInsert = candidates.map((candidate) => ({
    user_id: userId,
    ai_session_id: sessionId,
    source: "ai" as const,
    front: candidate.front,
    back: candidate.back,
    prompt: candidate.prompt,
    model: model,
  }));

  const { error } = await supabase.from("flashcards").insert(flashcardsToInsert);

  if (error) throw error;
}

/**
 * Updates the generation duration for a generation session.
 *
 * @param supabase - The Supabase client instance
 * @param sessionId - The generation session UUID
 * @param duration - Generation duration in milliseconds
 * @throws Error if database operation fails
 */
export async function updateGenerationDuration(
  supabase: SupabaseClient,
  sessionId: string,
  duration: number
): Promise<void> {
  const { error } = await supabase
    .from("ai_generation_sessions")
    .update({ generation_duration: duration })
    .eq("id", sessionId);

  if (error) throw error;
}

/**
 * Retrieves all flashcard candidates for a specific AI generation session.
 * Verifies that the session exists and belongs to the requesting user.
 *
 * @param supabase - The Supabase client instance
 * @param sessionId - The generation session UUID
 * @param userId - The user's UUID (for authorization)
 * @returns Array of candidate flashcards
 * @throws Error if session not found or user is not the owner
 */
export async function getAiSessionCandidates(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<CandidateDto[]> {
  // 1. Verify session exists and belongs to the user
  const { data: session, error: sessionError } = await supabase
    .from("ai_generation_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !session) {
    const error = new Error("Session not found");
    error.name = "NotFoundError";
    throw error;
  }

  // 2. Fetch candidates (flashcards linked to the session)
  const { data, error } = await supabase
    .from("flashcards")
    .select("id, front, back, prompt")
    .eq("ai_session_id", sessionId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data as CandidateDto[];
}

/**
 * Generates flashcard candidates using OpenRouter AI service.
 *
 * @param inputText - The source text to generate flashcards from (1000-10000 chars)
 * @param model - The AI model to use for generation
 * @param apiKey - The OpenRouter API key (required for runtime access in Cloudflare)
 * @returns Promise resolving to object with candidates array and generation duration
 * @throws Error if AI generation fails or response is invalid
 */
export async function generateCandidates(
  inputText: string,
  model: string,
  apiKey: string
): Promise<{ candidates: CandidateCreateDto[]; duration: number }> {
  return await generateFlashcards(inputText, model, apiKey);
}

/**
 * Generates mock flashcard candidates for testing without calling external AI.
 *
 * @deprecated Use generateCandidates() instead for production
 * @param inputText - The source text to generate flashcards from
 * @returns Array of mock flashcard candidates
 */
export function generateMockCandidates(inputText: string): CandidateCreateDto[] {
  const textLength = inputText.length;
  const wordCount = inputText.split(/\s+/).length;

  return [
    {
      front: "What is the approximate length of the provided text?",
      back: `The text is approximately ${textLength} characters long with about ${wordCount} words.`,
      prompt: "Generate a flashcard about the text length statistics",
    },
    {
      front: "What type of content was provided for flashcard generation?",
      back: "Educational or informational text content intended for learning and memorization.",
      prompt: "Generate a flashcard about the content type",
    },
    {
      front: "What is the purpose of generating flashcards from text?",
      back: "To transform learning material into question-answer pairs that facilitate active recall and spaced repetition study techniques.",
      prompt: "Generate a flashcard about the purpose of flashcard generation",
    },
    {
      front: "How many flashcards were generated from this text?",
      back: "Multiple flashcards were generated to cover key concepts and information from the source material.",
      prompt: "Generate a flashcard about the generation process",
    },
    {
      front: "What is the benefit of AI-generated flashcards?",
      back: "AI-generated flashcards save time by automatically extracting key concepts and creating study materials, allowing learners to focus on studying rather than card creation.",
      prompt: "Generate a flashcard about AI flashcard benefits",
    },
  ];
}

/**
 * Processes bulk candidate actions (accept/edit/reject) for a generation session.
 * Updates flashcard records and session counters in a transactional manner.
 *
 * @param supabase - The Supabase client instance
 * @param sessionId - The generation session UUID
 * @param command - The candidate actions command containing the actions array
 * @param userId - The user's UUID (for authorization)
 * @returns Summary of processed actions grouped by type
 * @throws Error if session not found, candidates not found, or user is not the owner
 */
export async function processCandidateActions(
  supabase: SupabaseClient,
  sessionId: string,
  command: CandidateActionCommand,
  userId: string
): Promise<CandidateActionResponseDto> {
  // 1. Verify session exists and belongs to the user
  const { data: session, error: sessionError } = await supabase
    .from("ai_generation_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !session) {
    const error = new Error("Session not found");
    error.name = "NotFoundError";
    throw error;
  }

  // 2. Extract candidate IDs from actions
  const candidateIds = command.actions.map((action) => action.candidate_id);

  // 3. Fetch all candidates to verify they exist and belong to the session
  const { data: candidates, error: candidatesError } = await supabase
    .from("flashcards")
    .select("id, user_id, ai_session_id")
    .in("id", candidateIds)
    .eq("ai_session_id", sessionId)
    .eq("user_id", userId);

  if (candidatesError) throw candidatesError;

  // 4. Verify all candidates were found
  if (!candidates || candidates.length !== candidateIds.length) {
    const foundIds = new Set(candidates?.map((c) => c.id) || []);
    const missingIds = candidateIds.filter((id) => !foundIds.has(id));
    const error = new Error(`Candidates not found: ${missingIds.join(", ")}`);
    error.name = "NotFoundError";
    throw error;
  }

  // 5. Group actions by type for batch processing
  const acceptIds: string[] = [];
  const editActions: { id: string; front: string; back: string }[] = [];
  const rejectIds: string[] = [];

  for (const action of command.actions) {
    if (action.action === "accept") {
      acceptIds.push(action.candidate_id);
    } else if (action.action === "edit") {
      if (!action.edited_front || !action.edited_back) {
        const error = new Error(
          `Edit action for candidate ${action.candidate_id} is missing edited_front or edited_back`
        );
        error.name = "ValidationError";
        throw error;
      }
      editActions.push({
        id: action.candidate_id,
        front: action.edited_front,
        back: action.edited_back,
      });
    } else if (action.action === "reject") {
      rejectIds.push(action.candidate_id);
    }
  }

  // 6. Process accept actions (batch update)
  // Accept actions "graduate" candidates to active flashcards by clearing ai_session_id
  if (acceptIds.length > 0) {
    const { error: acceptError } = await supabase
      .from("flashcards")
      .update({
        ai_session_id: null, // Unlink from session - marks as processed/active
        updated_at: new Date().toISOString(),
      })
      .in("id", acceptIds);

    if (acceptError) throw acceptError;
  }

  // 7. Process edit actions (individual updates due to different values)
  // Edit actions also "graduate" candidates to active flashcards
  for (const editAction of editActions) {
    const { error: editError } = await supabase
      .from("flashcards")
      .update({
        ai_session_id: null, // Unlink from session - marks as processed/active
        front: editAction.front,
        back: editAction.back,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editAction.id);

    if (editError) throw editError;
  }

  // 8. Process reject actions (soft delete using deleted_at)
  if (rejectIds.length > 0) {
    const { error: rejectError } = await supabase
      .from("flashcards")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .in("id", rejectIds);

    if (rejectError) throw rejectError;
  }

  // 9. Update session counters
  const { error: updateError } = await supabase
    .from("ai_generation_sessions")
    .update({
      accepted_unedited_count: acceptIds.length,
      accepted_edited_count: editActions.length,
    })
    .eq("id", sessionId);

  if (updateError) throw updateError;

  // 10. Return summary
  return {
    accepted: acceptIds,
    edited: editActions.map((a) => a.id),
    rejected: rejectIds,
  };
}
