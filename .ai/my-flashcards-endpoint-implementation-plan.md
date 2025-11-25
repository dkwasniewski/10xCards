# API Endpoint Implementation Plan: GET /flashcards

## 1. Endpoint Overview

Retrieve a paginated, optionally searchable list of the authenticated user’s flashcards. Supports full-text search on both the `front` and `back` fields and basic sorting.

## 2. Request Details

- **HTTP Method:** GET
- **URL:** `/flashcards`
- **Query Parameters**
  - **Required:** none (defaults are applied)
  - **Optional:**
    - `search` (string, ≤100 chars) – full-text search term
    - `page` (integer ≥1, default 1)
    - `limit` (integer 1-100, default 20)
    - `sort` (`created_at` | `front`, default `created_at` DESC)
- **Headers:** `Authorization: Bearer <JWT>` (Supabase session)
- **Request Body:** _N/A_

## 3. Used Types

- `FlashcardDto` – row projection of `flashcards` (src/types.ts)
- `PaginationDto` – paging meta (src/types.ts)
- `ListFlashcardsResponseDto` – `{ data: FlashcardDto[]; pagination: PaginationDto }`

## 4. Response Details

| Status                    | Condition            | Body                        |
| ------------------------- | -------------------- | --------------------------- |
| 200 OK                    | Successful retrieval | `ListFlashcardsResponseDto` |
| 400 Bad Request           | Invalid query params | `{ error: string }`         |
| 401 Unauthorized          | Missing/invalid JWT  | `{ error: string }`         |
| 500 Internal Server Error | Unhandled error      | `{ error: string }`         |

## 5. Data Flow

1. **Astro API Route** (`src/pages/api/flashcards.ts`) receives request and extracts Supabase client from `context.locals`.
2. Validate query parameters with Zod (`flashcardsQuerySchema`).
3. Calls `flashcardsService.listFlashcards(userId, query)`.
4. **flashcardsService**
   1. Builds a Supabase query on `flashcards` table:
      - `eq('user_id', userId)`
      - `is('deleted_at', null)`
      - `textSearch('tsv', search)` using `plainto_tsquery` if `search` provided.
      - `order(sort, { ascending: sort === 'front' })`.
      - `range(from, to)` for pagination.
   2. Executes query with `select('*', { count: 'exact' })`.
   3. Returns `{ data, count }` to route.
5. Route converts to `ListFlashcardsResponseDto` and sends JSON.
6. Errors are caught and passed to standardized error response helper (`handleApiError`).

## 6. Security Considerations

- **AuthN:** Require valid Supabase JWT; verify via `context.locals.session`.
- **AuthZ:** RLS on `flashcards` ensures `user_id = auth.uid()`.
- **Input Validation:** Zod prevents malformed pagination & search strings.
- **SQL Injection:** Supabase query builder uses parameterized queries; search param is passed to `plainto_tsquery` safely.
- **Rate Limiting (optional):** Apply middleware (e.g., KV-based) to prevent abuse.

## 7. Error Handling

| Scenario                         | Status | Message                          |
| -------------------------------- | ------ | -------------------------------- |
| Missing JWT                      | 401    | "Unauthorized"                   |
| Invalid query (e.g., limit >100) | 400    | Zod error summary                |
| Database failure                 | 500    | "Internal Server Error" + log id |

All server-side errors are logged with `event_logs` table via `logError(service, error, userId)` helper.

## 8. Performance Considerations

- **Indexes:**
  - `CREATE INDEX flashcards_user_created_idx ON flashcards (user_id, created_at DESC);`
  - Existing GIN index on `tsv` for full-text search (db-plan).
- **Pagination:** Use `range` to fetch only requested rows.
- **Projection:** `select('*')` can be narrowed later to needed columns.
- **Connection Reuse:** Use `context.locals.supabase` for pooled edge client.

## 9. Implementation Steps

1. **Define Zod Schema** in `src/lib/schemas/flashcards.schemas.ts`:
   ```ts
   export const listFlashcardsQuerySchema = z.object({
     search: z.string().max(100).optional(),
     page: z.coerce.number().int().gte(1).default(1),
     limit: z.coerce.number().int().min(1).max(100).default(20),
     sort: z.enum(["created_at", "front"]).default("created_at"),
   });
   export type ListFlashcardsQuery = z.infer<typeof listFlashcardsQuerySchema>;
   ```
2. **Extend Service** (`src/lib/services/flashcards.service.ts`):
   ```ts
   async listFlashcards(userId: string, q: ListFlashcardsQuery): Promise<ListFlashcardsResponseDto> { /* ... */ }
   ```
3. **Create/Update API Route** `src/pages/api/flashcards.ts`:
   - Guard: `if (Astro.request.method !== 'GET') return new Response(null, { status: 405 });`
   - Parse & validate query.
   - Call service; build pagination meta.
   - Return JSON 200.
4. **Add Error Helper** `src/lib/utils/api-error.ts` for consistent formatting & logging to `event_logs`.
5. **Unit Tests** (Vitest):
   - Validate schema edge cases.
   - Service returns correct pagination counts.
6. **E2E Test** (Supertest or Playwright): happy path & auth failure.
7. **Update Docs**: OpenAPI/README.
8. **Deploy & Monitor**: Verify logs and Supabase dashboard.
