# API Endpoint Implementation Plan: Get AI Session Candidates (`GET /api/ai-sessions/{sessionId}/candidates`)

## 1. Endpoint Overview

Fetch all AI-generated flashcard _candidates_ previously produced in a given **generation session**.  The caller must be the owner of the session.  
Returns an array of `CandidateDto` items (`id`, `front`, `back`, `prompt`).

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Pattern:** `/api/ai-sessions/{sessionId}/candidates`
- **Path Params:**
  - `sessionId` (UUID, **required**) – identifier of the `ai_generation_sessions` record.
- **Query Params:** _None_
- **Headers:**
  - `Authorization: Bearer <access_token>` – Supabase auth JWT (required).
- **Request Body:** _None_

## 3. Used Types

- `CandidateDto` – ‑from `src/types.ts` lines 55-56.
- `GetCandidatesResponseDto` – alias for `CandidateDto[]` (types.ts 63-64).

_No command object is needed because this is a pure read._

## 4. Response Details

| Status  | Meaning                                  | Body                                             |
| ------- | ---------------------------------------- | ------------------------------------------------ |
| **200** | Success                                  | `GetCandidatesResponseDto` – array of candidates |
| **400** | Invalid `sessionId` format               | `{ error: "Invalid sessionId" }`                 |
| **401** | Unauthenticated                          | `{ error: "Unauthorized" }`                      |
| **404** | Session not found _or_ not owned by user | `{ error: "Session not found" }`                 |
| **500** | Unhandled error                          | `{ error: "Internal server error" }`             |

## 5. Data Flow

1. **Astro API route** receives `GET` request.  `context.locals.supabase` already contains an authenticated `SupabaseClient`.
2. **Auth check** – `supabase.auth.getUser()`; if no user → 401.
3. **Validate** `sessionId` (Zod UUID). If invalid → 400.
4. **Service layer** `getAiSessionCandidates(sessionId: string, userId: string)` (in `src/lib/services/aiSessions.ts`):
   1. `supabase.from('ai_generation_sessions')` – confirm record exists and `user_id = userId`.
   2. If not found → throw `NotFoundError`.
   3. `supabase.from('flashcards')` – `select id, front, back, prompt` where `ai_session_id = sessionId AND user_id = userId`.
   4. Return `CandidateDto[]`.
5. API route serialises result with `json()` helper and returns **200**.
6. **Error handling middleware** captures `NotFoundError`, `ValidationError`, others → maps to status table above and logs to `event_logs`.

## 6. Security Considerations

- **Authentication** – Supabase JWT required.
- **Authorization** – Enforce ownership via `user_id` filter; rely on **RLS** as an extra layer.
- **Input Validation** – Zod UUID check prevents injection / path traversal.
- **Least information** – Respond 404 for both “not found” and “not owner” to avoid user-enumeration.
- **Rate Limiting** – (optional) apply middleware to throttle excessive polling.

## 7. Error Handling

- **ValidationError** → 400
- **AuthError** → 401
- **NotFoundError** → 404
- **SupabaseError / others** → 500
- All 4xx/5xx responses include `{ error: string }` payload.
- Log `500` and unexpected 4xx to `event_logs` with context (`endpoint`, `user_id`, `payload_snippet`).

## 8. Performance Considerations

- Index on `flashcards.ai_session_id` (likely already present) ensures fast lookup.
- Fetch only required columns to minimise payload.
- Cache-control header (`private, max-age=0`) to prevent stale data.

## 9. Implementation Steps

1. **Create Zod schema** `sessionIdSchema = z.string().uuid();` in `src/lib/schemas/aiSessions.ts`.
2. **Service** (`src/lib/services/aiSessions.ts`)

   ```ts
   export async function getAiSessionCandidates(
     supabase: SupabaseClient,
     sessionId: string,
     userId: string
   ): Promise<CandidateDto[]> {
     // 1. Ensure session exists & belongs to user
     const { data: session } = await supabase
       .from("ai_generation_sessions")
       .select("id")
       .eq("id", sessionId)
       .eq("user_id", userId)
       .single();
     if (!session) throw new NotFoundError("Session not found");

     // 2. Fetch candidates (flashcards linked to the session)
     const { data, error } = await supabase
       .from("flashcards")
       .select("id, front, back, prompt")
       .eq("ai_session_id", sessionId)
       .eq("user_id", userId);
     if (error) throw error;
     return data as CandidateDto[];
   }
   ```

3. **API route** `src/pages/api/ai-sessions/[sessionId]/candidates.ts`:
   - `export const GET` handler.
   - `export const prerender = false;`
   - Parse path param, validate with schema.
   - Call service with `context.locals.supabase` and current `user.id`.
   - Return JSON 200.
   - Wrap in `try/catch`, map errors.
4. **Add tests** (`src/pages/api/__tests__/ai-sessions.candidates.test.ts`):
   - ✅ 200 happy path (owns session, candidates returned)
   - 🔒 401 when no auth
   - 🔒 404 when session id unknown / not owner
   - 🛑 400 for invalid UUID.
5. **Update RLS** rules (if not already): ensure `flashcards` and `ai_generation_sessions` tables require `user_id = auth.uid()`.
6. **Update docs** (`.ai/api-plan.md`) & OpenAPI spec if present.
7. **Peer review & merge**.
