# API Endpoint Implementation Plan: DELETE Flashcards

## Overview

This document covers both single and bulk deletion of flashcards. Both operations perform soft-deletes (setting `deleted_at = now()`) and never physically remove rows.

---

## 1. DELETE /api/flashcards/{id} - Single Flashcard

### 1.1 Endpoint Overview

Soft-delete a single flashcard that belongs to the authenticated user. Returns **204 No Content** on success with an empty body.

### 1.2 Request Details

- **HTTP Method:** DELETE
- **URL Pattern:** `/api/flashcards/{id}`
- **Path Parameters:**
  - `id` (string, UUID, required) – Flashcard primary key
- **Headers:**
  - `Authorization: Bearer <JWT>` (Supabase session) – required once auth is wired
- **Request Body:** _none_

### 1.3 Used Types

- `uuidParamSchema` – validates `id` path param
- `FlashcardDto` – used internally by service, not returned to the client

### 1.4 Response Details

| Status                    | When                                                    | Body                                       |
| ------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| 204 No Content            | Flashcard soft-deleted successfully                     | _empty_                                    |
| 400 Bad Request           | `id` fails UUID validation                              | `{ error: "Invalid flashcard ID format" }` |
| 401 Unauthorized          | Missing/invalid session                                 | `{ error: "Unauthorized" }` (middleware)   |
| 404 Not Found             | Flashcard does not exist **or** does not belong to user | `{ error: "Flashcard not found" }`         |
| 500 Internal Server Error | Unexpected failures                                     | `{ error: "Failed to delete flashcard" }`  |

### 1.5 Data Flow

1. **Astro Route** `src/pages/api/flashcards/[id].ts`
   1. Extract `id` from `params`, validate with `uuidParamSchema`.
   2. Identify `userId` from `locals.session.user.id` (temporary `DEFAULT_USER_ID` during dev).
   3. Call `flashcardsService.deleteFlashcard(supabase, userId, id)`.
2. **Service Layer** `FlashcardsService`
   1. Perform soft-delete:
      ```ts
      await supabase
        .from("flashcards")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();
      ```
   2. If no row affected (`PGRST116`), throw `Error("Flashcard not found")`.
3. **Middleware** already injects `locals.supabase` and validates session.
4. **Error Helper** `handleApiError` writes to `event_logs` table for 5xx.

### 1.6 Security Considerations

1. **Authentication** – valid Supabase session required.
2. **Authorization** – query filters on `user_id`; RLS should mirror the same check.
3. **Input Validation** – strict UUID check prevents malformed input.
4. **Rate Limiting / Abuse** – add edge-function/middleware later.

### 1.7 Error Handling

| Scenario                    | Detection                             | Response               |
| --------------------------- | ------------------------------------- | ---------------------- |
| Invalid UUID                | Zod `safeParse` fails                 | 400                    |
| Not found / not owner       | Supabase returns `PGRST116` or `null` | 404                    |
| Supabase client unavailable | Defensive check                       | 500                    |
| DB/network failure          | catch-all                             | 500 + `handleApiError` |

### 1.8 Performance Considerations

- Single-row `UPDATE` using PK + indexed `user_id`; negligible latency.
- Soft deletes increase table size; schedule periodic purge or partitioning.

---

## 2. DELETE /api/flashcards - Bulk Deletion

### 2.1 Endpoint Overview

Soft-delete multiple flashcards (up to 100 at once) that belong to the authenticated user. Returns **204 No Content** on success with an empty body.

### 2.2 Request Details

- **HTTP Method:** DELETE
- **URL Pattern:** `/api/flashcards`
- **Headers:**
  - `Authorization: Bearer <JWT>` (Supabase session) – required once auth is wired
- **Request Body:**

  ```json
  {
    "ids": ["uuid-1", "uuid-2", "..."]
  }
  ```

  - `ids` (array of UUIDs, required) – 1 to 100 flashcard IDs to delete

### 2.3 Used Types

- `BulkDeleteFlashcardsCommand` – request body type
- `bulkDeleteFlashcardsSchema` – Zod schema validating the request
- `FlashcardDto` – used internally by service

### 2.4 Response Details

| Status                    | When                                             | Body                                         |
| ------------------------- | ------------------------------------------------ | -------------------------------------------- |
| 204 No Content            | Flashcards soft-deleted successfully             | _empty_                                      |
| 400 Bad Request           | Invalid request body or empty/too many IDs       | `{ error: "...", details?: [] }`             |
| 401 Unauthorized          | Missing/invalid session                          | `{ error: "Unauthorized" }` (middleware)     |
| 404 Not Found             | None of the provided IDs match user's flashcards | `{ error: "No flashcards found to delete" }` |
| 500 Internal Server Error | Unexpected failures                              | `{ error: "Failed to delete flashcards" }`   |

### 2.5 Data Flow

1. **Astro Route** `src/pages/api/flashcards.ts`
   1. Parse and validate request body with `bulkDeleteFlashcardsSchema`.
   2. Extract `ids` array from validated body.
   3. Identify `userId` from `locals.session.user.id`.
   4. Call `flashcardsService.bulkDeleteFlashcards(supabase, userId, ids)`.
2. **Service Layer** `FlashcardsService`
   1. Perform bulk soft-delete:
      ```ts
      await supabase
        .from("flashcards")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", ids)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .select("id", { count: "exact", head: true });
      ```
   2. Return count of deleted rows.
3. **Route Response** – return 404 if count is 0, otherwise 204.

### 2.6 Security Considerations

1. **Authentication** – valid Supabase session required.
2. **Authorization** – query filters on `user_id`; RLS enforces the same.
3. **Input Validation** – strict UUID array validation; min 1, max 100 IDs.
4. **Rate Limiting / Abuse** – consider adding middleware to prevent excessive bulk operations.

### 2.7 Error Handling

| Scenario                    | Detection                 | Response               |
| --------------------------- | ------------------------- | ---------------------- |
| Invalid body format         | Zod `safeParse` fails     | 400                    |
| Empty array or >100 IDs     | Zod validation            | 400                    |
| None found / not owner      | Service returns count = 0 | 404                    |
| Supabase client unavailable | Defensive check           | 500                    |
| DB/network failure          | catch-all                 | 500 + `handleApiError` |

### 2.8 Performance Considerations

- Bulk `UPDATE` with `IN` clause on indexed PK + `user_id`; efficient for up to 100 IDs.
- For larger batches, consider chunking on client-side or increasing limit with proper testing.

---

## 3. Single Delete Implementation Steps

1. **Service** – add `deleteFlashcard` method in `src/lib/services/flashcards.service.ts`:

   ```ts
   async deleteFlashcard(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
     const { error } = await supabase
       .from("flashcards")
       .update({ deleted_at: new Date().toISOString() })
       .eq("id", id)
       .eq("user_id", userId)
       .is("deleted_at", null)
       .single();

     if (error) {
       if (error.code === "PGRST116") {
         throw new Error("Flashcard not found");
       }
       throw error;
     }
   }
   ```

2. **API Route** – extend `src/pages/api/flashcards/[id].ts`:

   ```ts
   export const DELETE: APIRoute = async ({ params, locals }) => {
     const { id } = params;
     const parse = uuidParamSchema.safeParse(id);
     if (!parse.success) return errorResponse(400, "Invalid flashcard ID format", parse.error.errors);

     const userId = DEFAULT_USER_ID; // replace with auth later
     const supabase = locals.supabase;
     if (!supabase)
       return await handleApiError(
         500,
         ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE,
         undefined,
         undefined,
         `DELETE /api/flashcards/${id}`,
         userId
       );

     try {
       await flashcardsService.deleteFlashcard(supabase, userId, parse.data);
       return new Response(null, { status: 204 });
     } catch (err) {
       if (err instanceof Error && err.message.includes("not found")) {
         return errorResponse(404, err.message);
       }
       return await handleApiError(
         500,
         "Failed to delete flashcard",
         err,
         supabase,
         `DELETE /api/flashcards/${id}`,
         userId
       );
     }
   };
   ```

3. **RLS** – ensure `flashcards` policy only allows owner updates.
4. **Unit Tests** – service happy path + not-found scenario.
5. **Integration Test** – DELETE route using Supabase test user.
6. **Docs** – update `.ai/api-plan.md` and OpenAPI docs.
7. **Commit** – `feat(api): add DELETE /flashcards/{id}`

---

## 4. Bulk Delete Implementation Steps (✅ COMPLETED)

1. **Schema** – added `bulkDeleteFlashcardsSchema` in `src/lib/schemas/flashcards.schemas.ts`
2. **Types** – added `BulkDeleteFlashcardsCommand` and `BulkDeleteFlashcardsResponseDto` to `src/types.ts`
3. **Service Logic** – added `bulkDeleteFlashcards` method in `src/lib/services/flashcards.service.ts`
4. **API Route** – added `DELETE` handler to `src/pages/api/flashcards.ts`
5. **Error Handling** – reused `errorResponse` & `handleApiError`
6. **Tests** – add unit tests for service and integration tests for route (pending)
7. **Docs** – updated this implementation plan and `api-plan.md`
8. **Commit** – `feat(api): add bulk DELETE /flashcards`
