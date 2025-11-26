# OpenRouter Integration Complete

## Summary

Successfully integrated the OpenRouter service with the AI sessions service to replace mock flashcard generation with real AI-powered generation using OpenRouter's API.

## Changes Made

### 1. Updated `src/lib/services/ai-sessions.service.ts`

**Added:**

- Import of `generateFlashcards` from `ai.service.ts`
- New `generateCandidates()` function that wraps the AI service
- Deprecated the `generateMockCandidates()` function (kept for backward compatibility)

**New Function:**

```typescript
export async function generateCandidates(
  inputText: string,
  model: string
): Promise<{ candidates: CandidateCreateDto[]; duration: number }> {
  return await generateFlashcards(inputText, model);
}
```

**Improvements:**

- Added proper validation for edit actions to avoid non-null assertions
- Fixed linting issues (array type syntax, formatting)

### 2. Updated `src/pages/api/ai-sessions.ts`

**Changed:**

- Replaced `generateMockCandidates` import with `generateCandidates`
- Updated the generation logic to use the real AI service
- Enhanced error handling to provide more specific error messages
- Updated documentation comments

**Before:**

```typescript
const startTime = Date.now();
candidates = generateMockCandidates(input_text);
duration = Date.now() - startTime;
```

**After:**

```typescript
const result = await generateCandidates(input_text, model);
candidates = result.candidates;
duration = result.duration;
```

### 3. Updated `README.md`

**Fixed:**

- Corrected environment variable name from `SUPABASE_ANON_KEY` to `SUPABASE_KEY`
- Added optional environment variables (`OPENROUTER_API_URL`, `SITE_URL`)
- Added comments to clarify optional vs required variables

## Architecture Overview

### Flow Diagram

```
User Request
    ↓
POST /api/ai-sessions
    ↓
ai-sessions.service.ts::generateCandidates()
    ↓
ai.service.ts::generateFlashcards()
    ↓
openrouter.service.ts::chat()
    ↓
OpenRouter API (LLM)
    ↓
Parse & Validate Response
    ↓
Store Candidates in Database
    ↓
Return to User
```

### Service Responsibilities

1. **`openrouter.service.ts`** (Low-level HTTP client)
   - Handles HTTP communication with OpenRouter API
   - Manages authentication, headers, retry logic
   - Provides streaming and non-streaming chat methods
   - Error handling and rate limiting

2. **`ai.service.ts`** (Flashcard-specific logic)
   - Constructs flashcard generation prompts
   - Defines JSON schema for structured responses
   - Validates and parses AI responses
   - Returns typed flashcard candidates

3. **`ai-sessions.service.ts`** (Database operations)
   - Creates generation sessions
   - Stores candidates in database
   - Manages candidate actions (accept/edit/reject)
   - Orchestrates the generation flow

4. **`/api/ai-sessions.ts`** (API endpoint)
   - Validates user input
   - Coordinates service calls
   - Handles errors and logging
   - Returns HTTP responses

## Environment Variables Required

```env
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional (with defaults)
OPENROUTER_API_URL=https://openrouter.ai/api/v1
SITE_URL=http://localhost:3000
```

## Supported AI Models

The following models are currently allowed (configured in `ai.service.ts`):

- `openai/gpt-4`
- `openai/gpt-3.5-turbo` (default)
- `anthropic/claude-3-sonnet`
- `anthropic/claude-3-haiku`

## Error Handling

The integration includes comprehensive error handling:

1. **Validation Errors** (400)
   - Invalid input text length (must be 1000-10000 chars)
   - Invalid model selection
   - Missing required fields for edit actions

2. **AI Generation Errors** (500)
   - OpenRouter API failures (network, rate limits, server errors)
   - Invalid AI responses (malformed JSON, missing fields)
   - Authentication errors

3. **Database Errors** (500)
   - Session creation failures
   - Candidate storage failures
   - Session not found (404)

## Testing

To test the integration:

1. **Set up environment variables** in `.env` file
2. **Start the development server**: `npm run dev`
3. **Make a POST request** to `/api/ai-sessions`:

```bash
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Your text here (1000-10000 characters)...",
    "model": "openai/gpt-3.5-turbo"
  }'
```

4. **Expected response**:

```json
{
  "id": "session-uuid",
  "candidates": [
    {
      "front": "Question text",
      "back": "Answer text",
      "prompt": "What this flashcard tests"
    }
  ],
  "input_text_hash": "md5-hash"
}
```

## Performance Considerations

- **Generation Duration**: Tracked and stored in the database
- **Retry Logic**: Automatic retries for rate limits and server errors (max 3 retries)
- **Exponential Backoff**: 1s → 2s → 4s delays between retries
- **Model Caching**: Model list cached for 5 minutes
- **Structured Output**: JSON schema ensures consistent response format

## Next Steps

1. ✅ Integration complete and tested
2. Monitor API usage and costs
3. Consider adding more models based on performance/cost analysis
4. Implement user feedback on generated flashcards
5. Add analytics for generation quality metrics

## Backward Compatibility

The `generateMockCandidates()` function is still available but marked as deprecated. It can be used for:

- Testing without API calls
- Development without API keys
- Fallback in case of API issues

To use mock generation, simply call `generateMockCandidates(inputText)` directly instead of `generateCandidates(inputText, model)`.

