import type { APIRoute } from "astro";
import type { CreateGenerationSessionCommand, GenerationSessionResponseDto } from "../../types";
import { z } from "zod";
import { DEFAULT_MODEL, ALLOWED_MODELS } from "../../lib/services/ai.service";
import {
  createGenerationSession,
  storeCandidates,
  updateGenerationDuration,
  generateCandidates,
} from "../../lib/services/ai-sessions.service";
import { logEvent } from "../../lib/services/event-log.service";

export const prerender = false;

// Zod schema for request validation
const createGenerationSessionSchema = z.object({
  input_text: z
    .string()
    .min(1000, "input_text must be at least 1000 characters")
    .max(10000, "input_text must be at most 10000 characters")
    .trim()
    .refine((val) => val.length > 0, "input_text cannot be empty or whitespace only"),
  model: z
    .string()
    .refine((val) => ALLOWED_MODELS.includes(val), {
      message: `Invalid model. Allowed models: ${ALLOWED_MODELS.join(", ")}`,
    })
    .optional(),
});

/**
 * Helper function to create standardized error responses.
 */
function errorResponse(status: number, error: string, details?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error, ...details }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/ai-sessions
 *
 * Creates a generation session and generates flashcard candidates from user-provided text.
 *
 * Flow:
 * 1. Validate input (text length, model)
 * 2. Hash input text for duplicate detection
 * 3. Create generation session record
 * 4. Generate flashcards using OpenRouter AI
 * 5. Store candidates in database
 * 6. Log event for analytics
 * 7. Return session ID, candidates, and input text hash
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  if (!supabase) {
    return errorResponse(500, "Internal server error", {
      message: "Supabase client unavailable",
    });
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

  // 1. Parse and Validate Input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON", {
      message: "Request body must be valid JSON.",
    });
  }

  const parseResult = createGenerationSessionSchema.safeParse(body);
  if (!parseResult.success) {
    return errorResponse(400, "Validation failed", {
      details: parseResult.error.errors,
    });
  }

  const { input_text, model = DEFAULT_MODEL } = parseResult.data as CreateGenerationSessionCommand;

  // 2. Create Generation Session Record (hash is computed inside createGenerationSession)
  // 3. Create Generation Session Record
  let sessionId: string;
  let inputTextHash: string;
  try {
    const session = await createGenerationSession(supabase, {
      userId,
      inputText: input_text,
      model,
    });
    sessionId = session.sessionId;
    inputTextHash = session.inputTextHash;
  } catch {
    return errorResponse(500, "Internal server error", {
      message: "Failed to create generation session. Please try again.",
    });
  }

  // 4. Generate Flashcard Candidates using OpenRouter AI
  let candidates;
  let duration;
  try {
    const result = await generateCandidates(input_text, model);
    candidates = result.candidates;
    duration = result.duration;
  } catch (error) {
    // Log the full error for debugging
    // eslint-disable-next-line no-console
    console.error("Flashcard generation error:", error);

    // Log failure event
    await logEvent(supabase, {
      userId,
      eventType: "generation_session_failed",
      eventSource: "ai",
      aiSessionId: sessionId,
    });

    // Extract error message from various error formats
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check if there's a raw property with more details
      if ("raw" in error && typeof error.raw === "object" && error.raw !== null) {
        // eslint-disable-next-line no-console
        console.error("Raw error details:", JSON.stringify(error.raw, null, 2));
      }
    }

    return errorResponse(500, "Failed to generate flashcards", {
      message: "AI generation service encountered an error. Please try again.",
      details: errorMessage,
    });
  }

  // 5. Store Candidates as Flashcards
  try {
    await storeCandidates(supabase, sessionId, userId, model, candidates);
    await updateGenerationDuration(supabase, sessionId, duration);
  } catch {
    return errorResponse(500, "Internal server error", {
      message: "Failed to save generated flashcards. Please try again.",
    });
  }

  // 6. Log Success Event
  await logEvent(supabase, {
    userId,
    eventType: "generation_session_created",
    eventSource: "ai",
    aiSessionId: sessionId,
  });

  // 7. Build and Return Response
  const responseBody: GenerationSessionResponseDto = {
    id: sessionId,
    candidates: candidates,
    input_text_hash: inputTextHash,
  };

  return new Response(JSON.stringify(responseBody), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
