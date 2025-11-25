# API Endpoint Implementation Plan: PATCH /api/flashcards/{id}

## 1. Endpoint Overview

Updates an existing flashcard’s `front` and/or `back` text. Only the owner of the flashcard may perform the update. The endpoint enforces validation rules (≤200 chars for `front`, ≤500 chars for `back`) and returns the full, updated flashcard on success.

## 2. Request Details

- HTTP Method: PATCH
- URL Structure: `/api/flashcards/{id}` where `{id}` is a UUID of the flashcard to update
- Path Parameters:
  - `id` (string, UUID) – identifier of the flashcard (required)
- Request Body (JSON):

```json
{
  "front": "string (≤200)",
  "back": "string (≤500)"
}
```

- At least one of `front` or `back` must be present.
- Headers:
  - `Content-Type: application/json`
  - **Authentication header** (once auth is implemented)

## 3. Used Types

- `UpdateFlashcardCommand` (already in `src/types.ts`)
- `FlashcardDto` (response)
- New DTOs/Schemas to create:
  1. **`updateFlashcardSchema`** (Zod) – validates request body.
  2. **`flashcardIdParamSchema`** (Zod) – validates `id` path param as UUID.

## 4. Response Details

| Status | Scenario                                       | Body                  |
| ------ | ---------------------------------------------- | --------------------- |
| 200    | Successful update                              | `FlashcardDto`        |
| 400    | Invalid UUID, invalid body, JSON parse error   | `{ error, details? }` |
| 401    | Unauthenticated user (future)                  | `{ error }`           |
| 404    | Flashcard not found or does not belong to user | `{ error }`           |
| 500    | Unexpected server error                        | `{ error }`           |

## 5. Data Flow

1. **Astro API Route** (`src/pages/api/flashcards/[id].ts`)
2. Extract & validate path param (`id`) and JSON body against Zod schemas.
3. Obtain `supabase` from `locals` and `userId` from auth (temporarily `DEFAULT_USER_ID`).
4. Call `flashcardsService.updateFlashcard(supabase, id, userId, command)`.
5. Service layer performs:
   - `update flashcards set front=?, back=?, updated_at=now() where id=? and user_id=? and deleted_at is null` with `.select('*')`.
   - If `data` is empty ⇒ 404.
6. API route returns updated flashcard JSON.
7. Error paths delegate to `handleApiError` util for logging into `event_logs` table.

## 6. Security Considerations

- **Authorization**: Restrict update to rows where `user_id = current user` (handled in query & by Supabase RLS).
- **Validation**: Zod ensures max lengths; rejects empty updates.
- **Input Sanitisation**: Supabase query parameterisation prevents SQL injection.
- **RLS**: Ensure `flashcards` table has RLS enabled with policy `user_id = auth.uid()`.
- **Rate Limiting**: (future) middleware throttle.

## 7. Error Handling

1. Invalid UUID → 400.
2. JSON parse error → 400.
3. Zod validation error → 400 with detailed issues.
4. Flashcard not found or not owned → 404.
5. Supabase error → 500 (logged).

`handleApiError` already inserts into `event_logs`; reuse it.

## 8. Performance Considerations

- Single-row `update` with index on `id` (PK) → O(1).
- Ensure `updated_at` trigger exists (already in migrations).
- Return only one row.

## 9. Implementation Steps

1. **Create Zod schema** `updateFlashcardSchema` in `src/lib/schemas/flashcards.schemas.ts`:
   ```ts
   export const updateFlashcardSchema = z
     .object({
       front: z.string().max(200).optional(),
       back: z.string().max(500).optional(),
     })
     .refine((data) => data.front !== undefined || data.back !== undefined, {
       message: "At least front or back must be provided",
     });
   ```
2. **Add path param UUID validation** util or inline: `z.string().uuid()`.
3. **Extend `FlashcardsService`** with:

   ```ts
   async updateFlashcard(
     supabase: SupabaseClient,
     userId: string,
     id: string,
     command: UpdateFlashcardCommand,
   ): Promise<FlashcardDto>
   ```

   - Perform update and return single row, throw 404 if none.

4. **Create API route file** `src/pages/api/flashcards/[id].ts`:
   - Export `PATCH` handler implementing data flow.
5. **Reuse utilities** `errorResponse`, `handleApiError` for error handling.
6. **Add unit tests** (if testing infra) for:
   - Successful update.
   - Validation failures.
   - 404 when id not found or belongs to another user.
7. **Update docs** (`README.md`, openapi spec if exists).
8. **Run linter & build** to ensure no issues.

