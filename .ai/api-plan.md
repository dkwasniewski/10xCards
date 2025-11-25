# REST API Plan

## 1. Resources

- **User** (`users`)
- **AI Session** (`ai_generation_sessions`)
- **Flashcard** (`flashcards`)
- **Review** (`reviews`)
- **Learning Session** (virtual, not stored)
- **Event Log** (`event_logs`)

## 2. Endpoints

### Authentication

- POST `/auth/register`
  - Description: Register a new user
  - Request:
    ```json
    { "email": "string", "password": "string" }
    ```
  - Response 201:
    ```json
    { "id": "uuid", "email": "string", "created_at": "timestamp" }
    ```
  - Errors: 400 validation, 409 email exists

- POST `/auth/login`
  - Description: Authenticate user
  - Request:
    ```json
    { "email": "string", "password": "string" }
    ```
  - Response 200:
    ```json
    { "access_token": "jwt", "expires_in": 3600 }
    ```
  - Errors: 400, 401 invalid credentials

- POST `/auth/forgot-password`
  - Description: Send reset link
  - Request: `{ "email": "string" }`
  - Response 200: `{ "message": "Reset link sent" }`
  - Errors: 400

- POST `/auth/reset-password`
  - Description: Reset password with token
  - Request: `{ "token": "string", "new_password": "string" }`
  - Response 200: `{ "message": "Password updated" }`
  - Errors: 400, 401 invalid/expired token

### AI Generation Sessions

- POST `/ai-sessions`
  - Description: Create AI session and generate candidates
  - Request:
    ```json
    { "input_text": "string (1000–10000 chars)", "model": "string" }
    ```
  - Response 201:
    ```json
    {"id": "uuid", "candidates": [{"front":"","back":"","prompt":""}, ...]}
    ```
  - Errors: 400 length validation, 429 rate limit

- GET `/ai-sessions/{sessionId}/candidates`
  - Description: Fetch AI-generated candidates
  - Response 200:
    ```json
    [{"id":"uuid","front":"","back":"","prompt":""}, ...]
    ```
  - Errors: 400 (invalid UUID), 401, 404
  - Status: ✅ Implemented

- POST `/ai-sessions/{sessionId}/candidates/actions`
  - Description: Bulk accept/edit/reject candidates
  - Request:
    ```json
    {"actions": [{"candidate_id":"uuid","action":"accept"|"edit"|"reject","edited_front":"?","edited_back":"?"}, ...]}
    ```
  - Response 200: `{ "accepted": [...], "edited": [...], "rejected": [...] }`
  - Errors: 400, 404
  - Status: ✅ Implemented

### Flashcards

- GET `/flashcards`
  - Description: List user's flashcards
  - Query Params: `search` (string), `page` (int), `limit` (int), `sort` (`created_at`|`front`)
  - Response 200:
    ```json
    {"data": [{"id":"uuid","front":"","back":"",...}],"pagination": {"page":1,"limit":20,"total":100}}
    ```

- POST `/flashcards`
  - Description: Create a flashcard
  - Request:
    ```json
    {
      "front": "string ≤200 chars",
      "back": "string ≤500 chars",
      "source": "manual" | "ai",           // flashcard source
      "ai_session_id": "uuid" (optional) // required if source is ai
    }
    ```
  - Response 201: flashcard object
  - Errors: 400 validation

- PATCH `/flashcards/{id}`
  - Description: Update front/back
  - Request: `{ "front": "?","back": "?" }`
  - Response 200: updated flashcard
  - Errors: 400, 404
  - Validation:
    - `front`: maximum length: 200 characters
    - `back`: maximum length: 500 characters
    - `source`: must be 'manual' or 'ai'

- DELETE `/flashcards/{id}`
  - Description: Delete single flashcard (soft)
  - Response 204 No Content
  - Errors: 404

- DELETE `/flashcards`
  - Description: Bulk delete flashcards (soft, up to 100 at once)
  - Request:
    ```json
    { "ids": ["uuid-1", "uuid-2", "..."] }
    ```
  - Response 204 No Content
  - Errors: 400 (validation), 404 (none found)

- POST `/flashcards/bulk`
  - Description: Create multiple flashcards in a single request
  - Request:
    ```json
    [
      {
        "front": "string ≤200 chars",
        "back": "string ≤500 chars",
        "source": "manual" | "ai",
        "ai_session_id": "uuid" // optional, required if source is ai
      },
      ...
    ]
    ```
  - Response 201:
    ```json
    {
      "created": [
        /* array of flashcard objects */
      ]
    }
    ```
  - Errors: 400 validation

### Reviews

- GET `/reviews`
  - Description: List due reviews
  - Query Params: `due` (bool), `page`, `limit`
  - Response: paginated reviews

- POST `/reviews`
  - Description: Record a review rating
  - Request:
    ```json
    {"flashcard_id":"uuid","rating":1-5}
    ```
  - Response 201: review object (includes `next_due`)
  - Errors: 400, 404

### Learning Session

- GET `/learning-sessions`
  - Description: Fetch next due flashcards for spaced repetition
  - Response 200:
    ```json
    [{"flashcard_id":"uuid","front":""}, ...]
    ```

- POST `/learning-sessions/responses`
  - Description: Submit rating in learning flow
  - Request:
    ```json
    [{"flashcard_id":"uuid","rating":1-5}, ...]
    ```
  - Response 200: updated reviews

### Event Logs (Internal)

- POST `/event-logs`
  - Description: Manually log event (optional)
  - Request: event log object
  - Response 201

## 3. Authentication & Authorization

- All endpoints require `Authorization: Bearer <JWT>`
- JWT issued by Supabase Auth
- RLS policies enforce `user_id = auth.uid()` at database level

## 4. Validation & Business Logic

- **Input lengths**: enforce input_text 1000–10000; front ≤200; back ≤500
- **Bulk actions**: verify each candidate belongs to session & user
- **Review scheduling**: compute `next_due` server-side based on rating
- **Search**: use full-text search on `flashcards.tsv` via GIN index
- **Rate limiting**: apply per-user limits on auth and /ai-sessions endpoints

---

_All payloads use JSON; timestamps in ISO8601._
