# OpenRouter Service – Implementation Plan

## 1. Service Description

`OpenRouterService` is a thin, type-safe wrapper around the OpenRouter HTTP API that standardises:

1. Message construction (system, user, assistant)
2. Model and parameter configuration
3. Response-format (e.g. JSON schema) handling
4. Robust error handling & retry logic
5. Security (API-Key isolation, rate-limit protection)
6. Telemetry hooks (event logging, tracing)

The service lives in `src/lib/services/openrouter.service.ts` and **MUST** expose a minimal public API that higher-level hooks/components can consume without needing to know OpenRouter specifics.

---

## 2. Constructor Description

```ts
constructor(options: {
  apiKey: string;                 // Supabase KV or env("OPENROUTER_API_KEY")
  baseURL?: string;               // Defaults to "https://openrouter.ai/api/v1"
  logger?: Logger;                // Optional pino/winston compatible instance
  fetchImpl?: typeof fetch;       // Injection point for SSR/Edge runtimes or tests
  retryConfig?: RetryConfig;      // maxRetries, backoff strategy, etc.
})
```

- Validates `apiKey` (non-empty, correct prefix)
- Normalises `baseURL` (strips trailing slashes)
- Binds injected dependencies to private fields

---

## 3. Public Methods & Fields

| #   | Signature                                                 | Purpose                                                        |
| --- | --------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | `chat(opts: ChatOptions): Promise<ChatSuccess>`           | Perform a single request/response chat cycle                   |
| 2   | `stream(opts: ChatOptions): AsyncIterable<ChatChunk>`     | SSE/streaming support when the caller wants incremental tokens |
| 3   | `buildMessages(ctx: MessageContext): OpenRouterMessage[]` | Convenience helper for UI/hooks to build arrays                |
| 4   | `modelList(): Promise<ModelMeta[]>`                       | Fetch available models & capabilities (caches 5 min)           |

### `ChatOptions`

```ts
interface ChatOptions {
  messages: OpenRouterMessage[]; // Ordered list (system, user, etc.)
  model: string; // e.g. "gpt-4-turbo" (validated against allow-list)
  temperature?: number; // 0-2 (default 0.7)
  maxTokens?: number; // Optional cap
  responseFormat?: ResponseFormat; // e.g. JSON schema definition
  metadata?: Record<string, unknown>; // Arbitrary data forwarded as x-metadata header
  abortSignal?: AbortSignal; // For cancellation
}
```

### `ChatSuccess`

```ts
interface ChatSuccess {
  id: string;
  created: number; // epoch ms
  model: string;
  usage: { prompt: number; completion: number };
  choices: Array<{ message: OpenRouterMessage }>;
}
```

### `OpenRouterMessage`

```ts
interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string; // For tool messages
}
```

### `ResponseFormat` (JSON Schema example)

```ts
{
  type: 'json_schema',
  json_schema: {
    name: 'GenerateFlashcardsResponse',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: { type: 'string' },
              back:  { type: 'string' }
            },
            required: ['front','back']
          }
        }
      },
      required: ['flashcards']
    }
  }
}
```

---

## 4. Private Methods & Fields

1. `#fetch`: encapsulates network calls with auth header injection
2. `#buildHeaders(chatOpts)`: computes `Content-Type`, `Authorization`, `X-Model`, etc.
3. `#handleError(res)`: transforms non-2xx responses into typed errors
4. `#retry<T>(fn)`: generic exponential backoff retry wrapper
5. `#validateOptions(opts)`: guards against invalid params early

Private fields marked with `#`:

- `#apiKey: string`
- `#baseURL: string`
- `#logger: Logger`
- `#fetchImpl: typeof fetch`
- `#retryCfg: RetryConfig`

---

## 5. Error Handling

| #   | Scenario                                    | Action                                                           |
| --- | ------------------------------------------- | ---------------------------------------------------------------- |
| 1   | **400 Bad Request** – invalid prompt/params | Throw `OpenRouterBadRequestError` with details                   |
| 2   | **401 Unauthorized** – bad API key          | Throw `OpenRouterAuthError` & trigger alerting                   |
| 3   | **429 Too Many Requests** – rate-limited    | Automatic retry with exponential backoff (Respect `Retry-After`) |
| 4   | **5xx Server Errors**                       | Retry (maxRetries), escalate after exhaustion                    |
| 5   | **NetworkError / AbortError**               | Surface as `OpenRouterNetworkError`, support abort               |
| 6   | **Schema Validation Failure** (strict JSON) | Throw `OpenRouterSchemaError` with partial raw text              |

All errors extend a common `OpenRouterError` base that carries `status` and `raw` body for logging.

---

## 6. Security Considerations

1. **API Key** stored ONLY in server-side environments (Astro API route, Edge Function). Never expose to client.
2. Use **RLS** & Supabase secrets manager for storage; inject via env vars in CI/CD.
3. Enforce **allowed model list** to prevent high-cost / untested models.
4. Sanitize and log **prompt content** carefully (PII stripping where possible).
5. All external traffic via **HTTPS** with `strict-transport-security` headers.
6. Implement **rate limiting** at API route level to shield abuse.

---

## 7. Step-by-Step Implementation Plan

1. **Scaffold file & types**
   - Create `openrouter.types.ts` under `src/lib/` with interfaces above.
2. **Install deps**
   - `npm i zod undici p-retry` (zod for runtime schema validation, undici for polyfill in Node 18, p-retry for backoff)
3. **Implement service skeleton** in `src/lib/services/openrouter.service.ts`
   1. Define private fields & constructor validation (zod).
   2. Implement `#fetch` wrapping `fetchImpl`.
4. **Add `chat` method**
   1. Validate `ChatOptions` (zod).
   2. Build headers + body: `{ model, messages, temperature, max_tokens, response_format }`.
   3. Call `#fetch` & parse JSON into `ChatSuccess`.
   4. If `response_format && strict`, re-validate with zod and throw `OpenRouterSchemaError` on mismatch.
5. **Add `stream` method** (optional MVP-V2)
   - Utilise `fetch` with `stream: true`; yield delta chunks.
6. **Implement retries** with `p-retry`, handling 429/5xx.
7. **Logging & telemetry**
   - Hook into `event-log.service.ts` to record prompts, latency, token usage.
8. **Unit tests**
   - Mock `fetch` with `msw` + fake OpenRouter responses.
   - Cover happy path, retries, schema error.
9. **Integration tests** (CI-skipped, manual)
   - Use real API key stored in GitHub Actions secrets; run nightly.
10. **Documentation**
    - Add JSDoc & README snippets in `/docs/openrouter.md` for future devs.

> **Estimated effort:** 1–2 developer-days for core, +1 for streaming & tests.
