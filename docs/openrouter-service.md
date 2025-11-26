# OpenRouter Service Documentation

## Overview

The `OpenRouterService` is a type-safe, production-ready wrapper around the OpenRouter HTTP API. It provides robust error handling, automatic retries, logging, and a clean interface for AI chat completions.

## Features

- ✅ Type-safe TypeScript interfaces
- ✅ Automatic retry with exponential backoff
- ✅ Comprehensive error handling
- ✅ Streaming support (SSE)
- ✅ JSON schema response formatting
- ✅ Request/response logging
- ✅ Rate limit handling
- ✅ Model caching
- ✅ Abort signal support

## Installation

The service requires the following dependencies:

```bash
npm install zod p-retry
```

## Basic Usage

### 1. Initialize the Service

```typescript
import { OpenRouterService } from "@/lib/services/openrouter.service";

// In an Astro API endpoint
const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  // Optional: custom configuration
  baseURL: "https://openrouter.ai/api/v1",
  retryConfig: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
});
```

### 2. Simple Chat Completion

```typescript
const response = await openRouterService.chat({
  model: "openai/gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant.",
    },
    {
      role: "user",
      content: "What is TypeScript?",
    },
  ],
  temperature: 0.7,
});

console.log(response.choices[0].message.content);
```

### 3. Using Message Builder Helper

```typescript
const messages = openRouterService.buildMessages({
  system: "You are a flashcard generation assistant.",
  user: "Generate flashcards about TypeScript.",
  history: [
    { role: "user", content: "What is JavaScript?" },
    { role: "assistant", content: "JavaScript is..." },
  ],
});

const response = await openRouterService.chat({
  model: "openai/gpt-4",
  messages,
});
```

### 4. JSON Schema Response Format

```typescript
import type { ResponseFormat } from "@/lib/openrouter.types";

const responseFormat: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "GenerateFlashcardsResponse",
    strict: true,
    schema: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string" },
              back: { type: "string" },
              prompt: { type: "string" },
            },
            required: ["front", "back", "prompt"],
          },
        },
      },
      required: ["flashcards"],
    },
  },
};

const response = await openRouterService.chat({
  model: "openai/gpt-4",
  messages: [
    { role: "system", content: "Generate flashcards..." },
    { role: "user", content: inputText },
  ],
  responseFormat,
});

const data = JSON.parse(response.choices[0].message.content);
console.log(data.flashcards);
```

### 5. Streaming Responses

```typescript
const stream = openRouterService.stream({
  model: "openai/gpt-3.5-turbo",
  messages: [{ role: "user", content: "Tell me a story" }],
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

### 6. Request Cancellation

```typescript
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const response = await openRouterService.chat({
    model: "openai/gpt-3.5-turbo",
    messages: [{ role: "user", content: "Long task..." }],
    abortSignal: controller.signal,
  });
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Request was cancelled");
  }
}
```

### 7. List Available Models

```typescript
// Results are cached for 5 minutes
const models = await openRouterService.modelList();

console.log("Available models:");
models.forEach((model) => {
  console.log(`- ${model.id}: ${model.name}`);
  console.log(`  Context: ${model.context_length} tokens`);
  console.log(`  Pricing: $${model.pricing?.prompt}/prompt, $${model.pricing?.completion}/completion`);
});
```

## Integration with Astro API Routes

### Example: Flashcard Generation Endpoint

```typescript
// src/pages/api/generate-flashcards.ts
import type { APIRoute } from "astro";
import { OpenRouterService } from "@/lib/services/openrouter.service";
import { z } from "zod";

const requestSchema = z.object({
  inputText: z.string().min(100).max(10000),
  model: z.string().default("openai/gpt-3.5-turbo"),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request
    const body = await request.json();
    const { inputText, model } = requestSchema.parse(body);

    // Initialize service
    const openRouterService = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY,
    });

    // Build messages
    const messages = openRouterService.buildMessages({
      system: `You are a flashcard generation assistant. Generate 5-15 flashcards from the provided text.
Return a JSON object with this format:
{
  "flashcards": [
    { "front": "Question", "back": "Answer", "prompt": "What this tests" }
  ]
}`,
      user: `Generate flashcards from this text:\n\n${inputText}`,
    });

    // Define response format
    const responseFormat = {
      type: "json_schema" as const,
      json_schema: {
        name: "GenerateFlashcardsResponse",
        strict: true,
        schema: {
          type: "object",
          properties: {
            flashcards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  front: { type: "string" },
                  back: { type: "string" },
                  prompt: { type: "string" },
                },
                required: ["front", "back", "prompt"],
              },
            },
          },
          required: ["flashcards"],
        },
      },
    };

    // Generate flashcards
    const response = await openRouterService.chat({
      model,
      messages,
      temperature: 0.7,
      maxTokens: 2000,
      responseFormat,
    });

    // Parse response
    const data = JSON.parse(response.choices[0].message.content);

    return new Response(
      JSON.stringify({
        flashcards: data.flashcards,
        usage: response.usage,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle errors
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Validation error", details: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Flashcard generation error:", error);

    return new Response(JSON.stringify({ error: "Failed to generate flashcards" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const prerender = false;
```

## Error Handling

The service provides specific error classes for different scenarios:

### Error Types

```typescript
import {
  OpenRouterError,
  OpenRouterBadRequestError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterServerError,
  OpenRouterNetworkError,
} from "@/lib/openrouter.types";
```

### Handling Specific Errors

```typescript
try {
  const response = await openRouterService.chat({
    model: "openai/gpt-4",
    messages: [{ role: "user", content: "Hello" }],
  });
} catch (error) {
  if (error instanceof OpenRouterBadRequestError) {
    console.error("Invalid request:", error.message);
    // Handle validation errors
  } else if (error instanceof OpenRouterAuthError) {
    console.error("Authentication failed:", error.message);
    // Check API key
  } else if (error instanceof OpenRouterRateLimitError) {
    console.error("Rate limited:", error.message);
    console.log("Retry after:", error.retryAfter, "seconds");
    // Wait and retry
  } else if (error instanceof OpenRouterServerError) {
    console.error("Server error:", error.status, error.message);
    // Service automatically retries, but this is final failure
  } else if (error instanceof OpenRouterNetworkError) {
    console.error("Network error:", error.message);
    // Check connectivity
  } else {
    console.error("Unknown error:", error);
  }
}
```

## Advanced Configuration

### Custom Logger

```typescript
import type { Logger } from "@/lib/openrouter.types";

const customLogger: Logger = {
  info: (message, meta) => {
    console.log(`[INFO] ${message}`, meta);
  },
  warn: (message, meta) => {
    console.warn(`[WARN] ${message}`, meta);
  },
  error: (message, meta) => {
    console.error(`[ERROR] ${message}`, meta);
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  },
};

const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  logger: customLogger,
});
```

### Custom Fetch Implementation (for testing)

```typescript
const mockFetch = async (url: string, init: RequestInit) => {
  // Mock implementation
  return new Response(JSON.stringify({ mock: "data" }));
};

const service = new OpenRouterService({
  apiKey: "test-key",
  fetchImpl: mockFetch,
});
```

### Retry Configuration

```typescript
const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  retryConfig: {
    maxRetries: 5, // More retries for critical operations
    initialDelay: 500, // Start with shorter delay
    maxDelay: 30000, // Allow longer max delay
    backoffMultiplier: 3, // More aggressive backoff
  },
});
```

## Security Best Practices

1. **Never expose API key to client**: Always use the service in server-side code (Astro API routes, server endpoints)

2. **Use environment variables**: Store API key in `.env` file

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

3. **Implement rate limiting**: Add rate limiting at the API route level

4. **Validate model names**: Use an allow-list of approved models

```typescript
const ALLOWED_MODELS = ["openai/gpt-4", "openai/gpt-3.5-turbo", "anthropic/claude-3-sonnet"];

if (!ALLOWED_MODELS.includes(model)) {
  throw new Error("Model not allowed");
}
```

5. **Sanitize user input**: Always validate and sanitize input text

6. **Monitor usage**: Log token usage and costs

## Performance Tips

1. **Use model caching**: The `modelList()` method caches results for 5 minutes
2. **Set appropriate maxTokens**: Limit token generation to reduce costs
3. **Use streaming for long responses**: Better UX and allows early cancellation
4. **Implement request timeouts**: Use AbortSignal with timeout
5. **Choose appropriate models**: Use cheaper models (gpt-3.5-turbo) for simple tasks

## Troubleshooting

### Common Issues

**Issue**: "API key cannot be empty"

- **Solution**: Ensure `OPENROUTER_API_KEY` is set in environment variables

**Issue**: Rate limit errors (429)

- **Solution**: Service automatically retries. Consider implementing request queuing for high-volume scenarios

**Issue**: "Network request failed"

- **Solution**: Check internet connectivity and OpenRouter service status

**Issue**: JSON parsing errors

- **Solution**: Ensure `responseFormat` schema matches expected output. Consider adding validation

## TypeScript Types Reference

See `src/lib/openrouter.types.ts` for complete type definitions:

- `OpenRouterMessage` - Chat message structure
- `ChatOptions` - Request options
- `ChatSuccess` - Response structure
- `ResponseFormat` - JSON schema configuration
- `Logger` - Logger interface
- `RetryConfig` - Retry configuration
- Error classes for all error scenarios

## Support

For issues with the OpenRouter API itself, consult:

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter API Reference](https://openrouter.ai/docs/api-reference)

For issues with this service implementation, check the source code in:

- `src/lib/services/openrouter.service.ts`
- `src/lib/openrouter.types.ts`

