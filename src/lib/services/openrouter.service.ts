/**
 * OpenRouter Service
 *
 * A type-safe wrapper around the OpenRouter HTTP API that provides:
 * - Message construction and management
 * - Model and parameter configuration
 * - Response format handling (including JSON schema)
 * - Robust error handling with retry logic
 * - Security (API key isolation, rate-limit protection)
 * - Telemetry hooks for logging and tracing
 */

import { z } from "zod";
import pRetry from "p-retry";
import type {
  OpenRouterServiceOptions,
  ChatOptions,
  ChatSuccess,
  ChatChunk,
  OpenRouterMessage,
  MessageContext,
  ModelMeta,
  Logger,
  RetryConfig,
} from "../openrouter.types";
import {
  OpenRouterError,
  OpenRouterBadRequestError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterServerError,
  OpenRouterNetworkError,
} from "../openrouter.types";

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Default console logger implementation
 */
const DEFAULT_LOGGER: Logger = {
  info: () => {
    // No-op in production
  },
  warn: () => {
    // No-op in production
  },
  error: () => {
    // No-op in production
  },
  debug: () => {
    // No-op in production
  },
};

/**
 * Zod schema for API key validation
 */
const apiKeySchema = z.string().trim().min(1, "API key cannot be empty");

/**
 * Zod schema for chat options validation
 */
const chatOptionsSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant", "tool"]),
        content: z.string(),
        name: z.string().optional(),
      })
    )
    .min(1, "At least one message is required"),
  model: z.string().min(1, "Model identifier is required"),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  responseFormat: z.any().optional(),
  metadata: z.record(z.unknown()).optional(),
  abortSignal: z.any().optional(),
});

/**
 * OpenRouter Service
 *
 * Provides a clean, type-safe interface for interacting with the OpenRouter API.
 * This service should be instantiated server-side only to protect the API key.
 */
export class OpenRouterService {
  #apiKey: string;
  #baseURL: string;
  #logger: Logger;
  #fetchImpl: typeof fetch;
  #retryConfig: RetryConfig;
  #modelCache: { data: ModelMeta[] | null; timestamp: number } = {
    data: null,
    timestamp: 0,
  };

  /**
   * Creates a new OpenRouterService instance
   *
   * @param options - Service configuration options
   * @throws {z.ZodError} If API key is invalid
   */
  constructor(options: OpenRouterServiceOptions) {
    // Validate API key
    this.#apiKey = apiKeySchema.parse(options.apiKey);

    // Normalize base URL (remove trailing slash)
    this.#baseURL = (options.baseURL || "https://openrouter.ai/api/v1").replace(/\/$/, "");

    // Set logger
    this.#logger = options.logger || DEFAULT_LOGGER;

    // Set fetch implementation with proper binding for Cloudflare Workers
    // Wrap fetch to preserve 'this' context and avoid "Illegal invocation" errors
    this.#fetchImpl = options.fetchImpl || ((url: string | URL | Request, init?: RequestInit) => fetch(url, init));

    // Set retry configuration
    this.#retryConfig = options.retryConfig || DEFAULT_RETRY_CONFIG;

    this.#logger.debug("OpenRouterService initialized", {
      baseURL: this.#baseURL,
      retryConfig: this.#retryConfig,
    });
  }

  /**
   * Performs a single request/response chat cycle
   *
   * @param options - Chat completion options
   * @returns Promise resolving to chat completion response
   * @throws {OpenRouterError} For various error conditions
   */
  async chat(options: ChatOptions): Promise<ChatSuccess> {
    // Validate options
    this.#validateOptions(options);

    const startTime = Date.now();
    this.#logger.info("Starting chat request", {
      model: options.model,
      messageCount: options.messages.length,
    });

    try {
      // Perform request with retry logic
      const response = await this.#retry(async () => {
        return await this.#fetch("/chat/completions", {
          method: "POST",
          headers: this.#buildHeaders(options),
          body: JSON.stringify(this.#buildRequestBody(options)),
          signal: options.abortSignal,
        });
      });

      const duration = Date.now() - startTime;
      this.#logger.info("Chat request completed", {
        model: options.model,
        duration,
        usage: response.usage,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.#logger.error("Chat request failed", {
        model: options.model,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * SSE/streaming support for incremental token generation
   *
   * @param options - Chat completion options
   * @returns AsyncIterable of chat chunks
   * @throws {OpenRouterError} For various error conditions
   */
  async *stream(options: ChatOptions): AsyncIterable<ChatChunk> {
    // Validate options
    this.#validateOptions(options);

    this.#logger.info("Starting streaming chat request", {
      model: options.model,
      messageCount: options.messages.length,
    });

    const response = await this.#fetchImpl(`${this.#baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        ...this.#buildHeaders(options),
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        ...this.#buildRequestBody(options),
        stream: true,
      }),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      await this.#handleError(response);
    }

    if (!response.body) {
      throw new OpenRouterNetworkError("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            try {
              const chunk = JSON.parse(trimmed.slice(6)) as ChatChunk;
              yield chunk;
            } catch (error) {
              this.#logger.warn("Failed to parse streaming chunk", {
                line: trimmed,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Convenience helper for building message arrays from context
   *
   * @param context - Message context with system, user, and history
   * @returns Array of OpenRouter messages
   */
  buildMessages(context: MessageContext): OpenRouterMessage[] {
    const messages: OpenRouterMessage[] = [];

    // Add system message if provided
    if (context.system) {
      messages.push({
        role: "system",
        content: context.system,
      });
    }

    // Add conversation history if provided
    if (context.history && context.history.length > 0) {
      for (const msg of context.history) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({
      role: "user",
      content: context.user,
    });

    return messages;
  }

  /**
   * Fetches available models and their capabilities
   * Results are cached for 5 minutes
   *
   * @returns Promise resolving to array of model metadata
   */
  async modelList(): Promise<ModelMeta[]> {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Return cached data if still valid
    if (this.#modelCache.data && now - this.#modelCache.timestamp < CACHE_DURATION) {
      this.#logger.debug("Returning cached model list");
      return this.#modelCache.data;
    }

    this.#logger.info("Fetching model list from API");

    try {
      const response = await this.#fetchImpl(`${this.#baseURL}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.#apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        await this.#handleError(response);
      }

      const data = (await response.json()) as { data: ModelMeta[] };

      // Update cache
      this.#modelCache = {
        data: data.data,
        timestamp: now,
      };

      return data.data;
    } catch (error) {
      this.#logger.error("Failed to fetch model list", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validates chat options using Zod schema
   *
   * @param options - Options to validate
   * @throws {z.ZodError} If validation fails
   */
  #validateOptions(options: ChatOptions): void {
    chatOptionsSchema.parse(options);
  }

  /**
   * Builds HTTP headers for API requests
   *
   * @param options - Chat options (may contain metadata)
   * @returns Headers object
   */
  #buildHeaders(options: ChatOptions): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.#apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://10xcards.app", // Optional: helps with OpenRouter analytics
      "X-Title": "10xCards", // Optional: app identification
    };

    // Add metadata header if provided
    if (options.metadata) {
      headers["X-Metadata"] = JSON.stringify(options.metadata);
    }

    return headers;
  }

  /**
   * Builds the request body for chat completions
   *
   * @param options - Chat options
   * @returns Request body object
   */
  #buildRequestBody(options: ChatOptions): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: options.model,
      messages: options.messages,
    };

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    }

    if (options.responseFormat) {
      body.response_format = options.responseFormat;
    }

    return body;
  }

  /**
   * Performs HTTP request with error handling
   *
   * @param endpoint - API endpoint path
   * @param init - Fetch init options
   * @returns Promise resolving to parsed response
   * @throws {OpenRouterError} For various error conditions
   */
  async #fetch(endpoint: string, init: RequestInit): Promise<ChatSuccess> {
    try {
      const response = await this.#fetchImpl(`${this.#baseURL}${endpoint}`, init);

      if (!response.ok) {
        await this.#handleError(response);
      }

      const data = (await response.json()) as ChatSuccess;
      return data;
    } catch (error: unknown) {
      // Handle network errors
      if (error instanceof TypeError || (error instanceof Error && error.name === "AbortError")) {
        throw new OpenRouterNetworkError(error instanceof Error ? error.message : "Network request failed", error);
      }
      // Re-throw OpenRouter errors
      if (error instanceof OpenRouterError) {
        throw error;
      }
      // Wrap unknown errors
      throw new OpenRouterError(error instanceof Error ? error.message : "Unknown error occurred", undefined, error);
    }
  }

  /**
   * Handles non-2xx HTTP responses
   *
   * @param response - Fetch response object
   * @throws {OpenRouterError} Appropriate error based on status code
   */
  async #handleError(response: Response): Promise<never> {
    const status = response.status;
    let errorBody: unknown;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    let errorMessage = `HTTP ${status} error`;

    if (typeof errorBody === "object" && errorBody !== null && "error" in errorBody) {
      const errorField = (errorBody as { error: unknown }).error;
      if (typeof errorField === "string") {
        errorMessage = errorField;
      } else if (typeof errorField === "object" && errorField !== null) {
        // If error is an object, try to extract message or code
        const errorObj = errorField as Record<string, unknown>;
        errorMessage = (errorObj.message as string) || (errorObj.code as string) || JSON.stringify(errorField);
      } else {
        errorMessage = String(errorField);
      }
    }

    // Handle specific status codes
    switch (status) {
      case 400:
        throw new OpenRouterBadRequestError(errorMessage, errorBody);

      case 401:
      case 403:
        throw new OpenRouterAuthError(errorMessage, errorBody);

      case 429: {
        // Extract retry-after header if present
        const retryAfter = response.headers.get("retry-after");
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
        throw new OpenRouterRateLimitError(errorMessage, retryAfterSeconds, errorBody);
      }

      default:
        if (status >= 500) {
          throw new OpenRouterServerError(errorMessage, status, errorBody);
        }
        throw new OpenRouterError(errorMessage, status, errorBody);
    }
  }

  /**
   * Retry wrapper with exponential backoff
   *
   * @param fn - Function to retry
   * @returns Promise resolving to function result
   */
  async #retry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await pRetry(fn, {
        retries: this.#retryConfig.maxRetries,
        minTimeout: this.#retryConfig.initialDelay,
        maxTimeout: this.#retryConfig.maxDelay,
        factor: this.#retryConfig.backoffMultiplier,
        onFailedAttempt: (error) => {
          // Extract the actual error from p-retry's FailedAttemptError
          const actualError = "error" in error ? error.error : error;

          // Only retry on rate limits and server errors
          if (actualError instanceof OpenRouterRateLimitError || actualError instanceof OpenRouterServerError) {
            this.#logger.warn("Retrying request after error", {
              attempt: error.attemptNumber,
              retriesLeft: error.retriesLeft,
              error: actualError.message,
            });

            // Respect retry-after header for rate limits
            if (actualError instanceof OpenRouterRateLimitError) {
              const rateLimitError = actualError as OpenRouterRateLimitError;
              if (rateLimitError.retryAfter) {
                // p-retry doesn't support dynamic delays, but we log it
                this.#logger.info("Rate limit retry-after", {
                  seconds: rateLimitError.retryAfter,
                });
              }
            }
          } else {
            // Don't retry other errors - abort immediately
            throw error;
          }
        },
      });
    } catch (error) {
      // If p-retry wraps the error, unwrap it
      if (error && typeof error === "object" && "error" in error) {
        throw error.error;
      }
      throw error;
    }
  }
}
