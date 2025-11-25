# OpenRouter Service Integration Example

## Overview

This document demonstrates how to integrate the `OpenRouterService` into Astro API endpoints for the 10xCards application. It shows the complete integration with the existing codebase, including error handling, logging, and database operations.

## Complete Integration Example

### Example: AI Sessions Endpoint with Real AI Generation

This example shows how to replace the mock flashcard generation with real AI generation using the `OpenRouterService`.

**File**: `src/pages/api/ai-sessions.ts`

```typescript
import type { APIRoute } from "astro";
import type { CreateGenerationSessionCommand, GenerationSessionResponseDto } from "../../types";
import { z } from "zod";
import { DEFAULT_MODEL, ALLOWED_MODELS, generateFlashcards } from "../../lib/services/ai.service";
import {
  createGenerationSession,
  storeCandidates,
  updateGenerationDuration,
  hashInputText,
} from "../../lib/services/ai-sessions.service";
import { logEvent } from "../../lib/services/event-log.service";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { handleApiError, ErrorMessages } from "../../lib/utils/api-error";

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
  const userId = DEFAULT_USER_ID;

  // 1. Parse and Validate Input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return await handleApiError(
      400,
      ErrorMessages.INVALID_JSON,
      { message: "Request body must be valid JSON." },
      supabase,
      "ai-sessions",
      userId
    );
  }

  const parseResult = createGenerationSessionSchema.safeParse(body);
  if (!parseResult.success) {
    return await handleApiError(
      400,
      ErrorMessages.VALIDATION_ERROR,
      { details: parseResult.error.errors },
      supabase,
      "ai-sessions",
      userId
    );
  }

  const { input_text, model = DEFAULT_MODEL } = parseResult.data as CreateGenerationSessionCommand;

  // 2. Hash input text for duplicate detection
  const inputTextHash = hashInputText(input_text);

  // 3. Create Generation Session Record
  let sessionId: string;
  try {
    const session = await createGenerationSession(supabase, {
      userId,
      inputText: input_text,
      model,
    });
    sessionId = session.sessionId;
  } catch (error) {
    return await handleApiError(
      500,
      ErrorMessages.INTERNAL_SERVER_ERROR,
      { message: "Failed to create generation session. Please try again." },
      supabase,
      "ai-sessions",
      userId
    );
  }

  // 4. Generate Flashcard Candidates using OpenRouter AI
  let candidates;
  let duration;
  try {
    const result = await generateFlashcards(input_text, model);
    candidates = result.candidates;
    duration = result.duration;
  } catch (error) {
    // Log failure event
    await logEvent(supabase, {
      userId,
      eventType: "generation_session_failed",
      eventSource: "ai",
      aiSessionId: sessionId,
    });

    // Determine error type and message
    const errorMessage = error instanceof Error ? error.message : "Generation service encountered an error.";

    return await handleApiError(
      500,
      "Failed to generate flashcards",
      {
        message: errorMessage,
        sessionId, // Include session ID so client can retry
      },
      supabase,
      "ai-sessions",
      userId
    );
  }

  // 5. Store Candidates as Flashcards
  try {
    await storeCandidates(supabase, sessionId, userId, model, candidates);
    await updateGenerationDuration(supabase, sessionId, duration);
  } catch (error) {
    return await handleApiError(
      500,
      ErrorMessages.INTERNAL_SERVER_ERROR,
      { message: "Failed to save generated flashcards. Please try again." },
      supabase,
      "ai-sessions",
      userId
    );
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
```

## Key Integration Points

### 1. Service Initialization

The `OpenRouterService` is initialized within the `generateFlashcards` function in `ai.service.ts`:

```typescript
// src/lib/services/ai.service.ts
const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});
```

**Benefits:**

- Centralized configuration
- Automatic retry logic
- Consistent error handling
- Built-in logging

### 2. Error Handling Integration

The service integrates with the existing error handling utilities:

```typescript
import { handleApiError, ErrorMessages } from "../../lib/utils/api-error";

// In catch blocks:
catch (error) {
  return await handleApiError(
    500,
    "Failed to generate flashcards",
    {
      message: error instanceof Error ? error.message : "Unknown error",
      sessionId,
    },
    supabase,
    "ai-sessions",
    userId
  );
}
```

**Benefits:**

- Consistent error responses
- Automatic error logging to Supabase
- User-friendly error messages
- Debugging information preserved

### 3. Event Logging Integration

Success and failure events are logged for analytics:

```typescript
// Success
await logEvent(supabase, {
  userId,
  eventType: "generation_session_created",
  eventSource: "ai",
  aiSessionId: sessionId,
});

// Failure
await logEvent(supabase, {
  userId,
  eventType: "generation_session_failed",
  eventSource: "ai",
  aiSessionId: sessionId,
});
```

**Benefits:**

- Track AI generation success/failure rates
- Monitor performance metrics
- Debug production issues
- Analyze user behavior

### 4. Response Format Integration

The service uses structured JSON schema responses that map directly to database types:

```typescript
const FLASHCARD_RESPONSE_FORMAT: ResponseFormat = {
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
```

**Benefits:**

- Type-safe responses
- Automatic validation
- Consistent data structure
- Reduced parsing errors

## Environment Configuration

### Required Environment Variables

Add to `.env`:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=sk-or-v1-...
```

### Optional Configuration

```bash
# Custom base URL (defaults to https://openrouter.ai/api/v1)
OPENROUTER_API_URL=https://openrouter.ai/api/v1

# Site URL for OpenRouter analytics
SITE_URL=https://10xcards.app
```

## Migration from Mock to Real AI

### Step 1: Update Environment Variables

```bash
# Add to .env
OPENROUTER_API_KEY=your-actual-key
```

### Step 2: Update API Endpoint

Replace the mock generation:

```typescript
// OLD (Mock)
candidates = generateMockCandidates(input_text);

// NEW (Real AI)
const result = await generateFlashcards(input_text, model);
candidates = result.candidates;
duration = result.duration;
```

### Step 3: Test the Integration

```bash
# Test with curl
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "TypeScript is a strongly typed programming language that builds on JavaScript. It adds optional static typing to JavaScript, which can help catch errors early in development. TypeScript code compiles to plain JavaScript, which runs anywhere JavaScript runs: in a browser, on Node.js, or in any other JavaScript runtime. The language was developed and is maintained by Microsoft. TypeScript supports multiple programming paradigms including object-oriented, imperative, and functional programming. One of the key benefits of TypeScript is its ability to provide better IDE support with features like code completion, refactoring, and navigation. TypeScript uses a structural type system, which means that two types are considered compatible if their members are compatible. This is different from nominal typing used in languages like Java or C#. TypeScript also supports advanced features like generics, decorators, and async/await syntax. The TypeScript compiler can be configured using a tsconfig.json file, which allows developers to specify compiler options, include/exclude patterns, and other project settings. TypeScript has gained significant adoption in the web development community and is used by many popular frameworks and libraries including Angular, Vue 3, and React (with TypeScript support).",
    "model": "openai/gpt-3.5-turbo"
  }'
```

### Step 4: Monitor and Adjust

Check the logs for:

- Generation success rate
- Average duration
- Error patterns
- Token usage

## Error Handling Patterns

### Pattern 1: Validation Errors (400)

```typescript
if (!parseResult.success) {
  return await handleApiError(
    400,
    ErrorMessages.VALIDATION_ERROR,
    { details: parseResult.error.errors },
    supabase,
    "ai-sessions",
    userId
  );
}
```

### Pattern 2: AI Generation Errors (500)

```typescript
try {
  const result = await generateFlashcards(input_text, model);
  // ...
} catch (error) {
  await logEvent(supabase, {
    userId,
    eventType: "generation_session_failed",
    eventSource: "ai",
    aiSessionId: sessionId,
  });

  return await handleApiError(
    500,
    "Failed to generate flashcards",
    {
      message: error instanceof Error ? error.message : "Unknown error",
      sessionId,
    },
    supabase,
    "ai-sessions",
    userId
  );
}
```

### Pattern 3: Database Errors (500)

```typescript
try {
  await storeCandidates(supabase, sessionId, userId, model, candidates);
  await updateGenerationDuration(supabase, sessionId, duration);
} catch (error) {
  return await handleApiError(
    500,
    ErrorMessages.INTERNAL_SERVER_ERROR,
    { message: "Failed to save generated flashcards." },
    supabase,
    "ai-sessions",
    userId
  );
}
```

## Performance Optimization

### 1. Caching Model List

```typescript
// Models are cached for 5 minutes automatically
const models = await openRouterService.modelList();
```

### 2. Request Timeout

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000); // 30 second timeout

const result = await generateFlashcards(input_text, model, controller.signal);
```

### 3. Token Limits

```typescript
// Limit tokens to control costs
const response = await openRouterService.chat({
  model,
  messages,
  maxTokens: 2000, // Adjust based on needs
});
```

### 4. Batch Processing

For multiple generations, consider queuing:

```typescript
// Use a job queue for high-volume scenarios
// Example: Bull, BullMQ, or Inngest
```

## Monitoring and Analytics

### Key Metrics to Track

1. **Generation Success Rate**
   - Track `generation_session_created` vs `generation_session_failed` events

2. **Average Duration**
   - Store in `generation_duration` field
   - Monitor trends over time

3. **Token Usage**
   - Log from `response.usage`
   - Calculate costs

4. **Error Patterns**
   - Group errors by type
   - Identify common failure modes

### Example Analytics Query

```sql
-- Success rate last 24 hours
SELECT
  COUNT(*) FILTER (WHERE event_type = 'generation_session_created') as successes,
  COUNT(*) FILTER (WHERE event_type = 'generation_session_failed') as failures,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE event_type = 'generation_session_created') /
    NULLIF(COUNT(*), 0),
    2
  ) as success_rate_percent
FROM event_logs
WHERE
  event_source = 'ai'
  AND created_at > NOW() - INTERVAL '24 hours';
```

## Security Considerations

1. **API Key Protection**
   - Never expose in client code
   - Use server-side only
   - Rotate regularly

2. **Rate Limiting**
   - Implement at API route level
   - Consider user quotas

3. **Input Validation**
   - Validate text length
   - Sanitize input
   - Check model allowlist

4. **Cost Control**
   - Set token limits
   - Monitor usage
   - Implement user quotas

## Troubleshooting

### Issue: "OPENROUTER_API_KEY environment variable is not set"

**Solution**: Add the API key to your `.env` file:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

### Issue: Rate limit errors (429)

**Solution**: The service automatically retries. For high volume:

- Implement request queuing
- Add delays between requests
- Consider upgrading OpenRouter plan

### Issue: Slow generation times

**Solution**:

- Use faster models (gpt-3.5-turbo instead of gpt-4)
- Reduce maxTokens
- Implement caching for similar inputs

### Issue: Invalid flashcard format

**Solution**:

- The JSON schema ensures correct format
- Check validation in `ai.service.ts`
- Review prompt in `FLASHCARD_SYSTEM_PROMPT`

## Next Steps

1. **Add Streaming Support**: Implement real-time flashcard generation with SSE
2. **Implement Caching**: Cache results for duplicate input text
3. **Add User Quotas**: Limit generations per user/day
4. **Optimize Prompts**: A/B test different prompts for better results
5. **Add Model Selection UI**: Let users choose their preferred model
6. **Implement Feedback Loop**: Use user edits to improve prompts

## Additional Resources

- [OpenRouter Service Documentation](./openrouter-service.md)
- [OpenRouter Service Testing Guide](./openrouter-service-testing.md)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
