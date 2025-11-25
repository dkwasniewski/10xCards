# API Endpoint Implementation Plan: Create Multiple Flashcards (POST /flashcards/bulk)

## 1. Endpoint Overview

This endpoint allows an authenticated user to create multiple flashcards in a single request. It inserts each flashcard row into the `flashcards` table, attributing them to the current user and optionally linking to an AI generation session.

## 2. Request Details

- HTTP Method: POST
- URL: `/flashcards/bulk`
- Authentication: Required (Supabase session via `context.locals`)

### Request Body

```json
[
  {
    "front": "string (max 200 chars)",
    "back": "string (max 500 chars)",
    "source": "manual" | "ai",
    "ai_session_id": "uuid"  // required if source === "ai"
  },
  ...
]
```

### Parameters

- Required per item:
  - `front`: string, ≤ 200 characters
  - `back`: string, ≤ 500 characters
  - `source`: enum `"manual" | "ai"`
- Conditional:
  - `ai_session_id`: UUID, required if `source === "ai"`
- Array must be non-empty; reject empty array requests.

## 3. Used Types

- `CreateFlashcardCommand` (Pick from `TablesInsert<"flashcards">`):
  - `front`, `back`, `source`, `ai_session_id`
- `BulkCreateFlashcardsCommand = CreateFlashcardCommand[]`
- `FlashcardDto = Tables<"flashcards">`
- `BulkCreateFlashcardsResponseDto`:
  ```ts
  interface BulkCreateFlashcardsResponseDto {
    created: FlashcardDto[];
  }
  ```

## 4. Data Flow

1. **Route Handler** (`src/pages/api/flashcards/bulk.ts`):
   - Parse and validate the request body via Zod.
   - Extract the authenticated user ID from `context.locals.supabase.user.id`.
   - Delegate to `flashcardsService.createBulkFlashcards(userId, commands)`.
   - Return HTTP 201 with `{ created: [...] }` or appropriate error.

2. **Service Layer** (`src/lib/services/flashcards.service.ts`):
   - Accept `userId: string` and array of command DTOs.
   - Perform single bulk insert using Supabase:
     ```ts
     supabase.from("flashcards").insert(
       commands.map((cmd) => ({ ...cmd, user_id: userId })),
       { returning: "representation" }
     );
     ```
   - Map and return the resulting `FlashcardDto[]`.
   - On DB error: throw a typed error for the route to catch.

3. **Error Logging**:
   - Unexpected errors caught in handler are logged via `eventLogsService.create({ endpoint, user_id, payload, message })`.

## 5. Security Considerations

- **Authentication**: Only authenticated users can call this endpoint; reject requests without a valid Supabase session (401).
- **Authorization**: Users can only insert flashcards under their own `user_id`—ensure `user_id` is never taken from the client.
- **Input Sanitization**: Zod validation enforces type, string lengths, enum values, and UUID format.
- **Rate/Payload Limiting**: Consider middleware or a body-size cap (e.g., max 50 flashcards per request).

## 6. Error Handling

| Condition                                       | Status Code | Response Body                                   |
| ----------------------------------------------- | ----------- | ----------------------------------------------- |
| Invalid JSON                                    | 400         | `{ error: "Invalid JSON body" }`                |
| Validation failure (Zod)                        | 400         | `{ error: "Validation error", details: [...] }` |
| Missing/expired session                         | 401         | `{ error: "Unauthorized" }`                     |
| Foreign key violation (`ai_session_id` invalid) | 400         | `{ error: "Invalid ai_session_id" }`            |
| Database insertion failure                      | 500         | `{ error: "Internal server error" }`            |

- All 5xx errors should also trigger an event log entry for later inspection.

## 7. Performance Considerations

- Bulk insert in a single database call minimizes round trips.
- Use `returning: 'representation'` to fetch all inserted rows at once.
- Limit maximum array size to prevent excessive memory or DB locks.
- Ensure `tsv` vector column is generated automatically without additional work.

## 8. Implementation Steps

1. **Create Zod Schemas** (`src/lib/schemas/flashcards.schemas.ts`):
   - Define `createFlashcardItemSchema` and `bulkCreateFlashcardsSchema`.
2. **Implement Service** (`src/lib/services/flashcards.service.ts`):
   - Add `createBulkFlashcards(userId, commands)` method.
3. **Create API Route** (`src/pages/api/flashcards/bulk.ts`):
   - Export `export const POST: APIRoute`.
   - Parse session, validate body, call service, handle errors.
4. **Event Logging Integration**:
   - Inject `eventLogsService` and ensure catch blocks call it.
5. **Add Type Definitions** (if missing) in `src/types.ts`:
   - Confirm `BulkCreateFlashcardsCommand` and `BulkCreateFlashcardsResponseDto` exist.
6. **Write Unit Tests**:
   - Mock service and Supabase; test happy path and error scenarios.
7. **Add Integration Tests**:
   - Using a test database, call the endpoint end-to-end.
8. **Documentation**:
   - Update OpenAPI spec and project README with the new endpoint.
9. **Review & Merge**:
   - Ensure code follows linting, early returns, and the project’s clean code guidelines.
