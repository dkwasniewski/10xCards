/**
 * OpenRouter Service Types
 *
 * Type definitions for the OpenRouter API integration.
 * These types provide type-safe interfaces for chat completions,
 * message construction, and response handling.
 */

/**
 * Message role types supported by OpenRouter API
 */
export type MessageRole = "system" | "user" | "assistant" | "tool";

/**
 * Individual message in a chat conversation
 */
export interface OpenRouterMessage {
  role: MessageRole;
  content: string;
  name?: string; // For tool messages
}

/**
 * Response format configuration for structured outputs
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
      [key: string]: unknown;
    };
  };
}

/**
 * Options for chat completion requests
 */
export interface ChatOptions {
  /** Ordered list of messages (system, user, assistant, etc.) */
  messages: OpenRouterMessage[];
  /** Model identifier (e.g. "gpt-4-turbo") */
  model: string;
  /** Temperature for response randomness (0-2, default 0.7) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Response format configuration (e.g. JSON schema) */
  responseFormat?: ResponseFormat;
  /** Arbitrary metadata forwarded as x-metadata header */
  metadata?: Record<string, unknown>;
  /** Signal for request cancellation */
  abortSignal?: AbortSignal;
}

/**
 * Token usage statistics from API response
 */
export interface TokenUsage {
  prompt: number;
  completion: number;
}

/**
 * Individual choice in chat completion response
 */
export interface ChatChoice {
  message: OpenRouterMessage;
  finish_reason?: string;
  index?: number;
}

/**
 * Successful chat completion response
 */
export interface ChatSuccess {
  /** Unique identifier for the completion */
  id: string;
  /** Creation timestamp (epoch ms) */
  created: number;
  /** Model used for completion */
  model: string;
  /** Token usage statistics */
  usage: TokenUsage;
  /** Array of completion choices */
  choices: ChatChoice[];
}

/**
 * Streaming chat chunk for incremental responses
 */
export interface ChatChunk {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    delta: {
      role?: MessageRole;
      content?: string;
    };
    index: number;
    finish_reason?: string;
  }>;
}

/**
 * Model metadata from model list endpoint
 */
export interface ModelMeta {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

/**
 * Context for building messages
 */
export interface MessageContext {
  system?: string;
  user: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in ms before first retry */
  initialDelay: number;
  /** Maximum delay in ms between retries */
  maxDelay: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
}

/**
 * Logger interface compatible with pino/winston
 */
export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Constructor options for OpenRouterService
 */
export interface OpenRouterServiceOptions {
  /** OpenRouter API key */
  apiKey: string;
  /** Base URL for OpenRouter API (defaults to https://openrouter.ai/api/v1) */
  baseURL?: string;
  /** Logger instance (optional) */
  logger?: Logger;
  /** Custom fetch implementation for SSR/Edge runtimes or tests */
  fetchImpl?: typeof fetch;
  /** Retry configuration */
  retryConfig?: RetryConfig;
}

/**
 * Base error class for all OpenRouter errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public status?: number,
    public raw?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Error for 400 Bad Request responses
 */
export class OpenRouterBadRequestError extends OpenRouterError {
  constructor(message: string, raw?: unknown) {
    super(message, 400, raw);
    this.name = "OpenRouterBadRequestError";
  }
}

/**
 * Error for 401 Unauthorized responses
 */
export class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string, raw?: unknown) {
    super(message, 401, raw);
    this.name = "OpenRouterAuthError";
  }
}

/**
 * Error for 429 Too Many Requests responses
 */
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message: string,
    public retryAfter?: number,
    raw?: unknown
  ) {
    super(message, 429, raw);
    this.name = "OpenRouterRateLimitError";
  }
}

/**
 * Error for 5xx server errors
 */
export class OpenRouterServerError extends OpenRouterError {
  constructor(message: string, status: number, raw?: unknown) {
    super(message, status, raw);
    this.name = "OpenRouterServerError";
  }
}

/**
 * Error for network-related failures
 */
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string, raw?: unknown) {
    super(message, undefined, raw);
    this.name = "OpenRouterNetworkError";
  }
}

/**
 * Error for JSON schema validation failures
 */
export class OpenRouterSchemaError extends OpenRouterError {
  constructor(
    message: string,
    public validationErrors?: unknown,
    raw?: unknown
  ) {
    super(message, undefined, raw);
    this.name = "OpenRouterSchemaError";
  }
}
