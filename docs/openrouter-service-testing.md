# OpenRouter Service Testing Guide

## Overview

This guide provides comprehensive testing strategies for the `OpenRouterService`. Since the project doesn't have a test framework configured yet, this document includes both manual testing approaches and test framework setup instructions.

## Manual Testing

### 1. Basic Chat Completion Test

Create a test script at `scripts/test-openrouter.ts`:

```typescript
import { OpenRouterService } from "../src/lib/services/openrouter.service";

async function testBasicChat() {
  console.log("Testing basic chat completion...");

  const service = new OpenRouterService({
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });

  try {
    const response = await service.chat({
      model: "openai/gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello in one word." },
      ],
      temperature: 0.7,
      maxTokens: 10,
    });

    console.log("✓ Success!");
    console.log("Response:", response.choices[0].message.content);
    console.log("Usage:", response.usage);
  } catch (error) {
    console.error("✗ Failed:", error);
  }
}

testBasicChat();
```

Run with:

```bash
OPENROUTER_API_KEY=your-key npx tsx scripts/test-openrouter.ts
```

### 2. JSON Schema Response Test

```typescript
import { OpenRouterService } from "../src/lib/services/openrouter.service";
import type { ResponseFormat } from "../src/lib/openrouter.types";

async function testJsonSchema() {
  console.log("Testing JSON schema response...");

  const service = new OpenRouterService({
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });

  const responseFormat: ResponseFormat = {
    type: "json_schema",
    json_schema: {
      name: "ColorResponse",
      strict: true,
      schema: {
        type: "object",
        properties: {
          color: { type: "string" },
          hex: { type: "string" },
        },
        required: ["color", "hex"],
      },
    },
  };

  try {
    const response = await service.chat({
      model: "openai/gpt-4",
      messages: [
        {
          role: "user",
          content: "Give me a random color with its hex code in JSON format.",
        },
      ],
      responseFormat,
    });

    const data = JSON.parse(response.choices[0].message.content);
    console.log("✓ Success!");
    console.log("Parsed data:", data);
    console.log("Has color:", "color" in data);
    console.log("Has hex:", "hex" in data);
  } catch (error) {
    console.error("✗ Failed:", error);
  }
}

testJsonSchema();
```

### 3. Error Handling Test

```typescript
import { OpenRouterService } from "../src/lib/services/openrouter.service";
import { OpenRouterBadRequestError, OpenRouterAuthError, OpenRouterRateLimitError } from "../src/lib/openrouter.types";

async function testErrorHandling() {
  console.log("Testing error handling...");

  // Test 1: Invalid API key
  console.log("\n1. Testing invalid API key...");
  const invalidService = new OpenRouterService({
    apiKey: "invalid-key",
  });

  try {
    await invalidService.chat({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello" }],
    });
    console.log("✗ Should have thrown error");
  } catch (error) {
    if (error instanceof OpenRouterAuthError) {
      console.log("✓ Correctly caught OpenRouterAuthError");
    } else {
      console.log("✗ Wrong error type:", error);
    }
  }

  // Test 2: Invalid model
  console.log("\n2. Testing invalid model...");
  const service = new OpenRouterService({
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });

  try {
    await service.chat({
      model: "invalid/model-name",
      messages: [{ role: "user", content: "Hello" }],
    });
    console.log("✗ Should have thrown error");
  } catch (error) {
    if (error instanceof OpenRouterBadRequestError) {
      console.log("✓ Correctly caught OpenRouterBadRequestError");
    } else {
      console.log("Caught error (may vary):", error.constructor.name);
    }
  }

  // Test 3: Empty messages
  console.log("\n3. Testing empty messages...");
  try {
    await service.chat({
      model: "openai/gpt-3.5-turbo",
      messages: [],
    });
    console.log("✗ Should have thrown validation error");
  } catch (error) {
    console.log("✓ Correctly caught validation error");
  }
}

testErrorHandling();
```

### 4. Streaming Test

```typescript
import { OpenRouterService } from "../src/lib/services/openrouter.service";

async function testStreaming() {
  console.log("Testing streaming...");

  const service = new OpenRouterService({
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });

  try {
    const stream = service.stream({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: "Count from 1 to 5, one number per line." }],
      maxTokens: 50,
    });

    console.log("Stream started:");
    let chunkCount = 0;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        process.stdout.write(content);
        chunkCount++;
      }
    }

    console.log(`\n✓ Success! Received ${chunkCount} chunks`);
  } catch (error) {
    console.error("✗ Failed:", error);
  }
}

testStreaming();
```

### 5. Retry Logic Test

```typescript
import { OpenRouterService } from "../src/lib/services/openrouter.service";

async function testRetryLogic() {
  console.log("Testing retry logic with custom config...");

  const service = new OpenRouterService({
    apiKey: process.env.OPENROUTER_API_KEY || "",
    retryConfig: {
      maxRetries: 2,
      initialDelay: 500,
      maxDelay: 2000,
      backoffMultiplier: 2,
    },
  });

  // This test requires triggering a 5xx error or rate limit
  // In practice, this is hard to test without mocking
  console.log("Retry logic is configured and will activate on 429/5xx errors");
  console.log("✓ Configuration accepted");
}

testRetryLogic();
```

### 6. Message Builder Test

```typescript
import { OpenRouterService } from "../src/lib/services/openrouter.service";

async function testMessageBuilder() {
  console.log("Testing message builder...");

  const service = new OpenRouterService({
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });

  const messages = service.buildMessages({
    system: "You are a helpful assistant.",
    user: "What is 2+2?",
    history: [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi! How can I help?" },
    ],
  });

  console.log("Built messages:");
  messages.forEach((msg, i) => {
    console.log(`  ${i + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
  });

  if (messages.length === 4) {
    console.log("✓ Correct number of messages");
  } else {
    console.log("✗ Wrong number of messages:", messages.length);
  }

  if (messages[0].role === "system") {
    console.log("✓ System message first");
  } else {
    console.log("✗ System message not first");
  }

  if (messages[messages.length - 1].role === "user") {
    console.log("✓ User message last");
  } else {
    console.log("✗ User message not last");
  }
}

testMessageBuilder();
```

### 7. Model List Test

```typescript
import { OpenRouterService } from "../src/lib/services/openrouter.service";

async function testModelList() {
  console.log("Testing model list...");

  const service = new OpenRouterService({
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });

  try {
    const models = await service.modelList();

    console.log(`✓ Success! Found ${models.length} models`);
    console.log("\nSample models:");
    models.slice(0, 5).forEach((model) => {
      console.log(`  - ${model.id}`);
      if (model.context_length) {
        console.log(`    Context: ${model.context_length} tokens`);
      }
    });

    // Test caching
    console.log("\nTesting cache...");
    const start = Date.now();
    await service.modelList();
    const duration = Date.now() - start;

    if (duration < 100) {
      console.log("✓ Cache working (response < 100ms)");
    } else {
      console.log("? Cache may not be working (response:", duration, "ms)");
    }
  } catch (error) {
    console.error("✗ Failed:", error);
  }
}

testModelList();
```

### 8. Abort Signal Test

```typescript
import { OpenRouterService } from "../src/lib/services/openrouter.service";

async function testAbortSignal() {
  console.log("Testing abort signal...");

  const service = new OpenRouterService({
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });

  const controller = new AbortController();

  // Abort after 100ms
  setTimeout(() => {
    console.log("Aborting request...");
    controller.abort();
  }, 100);

  try {
    await service.chat({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Write a very long story about a dragon...",
        },
      ],
      maxTokens: 1000,
      abortSignal: controller.signal,
    });
    console.log("✗ Request should have been aborted");
  } catch (error) {
    if (error.name === "AbortError" || error.message.includes("abort")) {
      console.log("✓ Request correctly aborted");
    } else {
      console.log("✗ Wrong error type:", error);
    }
  }
}

testAbortSignal();
```

## Integration Testing with Flashcard Generation

Test the service with the actual flashcard generation use case:

```typescript
import { generateFlashcards } from "../src/lib/services/ai.service";

async function testFlashcardGeneration() {
  console.log("Testing flashcard generation integration...");

  const inputText = `
    TypeScript is a strongly typed programming language that builds on JavaScript.
    It adds optional static typing to JavaScript, which can help catch errors early
    in development. TypeScript code compiles to plain JavaScript, which runs anywhere
    JavaScript runs: in a browser, on Node.js, or in any other JavaScript runtime.
  `;

  try {
    const result = await generateFlashcards(inputText, "openai/gpt-3.5-turbo");

    console.log("✓ Success!");
    console.log(`Generated ${result.candidates.length} flashcards`);
    console.log(`Duration: ${result.duration}ms`);

    console.log("\nSample flashcard:");
    const sample = result.candidates[0];
    console.log(`Front: ${sample.front}`);
    console.log(`Back: ${sample.back}`);
    console.log(`Prompt: ${sample.prompt}`);

    // Validate structure
    const allValid = result.candidates.every(
      (c) =>
        typeof c.front === "string" &&
        typeof c.back === "string" &&
        typeof c.prompt === "string" &&
        c.front.length > 0 &&
        c.back.length > 0
    );

    if (allValid) {
      console.log("\n✓ All flashcards have valid structure");
    } else {
      console.log("\n✗ Some flashcards have invalid structure");
    }
  } catch (error) {
    console.error("✗ Failed:", error);
  }
}

testFlashcardGeneration();
```

## Setting Up a Test Framework (Optional)

If you want to add proper unit tests with a framework like Vitest:

### 1. Install Vitest

```bash
npm install -D vitest @vitest/ui
```

### 2. Add Test Script to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### 3. Create vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

### 4. Example Unit Test

Create `src/lib/services/__tests__/openrouter.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenRouterService } from "../openrouter.service";
import { OpenRouterAuthError, OpenRouterBadRequestError } from "../../openrouter.types";

describe("OpenRouterService", () => {
  describe("constructor", () => {
    it("should create instance with valid API key", () => {
      const service = new OpenRouterService({
        apiKey: "test-key",
      });
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it("should throw error with empty API key", () => {
      expect(() => {
        new OpenRouterService({ apiKey: "" });
      }).toThrow();
    });
  });

  describe("buildMessages", () => {
    it("should build messages with system and user", () => {
      const service = new OpenRouterService({ apiKey: "test-key" });
      const messages = service.buildMessages({
        system: "System prompt",
        user: "User message",
      });

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("system");
      expect(messages[1].role).toBe("user");
    });

    it("should include history messages", () => {
      const service = new OpenRouterService({ apiKey: "test-key" });
      const messages = service.buildMessages({
        system: "System",
        user: "User",
        history: [
          { role: "user", content: "Previous user" },
          { role: "assistant", content: "Previous assistant" },
        ],
      });

      expect(messages).toHaveLength(4);
      expect(messages[1].content).toBe("Previous user");
      expect(messages[2].content).toBe("Previous assistant");
    });
  });

  describe("chat", () => {
    it("should make successful chat request", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "test-id",
          created: Date.now(),
          model: "test-model",
          usage: { prompt: 10, completion: 20 },
          choices: [
            {
              message: {
                role: "assistant",
                content: "Test response",
              },
            },
          ],
        }),
      });

      const service = new OpenRouterService({
        apiKey: "test-key",
        fetchImpl: mockFetch as any,
      });

      const response = await service.chat({
        model: "test-model",
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(response.choices[0].message.content).toBe("Test response");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should handle 401 auth error", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      const service = new OpenRouterService({
        apiKey: "invalid-key",
        fetchImpl: mockFetch as any,
      });

      await expect(
        service.chat({
          model: "test-model",
          messages: [{ role: "user", content: "Hello" }],
        })
      ).rejects.toThrow(OpenRouterAuthError);
    });
  });
});
```

## Running Tests

### Manual Tests

```bash
# Run individual test scripts
OPENROUTER_API_KEY=your-key npx tsx scripts/test-openrouter.ts
```

### With Vitest (if configured)

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run specific test file
npm test openrouter.service.test.ts
```

## Best Practices

1. **Never commit API keys**: Use environment variables
2. **Mock external calls**: Use mock fetch for unit tests
3. **Test error paths**: Ensure all error types are covered
4. **Test edge cases**: Empty messages, invalid models, etc.
5. **Integration tests**: Test with real API in CI/CD (use secrets)
6. **Monitor costs**: Be mindful of API costs during testing

## Troubleshooting

- **"API key cannot be empty"**: Set OPENROUTER_API_KEY environment variable
- **Network errors**: Check internet connection and OpenRouter status
- **Rate limits**: Add delays between tests or use mock fetch
- **TypeScript errors**: Ensure all types are imported correctly

