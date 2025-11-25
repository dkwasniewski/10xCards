/**
 * AI Service for Flashcard Generation
 *
 * This service provides high-level flashcard generation functionality
 * using the OpenRouterService. It handles prompt construction, response
 * parsing, and validation specific to flashcard generation.
 */

import type { CandidateCreateDto } from "../../types";
import { OpenRouterService } from "./openrouter.service";
import type { ResponseFormat } from "../openrouter.types";

const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;

export const ALLOWED_MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4",
  "openai/gpt-3.5-turbo",
  "anthropic/claude-3-sonnet",
  "anthropic/claude-3-haiku",
];

export const DEFAULT_MODEL = "openai/gpt-4o-mini";

interface GenerateFlashcardsResult {
  candidates: CandidateCreateDto[];
  duration: number;
}

/**
 * System prompt for flashcard generation
 */
const FLASHCARD_SYSTEM_PROMPT = `You are a flashcard generation assistant. Your task is to create high-quality flashcards from the provided text.

Rules:
- Generate 5-15 flashcards depending on content length and complexity
- Each flashcard should test a single concept
- Questions should be clear and concise
- Answers should be accurate and complete but not overly verbose
- Focus on key concepts, definitions, and important facts
- Avoid yes/no questions

Return a JSON object with this exact format:
{
  "flashcards": [
    {
      "front": "Clear, specific question",
      "back": "Accurate, concise answer",
      "prompt": "Brief explanation of what this flashcard tests"
    }
  ]
}`;

/**
 * Response format schema for flashcard generation
 * Using simple JSON mode instead of strict schema for better compatibility
 */
const FLASHCARD_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_object",
};

/**
 * Generates flashcard candidates from input text using OpenRouter AI.
 *
 * @param inputText - The source text to generate flashcards from (1000-10000 chars)
 * @param model - The AI model to use (must be from ALLOWED_MODELS)
 * @returns Object containing generated candidates and generation duration in milliseconds
 * @throws Error if AI generation fails or response is invalid
 */
export async function generateFlashcards(inputText: string, model: string): Promise<GenerateFlashcardsResult> {
  // Validate model is allowed
  if (!ALLOWED_MODELS.includes(model)) {
    throw new Error(`Model "${model}" is not allowed. Allowed models: ${ALLOWED_MODELS.join(", ")}`);
  }

  // Validate API key is available
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const startTime = Date.now();

  // Initialize OpenRouter service
  const openRouterService = new OpenRouterService({
    apiKey: OPENROUTER_API_KEY,
  });

  // Build messages using the helper
  const messages = openRouterService.buildMessages({
    system: FLASHCARD_SYSTEM_PROMPT,
    user: `Generate flashcards from this text:\n\n${inputText}`,
  });

  try {
    // Make API request with structured response format
    const response = await openRouterService.chat({
      model,
      messages,
      temperature: 0.7,
      maxTokens: 2000,
      responseFormat: FLASHCARD_RESPONSE_FORMAT,
      metadata: {
        service: "flashcard-generation",
        inputLength: inputText.length,
      },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in OpenRouter response");
    }

    // Parse the JSON response
    let parsed: { flashcards: CandidateCreateDto[] };
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      throw new Error(
        `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
      );
    }

    // Extract and validate candidates
    let candidates = parsed.flashcards;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new Error("AI response did not contain valid flashcards array");
    }

    // Validate each candidate has required fields
    candidates = candidates.filter(
      (c) =>
        c.front &&
        typeof c.front === "string" &&
        c.back &&
        typeof c.back === "string" &&
        c.prompt &&
        typeof c.prompt === "string"
    );

    if (candidates.length === 0) {
      throw new Error("No valid flashcards in AI response after validation");
    }

    const duration = Date.now() - startTime;

    return { candidates, duration };
  } catch (error) {
    // Re-throw with additional context
    if (error instanceof Error) {
      throw new Error(`Flashcard generation failed: ${error.message}`);
    }
    throw error;
  }
}
