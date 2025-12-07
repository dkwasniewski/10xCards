# OpenRouter API Key Configuration Guide

## Summary

The **OpenRouter API key** is used to call AI models for generating flashcards from text. Here's where it's configured and used in your codebase.

---

## 🔑 Where the Key is Configured

### Environment Variable

The key must be set in your `.env` file:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

**Location**: Root directory of your project
**Variable name**: `OPENROUTER_API_KEY`
**Format**: Starts with `sk-or-v1-`

### Type Definition

The key is typed in `src/env.d.ts`:

```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;  // ← Here
  readonly PUBLIC_SITE_URL: string;
}
```

---

## 📍 Where the Key is Used

### 1. AI Service (Main Usage)

**File**: `src/lib/services/ai.service.ts`

```typescript
// Line 13: Import from environment
const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;

// Line 77-79: Validate it exists
if (!OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY environment variable is not set");
}

// Line 84-86: Pass to OpenRouter service
const openRouterService = new OpenRouterService({
  apiKey: OPENROUTER_API_KEY,
});
```

### 2. OpenRouter Service

**File**: `src/lib/services/openrouter.service.ts`

```typescript
// Line 112-114: Constructor receives the key
constructor(options: OpenRouterServiceOptions) {
  this.#apiKey = apiKeySchema.parse(options.apiKey);  // Validates key
  // ...
}
```

The service uses the key to authenticate all requests to OpenRouter API:
- Base URL: `https://openrouter.ai/api/v1` (hardcoded on line 117)
- Endpoint: `/chat/completions` for flashcard generation
- Endpoint: `/models` for listing available AI models

---

## 🔄 Call Flow

Here's how your code uses the OpenRouter API key:

```
User fills form → Click "Generate" button
    ↓
Frontend: GenerateReview.tsx (line 98)
    → calls generate({ input_text, model })
    ↓
API Endpoint: /api/ai-sessions (POST)
    → src/pages/api/ai-sessions.ts (line 114)
    ↓
AI Sessions Service: generateCandidates()
    → src/lib/services/ai-sessions.service.ts
    ↓
AI Service: generateFlashcards()
    → src/lib/services/ai.service.ts (line 70)
    ↓
    1. Reads OPENROUTER_API_KEY from env (line 13)
    2. Creates OpenRouterService instance (line 84-86)
    3. Builds chat messages (line 89-92)
    4. Calls openRouterService.chat() (line 96-106)
    ↓
OpenRouter Service: chat()
    → src/lib/services/openrouter.service.ts (line 141)
    ↓
    Makes HTTP POST to OpenRouter API:
    - URL: https://openrouter.ai/api/v1/chat/completions
    - Headers: Authorization: Bearer sk-or-v1-...
    - Body: { model, messages, temperature, etc. }
    ↓
OpenRouter AI → Returns flashcards as JSON
    ↓
Response flows back through the stack
    ↓
Frontend displays flashcard candidates
```

---

## 🎯 Supported AI Models

The following models can be used (configured in `ai.service.ts` line 15-21):

```typescript
export const ALLOWED_MODELS = [
  "openai/gpt-4o-mini",      // ← Default
  "openai/gpt-4",
  "openai/gpt-3.5-turbo",
  "anthropic/claude-3-sonnet",
  "anthropic/claude-3-haiku",
];
```

**Note**: All these models are accessed through OpenRouter's unified API using your single `OPENROUTER_API_KEY`.

---

## ⚙️ How OpenRouter Service Works

### Initialization (First Time)

```typescript
// ai.service.ts line 84-86
const openRouterService = new OpenRouterService({
  apiKey: OPENROUTER_API_KEY,  // From environment
});
```

### Making API Calls

```typescript
// ai.service.ts line 96-106
const response = await openRouterService.chat({
  model: "openai/gpt-4o-mini",  // Which AI model to use
  messages: [                    // Conversation messages
    { role: "system", content: FLASHCARD_SYSTEM_PROMPT },
    { role: "user", content: "Generate flashcards from this text: ..." }
  ],
  temperature: 0.7,              // Creativity (0-2)
  maxTokens: 2000,               // Max response length
  responseFormat: { type: "json_object" },  // Get JSON response
});
```

### Error Handling

The service includes robust error handling:
- **400** → `OpenRouterBadRequestError` (invalid request)
- **401/403** → `OpenRouterAuthError` (invalid API key)
- **429** → `OpenRouterRateLimitError` (rate limit exceeded, auto-retry)
- **5xx** → `OpenRouterServerError` (server error, auto-retry)
- **Network** → `OpenRouterNetworkError` (connection failed)

---

## 📝 Configuration Files

### Development (.env)

```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Public Site URL
PUBLIC_SITE_URL=http://localhost:4321
```

### Testing (.env.test)

For e2e tests, you need the same key in `.env.test`:

```bash
# Supabase Configuration (Test Database)
SUPABASE_URL=your-test-supabase-url
SUPABASE_KEY=your-test-supabase-key

# OpenRouter API (Same key as dev)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Public Site URL
PUBLIC_SITE_URL=http://localhost:4321
```

---

## 🔍 Finding Your API Key

1. **Check your `.env` file** in the project root:
   ```bash
   cat .env | grep OPENROUTER_API_KEY
   ```

2. **Get a new key from OpenRouter**:
   - Go to: https://openrouter.ai/
   - Sign up / Log in
   - Navigate to "API Keys"
   - Create a new key
   - Copy the key (starts with `sk-or-v1-`)

---

## ⚠️ Common Issues

### 1. "OPENROUTER_API_KEY environment variable is not set"

**Cause**: The `.env` file is missing the key or not loaded  
**Fix**:
```bash
# Add to .env file
echo "OPENROUTER_API_KEY=sk-or-v1-your-key" >> .env
```

### 2. "401 Unauthorized" from OpenRouter

**Cause**: Invalid or expired API key  
**Fix**:
- Check if the key is correct (no extra spaces)
- Verify the key hasn't been revoked
- Generate a new key from OpenRouter dashboard

### 3. "429 Rate Limit Exceeded"

**Cause**: Too many requests or insufficient credits  
**Fix**:
- Check your OpenRouter account credits
- Wait for rate limit to reset
- Consider upgrading your OpenRouter plan

---

## 🧪 Testing the API Key

You can test if your API key works by running the generation tests:

```bash
# Run e2e tests (includes generation)
npm run test:e2e

# Or manually test with curl:
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer sk-or-v1-your-key-here" \
  -H "Content-Type: application/json"
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `src/lib/services/ai.service.ts` | Main AI service, imports and validates the key |
| `src/lib/services/openrouter.service.ts` | HTTP client for OpenRouter API |
| `src/pages/api/ai-sessions.ts` | API endpoint that triggers generation |
| `src/env.d.ts` | TypeScript types for environment variables |
| `.env` | Development environment variables |
| `.env.test` | Test environment variables |

---

## 🎓 Key Takeaways

1. **One key for all models**: OpenRouter provides access to multiple AI providers (OpenAI, Anthropic, etc.) through a single API key
2. **Server-side only**: The key is never exposed to the frontend (used in API endpoints only)
3. **Required for flashcard generation**: Without it, the AI generation feature won't work
4. **Configurable models**: You can switch between different AI models without changing keys
5. **Robust error handling**: The service includes automatic retries and detailed error messages

---

## 🔐 Security Notes

- ✅ The API key is stored in `.env` (git-ignored)
- ✅ Never committed to version control
- ✅ Used server-side only (Astro API routes)
- ✅ Validated before use
- ✅ Not exposed to frontend/browser
- ⚠️ Don't share your API key
- ⚠️ Don't log the full key (mask it in logs)

