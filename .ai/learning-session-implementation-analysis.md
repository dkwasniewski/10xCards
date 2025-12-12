# Learning Session Feature - Comprehensive Implementation Analysis

**Document Version:** 1.0
**Date:** 2025-12-12
**Status:** Production-Ready Implementation Plan
**Feature:** US-010 Study Session View (Spaced Repetition Learning)
**⚠️ IMPORTANT:** This feature is **OPTIONAL** and not required for MVP. It can be implemented in a future iteration.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Gap Analysis](#gap-analysis)
4. [Technical Architecture](#technical-architecture)
5. [Database Implementation](#database-implementation)
6. [API Endpoints Design](#api-endpoints-design)
7. [Service Layer Design](#service-layer-design)
8. [UI Components Architecture](#ui-components-architecture)
9. [Spaced Repetition Algorithm](#spaced-repetition-algorithm)
10. [Testing Strategy](#testing-strategy)
11. [Implementation Phases](#implementation-phases)
12. [Security Considerations](#security-considerations)
13. [Performance Optimization](#performance-optimization)
14. [Production Readiness Checklist](#production-readiness-checklist)

---

## Executive Summary

### Feature Overview

The Learning Session feature (US-010) implements a spaced repetition study system allowing users to review flashcards using scientifically-proven learning algorithms. This is a **complete greenfield feature** requiring full-stack implementation.

**⚠️ Feature Status:** This feature is **OPTIONAL** and not required for the MVP. It can be implemented in a future iteration when needed. The application is fully functional without this feature.

### Current Status

**Infrastructure Ready:**

- ✅ Database schema (`reviews` table exists)
- ✅ TypeScript types defined
- ✅ RLS policies in place
- ✅ Documentation complete

**Implementation Missing:**

- ❌ No API endpoints (0/4 endpoints)
- ❌ No service layer
- ❌ No UI components
- ❌ No study page
- ❌ No SRS algorithm integration
- ❌ No navigation links

### Effort Estimation

- **Backend:** ~3-4 days (API + Service + SRS Integration)
- **Frontend:** ~4-5 days (UI Components + Page + Hooks)
- **Testing:** ~2-3 days (Unit + Integration + E2E)
- **Total:** ~9-12 days for production-ready implementation

---

## Current State Analysis

### What Exists

#### 1. Database Schema ✅

**Location:** `supabase/migrations/20251014000002_create_core_tables.sql`

```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  flashcard_id uuid references flashcards(id) on delete cascade not null,
  rating smallint not null,              -- User quality rating (1-5)
  reviewed_at timestamptz default now(), -- When reviewed
  next_due timestamptz not null,         -- Next review scheduled date
  deleted_at timestamptz null            -- Soft delete
);

-- Performance indexes
create index idx_reviews_user_id on reviews(user_id);
create index idx_reviews_flashcard_id on reviews(flashcard_id);
create index idx_reviews_next_due on reviews(next_due);

-- RLS policies
alter table reviews enable row level security;

create policy reviews_access on reviews
  for select, update, delete using (user_id = auth.uid());

create policy reviews_insert on reviews
  for insert with check (user_id = auth.uid());
```

**Analysis:**

- Schema is production-ready
- Supports all SRS algorithm requirements
- Proper indexes for performance
- Security policies enforced
- Soft delete capability included

#### 2. TypeScript Types ✅

**Location:** `src/types.ts` (lines 114-135)

```typescript
// Review Types
export type ReviewDto = Tables<"reviews">;
export type CreateReviewCommand = Pick<TablesInsert<"reviews">, "flashcard_id" | "rating">;

// Learning Session Types
export interface LearningSessionItemDto {
  flashcard_id: string;
  front: string;
}

export type SubmitLearningResponsesCommand = {
  flashcard_id: string;
  rating: number;
}[];

export type LearningSessionResponseDto = ReviewDto[];
```

**Analysis:**

- Types align with API plan
- Ready for immediate use
- Need minor additions for full feature

#### 3. Existing Patterns to Follow

**Service Layer Pattern:**

```typescript
// Example: src/lib/services/flashcards.service.ts
export class FlashcardsService {
  async listFlashcards(
    supabase: SupabaseClient,
    userId: string,
    query: ListFlashcardsQuery
  ): Promise<ListFlashcardsResponseDto> {
    // Implementation
  }
}

export const flashcardsService = new FlashcardsService();
```

**Custom Hooks Pattern:**

```typescript
// Example: src/lib/hooks/flashcards.ts
export function useFlashcards(): UseFlashcardsResult {
  const [state, setState] = useState<FlashcardsState>({...});

  useEffect(() => {
    fetchFlashcards();
  }, [params]);

  return { ...state, refetch };
}
```

**API Endpoint Pattern:**

```typescript
// Example: src/pages/api/flashcards.ts
export async function GET(context: APIContext) {
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  const result = await FlashcardsService.list(supabase, user.id, params);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Astro Page Pattern:**

```astro
---
// src/pages/flashcards/index.astro
import Layout from "@/layouts/Layout.astro";
import MyFlashcards from "@/components/flashcards/MyFlashcards";

export const prerender = false;
---

<Layout title="My Flashcards - 10xCards">
  <MyFlashcards client:load />
</Layout>
```

### What's Missing

#### Complete Feature Gap

**No implementation exists for:**

1. **API Layer** (0/4 endpoints)
   - `GET /api/learning-sessions` - Fetch due cards
   - `POST /api/learning-sessions/responses` - Submit ratings
   - `GET /api/reviews` - List reviews
   - `POST /api/reviews` - Create review

2. **Service Layer** (0/1 services)
   - `ReviewsService` - Core business logic

3. **UI Components** (0/6 components)
   - `StudySession.tsx` - Main container
   - `CardViewer.tsx` - Flip card display
   - `RatingButtons.tsx` - Quality ratings (1-5)
   - `StudyProgress.tsx` - Session progress
   - `StudyComplete.tsx` - Completion screen
   - `EmptyStudyState.tsx` - No cards due

4. **Page** (0/1 pages)
   - `src/pages/study/index.astro`

5. **Hooks** (0/2 hooks)
   - `useStudySession.ts` - Fetch due cards
   - `useSubmitReview.ts` - Submit ratings

6. **Navigation**
   - No `/study` link in header
   - No route protection configured

7. **SRS Algorithm**
   - No library installed
   - No scheduling logic

---

## Gap Analysis

### Critical Gaps

| Component          | Required           | Current | Gap  | Priority |
| ------------------ | ------------------ | ------- | ---- | -------- |
| **SRS Library**    | ts-fsrs or similar | None    | 100% | Critical |
| **ReviewsService** | Full service       | None    | 100% | Critical |
| **API Endpoints**  | 4 endpoints        | 0       | 100% | Critical |
| **Study Page**     | /study page        | None    | 100% | High     |
| **UI Components**  | 6 components       | 0       | 100% | High     |
| **React Hooks**    | 2 hooks            | 0       | 100% | High     |
| **Navigation**     | Study link         | None    | 100% | Medium   |
| **E2E Tests**      | Full coverage      | None    | 100% | Medium   |

### Technical Debt Considerations

**Current System Strengths:**

- Well-structured service layer
- Consistent error handling
- Type safety throughout
- Good test coverage patterns

**Potential Issues:**

- No SRS library evaluated/selected yet
- Algorithm configuration needs design
- Review history queries may need optimization
- Card scheduling complexity not addressed

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Study Session Flow                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│  User clicks │─────▶│  Load due    │─────▶│  Display     │
│  "Study"     │      │  flashcards  │      │  first card  │
│              │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
                                                    │
                                                    ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│  Calculate   │◀─────│  Submit      │◀─────│  User rates  │
│  next due    │      │  rating      │      │  recall (1-5)│
│              │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│  Show next   │─────▶│  Continue    │─Yes─▶│  Repeat      │
│  card        │      │  session?    │      │              │
│              │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
                             │
                             │ No
                             ▼
                      ┌──────────────┐
                      │              │
                      │  Session     │
                      │  Complete    │
                      │              │
                      └──────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Astro + React)            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /study (Astro Page)                                        │
│  └─ StudySession.tsx (React Component)                      │
│     ├─ useStudySession() - Fetch due cards                  │
│     ├─ useSubmitReview() - Submit ratings                   │
│     │                                                         │
│     ├─ StudyProgress.tsx - Progress indicator               │
│     ├─ CardViewer.tsx - Flip card display                   │
│     ├─ RatingButtons.tsx - Quality ratings (1-5)            │
│     ├─ StudyComplete.tsx - Completion screen                │
│     └─ EmptyStudyState.tsx - No cards due message           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Astro SSR)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GET  /api/learning-sessions      - Fetch due cards         │
│  POST /api/learning-sessions/responses - Submit ratings     │
│  GET  /api/reviews                - List reviews            │
│  POST /api/reviews                - Create review           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Calls
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer (TypeScript)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ReviewsService                                              │
│  ├─ getDueFlashcards() - Query due cards                    │
│  ├─ createReview() - Record review                          │
│  ├─ calculateNextDue() - SRS algorithm                      │
│  └─ getReviewHistory() - Fetch history                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Queries
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer (Supabase)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  flashcards table - Card content                             │
│  reviews table - Review history & scheduling                 │
│                                                              │
│  RLS policies enforce user_id = auth.uid()                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Implementation

### Schema Analysis

The existing `reviews` table is production-ready. No migrations needed.

**Key Fields:**

```typescript
interface Review {
  id: string; // UUID primary key
  user_id: string; // References auth.users
  flashcard_id: string; // References flashcards
  rating: number; // 1-5 quality rating
  reviewed_at: Date; // Timestamp of review
  next_due: Date; // Next review date (SRS)
  deleted_at: Date | null; // Soft delete
}
```

### Query Patterns

#### 1. Get Due Flashcards

```typescript
// Get all flashcards due for review
const { data, error } = await supabase
  .from("flashcards")
  .select(
    `
    id,
    front,
    back,
    reviews (
      reviewed_at,
      next_due,
      rating
    )
  `
  )
  .eq("user_id", userId)
  .is("deleted_at", null)
  .is("ai_session_id", null) // Only accepted flashcards
  .or(`reviews.is.null,reviews.next_due.lte.${now}`)
  .order("created_at", { ascending: true })
  .limit(20);
```

**Explanation:**

- Fetch flashcards with no reviews OR reviews due now/in past
- Limit to 20 cards per session (configurable)
- Order by creation date (older cards first)
- Only accepted flashcards (not candidates)

#### 2. Get Review History

```typescript
// Get review history for a flashcard
const { data, error } = await supabase
  .from("reviews")
  .select("*")
  .eq("user_id", userId)
  .eq("flashcard_id", flashcardId)
  .is("deleted_at", null)
  .order("reviewed_at", { ascending: false });
```

#### 3. Create Review

```typescript
// Record a new review
const { data, error } = await supabase
  .from("reviews")
  .insert({
    user_id: userId,
    flashcard_id: flashcardId,
    rating: rating,
    reviewed_at: new Date(),
    next_due: calculatedNextDue, // From SRS algorithm
  })
  .select()
  .single();
```

### Performance Considerations

**Current Indexes:**

- ✅ `idx_reviews_user_id` - User filtering
- ✅ `idx_reviews_flashcard_id` - Card lookup
- ✅ `idx_reviews_next_due` - Due date queries

**Potential Optimizations:**

- Composite index on `(user_id, next_due)` for due card queries
- Materialized view for card statistics (optional)
- Partition reviews table by date (future, if millions of reviews)

**Recommended Migration:**

```sql
-- Add composite index for due cards query optimization
create index idx_reviews_user_next_due
  on reviews(user_id, next_due)
  where deleted_at is null;
```

---

## API Endpoints Design

Following the API plan and existing patterns, implement 4 endpoints.

### 1. GET /api/learning-sessions

**Purpose:** Fetch flashcards due for review

**Request:**

```http
GET /api/learning-sessions?limit=20
```

**Query Parameters:**

- `limit` (optional, default: 20, max: 50) - Number of cards to fetch

**Response 200:**

```json
{
  "cards": [
    {
      "flashcard_id": "uuid",
      "front": "Question text",
      "back": "Answer text",
      "review_count": 3,
      "last_reviewed_at": "2025-12-10T10:30:00Z",
      "ease_factor": 2.5
    }
  ],
  "total_due": 45
}
```

**Errors:**

- `401` - Unauthorized (no session)
- `500` - Server error

**Implementation:**

```typescript
// src/pages/api/learning-sessions.ts
import type { APIContext } from "astro";
import { reviewsService } from "@/lib/services/reviews.service";

export async function GET(context: APIContext) {
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(context.request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    const result = await reviewsService.getDueFlashcards(supabase, user.id, limit);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch learning session:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch learning session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

### 2. POST /api/learning-sessions/responses

**Purpose:** Submit review ratings for multiple cards

**Request:**

```http
POST /api/learning-sessions/responses
Content-Type: application/json

{
  "responses": [
    {
      "flashcard_id": "uuid",
      "rating": 4
    }
  ]
}
```

**Validation:**

- `responses` - Required, array, max 50 items
- `flashcard_id` - Required, valid UUID
- `rating` - Required, integer 1-5

**Response 200:**

```json
{
  "reviews": [
    {
      "id": "uuid",
      "flashcard_id": "uuid",
      "rating": 4,
      "reviewed_at": "2025-12-12T10:30:00Z",
      "next_due": "2025-12-15T10:30:00Z"
    }
  ]
}
```

**Errors:**

- `400` - Validation error
- `401` - Unauthorized
- `500` - Server error

**Implementation:**

```typescript
// src/pages/api/learning-sessions/responses.ts
import type { APIContext } from "astro";
import { reviewsService } from "@/lib/services/reviews.service";
import { submitResponsesSchema } from "@/lib/schemas/reviews.schemas";

export async function POST(context: APIContext) {
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await context.request.json();

    // Validate request
    const validation = submitResponsesSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await reviewsService.submitResponses(supabase, user.id, validation.data.responses);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to submit responses:", error);
    return new Response(JSON.stringify({ message: "Failed to submit responses" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

### 3. GET /api/reviews

**Purpose:** List review history (for analytics/stats)

**Request:**

```http
GET /api/reviews?flashcard_id=uuid&limit=50&offset=0
```

**Query Parameters:**

- `flashcard_id` (optional) - Filter by flashcard
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response 200:**

```json
{
  "reviews": [
    {
      "id": "uuid",
      "flashcard_id": "uuid",
      "rating": 4,
      "reviewed_at": "2025-12-12T10:30:00Z",
      "next_due": "2025-12-15T10:30:00Z"
    }
  ],
  "total": 123
}
```

**Implementation:** Similar pattern to GET /api/flashcards

### 4. POST /api/reviews

**Purpose:** Create a single review (alternative to batch endpoint)

**Request:**

```http
POST /api/reviews
Content-Type: application/json

{
  "flashcard_id": "uuid",
  "rating": 4
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "flashcard_id": "uuid",
  "rating": 4,
  "reviewed_at": "2025-12-12T10:30:00Z",
  "next_due": "2025-12-15T10:30:00Z"
}
```

**Implementation:** Similar pattern to POST /api/flashcards

---

## Service Layer Design

### ReviewsService Implementation

**Location:** `src/lib/services/reviews.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { ReviewDto, CreateReviewCommand, LearningSessionItemDto, SubmitLearningResponsesCommand } from "@/types";
import { FSRS, Rating, Card, RecordLog } from "ts-fsrs";

/**
 * Service for managing reviews and spaced repetition scheduling
 */
export class ReviewsService {
  private fsrs: FSRS;

  constructor() {
    // Initialize FSRS with default parameters
    this.fsrs = new FSRS({
      // Default parameters (can be customized)
      w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
      request_retention: 0.9, // Target 90% retention
      maximum_interval: 36500, // Max 100 years
      enable_fuzz: true, // Add randomness to intervals
    });
  }

  /**
   * Get flashcards due for review
   */
  async getDueFlashcards(
    supabase: SupabaseClient,
    userId: string,
    limit: number = 20
  ): Promise<{
    cards: LearningSessionItemDto[];
    total_due: number;
  }> {
    const now = new Date().toISOString();

    // First, get count of total due cards
    const { count } = await supabase
      .from("flashcards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null)
      .is("ai_session_id", null);

    // Get flashcards with their latest review
    const { data: flashcards, error } = await supabase
      .from("flashcards")
      .select(
        `
        id,
        front,
        back,
        reviews!flashcard_id (
          reviewed_at,
          next_due,
          rating
        )
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .is("ai_session_id", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Filter cards that are due (no reviews OR next_due <= now)
    const dueCards = flashcards
      .filter((card) => {
        const reviews = card.reviews || [];
        if (reviews.length === 0) return true; // New cards are due

        // Get most recent review
        const latestReview = reviews.sort(
          (a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime()
        )[0];

        return new Date(latestReview.next_due) <= new Date(now);
      })
      .map((card) => ({
        flashcard_id: card.id,
        front: card.front,
        back: card.back,
        review_count: card.reviews?.length || 0,
        last_reviewed_at: card.reviews?.[0]?.reviewed_at || null,
      }));

    return {
      cards: dueCards,
      total_due: count || 0,
    };
  }

  /**
   * Submit review responses and calculate next due dates
   */
  async submitResponses(
    supabase: SupabaseClient,
    userId: string,
    responses: SubmitLearningResponsesCommand
  ): Promise<{ reviews: ReviewDto[] }> {
    const reviews: ReviewDto[] = [];

    for (const response of responses) {
      // Get flashcard's review history
      const { data: reviewHistory, error: historyError } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", userId)
        .eq("flashcard_id", response.flashcard_id)
        .is("deleted_at", null)
        .order("reviewed_at", { ascending: false });

      if (historyError) {
        throw historyError;
      }

      // Calculate next due date using FSRS
      const nextDue = this.calculateNextDue(reviewHistory || [], response.rating);

      // Create new review
      const { data: newReview, error: createError } = await supabase
        .from("reviews")
        .insert({
          user_id: userId,
          flashcard_id: response.flashcard_id,
          rating: response.rating,
          reviewed_at: new Date().toISOString(),
          next_due: nextDue.toISOString(),
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      reviews.push(newReview);
    }

    return { reviews };
  }

  /**
   * Calculate next due date using FSRS algorithm
   */
  private calculateNextDue(reviewHistory: ReviewDto[], rating: number): Date {
    // Map rating (1-5) to FSRS Rating enum
    const fsrsRating = this.mapRatingToFSRS(rating);

    // Create or update card state
    let card: Card;

    if (reviewHistory.length === 0) {
      // New card
      card = new Card();
    } else {
      // Reconstruct card state from history
      card = this.reconstructCardState(reviewHistory);
    }

    // Calculate scheduling
    const now = new Date();
    const schedulingCards = this.fsrs.repeat(card, now);

    // Get the scheduled card for the given rating
    const scheduledCard = schedulingCards[fsrsRating];

    return scheduledCard.due;
  }

  /**
   * Map 1-5 rating to FSRS Rating enum
   */
  private mapRatingToFSRS(rating: number): Rating {
    switch (rating) {
      case 1:
        return Rating.Again; // Complete blackout
      case 2:
        return Rating.Hard; // Incorrect, but remembered
      case 3:
        return Rating.Good; // Correct with hesitation
      case 4:
        return Rating.Easy; // Perfect recall
      case 5:
        return Rating.Easy; // Perfect recall (treat same as 4)
      default:
        return Rating.Good;
    }
  }

  /**
   * Reconstruct card state from review history
   */
  private reconstructCardState(reviewHistory: ReviewDto[]): Card {
    // Start with new card
    let card = new Card();

    // Replay review history
    for (const review of reviewHistory.reverse()) {
      const rating = this.mapRatingToFSRS(review.rating);
      const reviewDate = new Date(review.reviewed_at);
      const schedulingCards = this.fsrs.repeat(card, reviewDate);
      card = schedulingCards[rating].card;
    }

    return card;
  }

  /**
   * Get review statistics for a user
   */
  async getReviewStats(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{
    total_reviews: number;
    cards_reviewed_today: number;
    average_rating: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("reviews")
      .select("rating, reviewed_at")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (error) {
      throw error;
    }

    const todayReviews = data.filter((r) => new Date(r.reviewed_at) >= today);

    const avgRating = data.length > 0 ? data.reduce((sum, r) => sum + r.rating, 0) / data.length : 0;

    return {
      total_reviews: data.length,
      cards_reviewed_today: todayReviews.length,
      average_rating: Math.round(avgRating * 100) / 100,
    };
  }
}

export const reviewsService = new ReviewsService();
```

### Validation Schemas

**Location:** `src/lib/schemas/reviews.schemas.ts`

```typescript
import { z } from "zod";

export const submitResponsesSchema = z.object({
  responses: z
    .array(
      z.object({
        flashcard_id: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
      })
    )
    .min(1)
    .max(50),
});

export const createReviewSchema = z.object({
  flashcard_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
});

export type SubmitResponsesInput = z.infer<typeof submitResponsesSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
```

---

## UI Components Architecture

### Component Hierarchy

```
src/pages/study/index.astro
└─ StudySession.tsx (Main Container)
   ├─ StudyProgress.tsx
   ├─ CardViewer.tsx
   │  ├─ Card Front/Back
   │  └─ Flip Animation
   ├─ RatingButtons.tsx
   │  └─ Buttons (1-5)
   ├─ StudyComplete.tsx
   └─ EmptyStudyState.tsx
```

### 1. Study Page (Astro)

**Location:** `src/pages/study/index.astro`

```astro
---
import Layout from "@/layouts/Layout.astro";
import StudySession from "@/components/study/StudySession";

export const prerender = false;

// Authentication enforced by middleware
---

<Layout title="Study Session - 10xCards">
  <StudySession client:load />
</Layout>
```

### 2. StudySession Component (Main Container)

**Location:** `src/components/study/StudySession.tsx`

```typescript
import * as React from "react";
import { toast, Toaster } from "sonner";
import { useStudySession } from "@/lib/hooks/useStudySession";
import { useSubmitReview } from "@/lib/hooks/useSubmitReview";
import { StudyProgress } from "./StudyProgress";
import { CardViewer } from "./CardViewer";
import { RatingButtons } from "./RatingButtons";
import { StudyComplete } from "./StudyComplete";
import { EmptyStudyState } from "./EmptyStudyState";
import { Loader2 } from "lucide-react";

export default function StudySession() {
  const { cards, totalDue, isLoading, error, refetch } = useStudySession();
  const { submitReview, isSubmitting } = useSubmitReview();

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [reviewedCount, setReviewedCount] = React.useState(0);

  // Show error toast
  React.useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Handle rating submission
  const handleRating = async (rating: number) => {
    const currentCard = cards[currentIndex];

    try {
      await submitReview({
        flashcard_id: currentCard.flashcard_id,
        rating,
      });

      setReviewedCount((prev) => prev + 1);

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        // Session complete - could refetch to get more cards
        await refetch();
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to save review. Please try again.");
    }
  };

  // Handle card flip
  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isSubmitting) return;

      // Space = flip card
      if (e.code === "Space" && !isFlipped) {
        e.preventDefault();
        handleFlip();
        return;
      }

      // 1-5 = rating (only when flipped)
      if (isFlipped && ["1", "2", "3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        handleRating(parseInt(e.key));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isFlipped, isSubmitting, currentIndex]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No cards to review
  if (!isLoading && cards.length === 0) {
    return (
      <>
        <EmptyStudyState />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Session complete (reviewed all loaded cards)
  if (reviewedCount >= cards.length) {
    return (
      <>
        <StudyComplete
          reviewedCount={reviewedCount}
          onContinue={() => {
            setReviewedCount(0);
            setCurrentIndex(0);
            refetch();
          }}
        />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="container mx-auto py-8 px-4 md:max-w-3xl">
      <StudyProgress
        current={currentIndex + 1}
        total={cards.length}
        totalDue={totalDue}
      />

      <div className="mt-8">
        <CardViewer
          front={currentCard.front}
          back={currentCard.back}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </div>

      <div className="mt-8">
        {isFlipped ? (
          <RatingButtons
            onRate={handleRating}
            disabled={isSubmitting}
          />
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Click card or press Space to reveal answer
          </div>
        )}
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}
```

### 3. CardViewer Component

**Location:** `src/components/study/CardViewer.tsx`

```typescript
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardViewerProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export function CardViewer({ front, back, isFlipped, onFlip }: CardViewerProps) {
  return (
    <div className="perspective-1000">
      <Card
        onClick={onFlip}
        className={cn(
          "cursor-pointer transition-transform duration-500 transform-style-preserve-3d min-h-[300px]",
          isFlipped && "rotate-y-180"
        )}
      >
        <CardContent className="p-8">
          {!isFlipped ? (
            <div className="flex flex-col items-center justify-center min-h-[250px]">
              <div className="text-sm text-muted-foreground mb-4">Question</div>
              <div className="text-xl text-center">{front}</div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[250px] rotate-y-180">
              <div className="text-sm text-muted-foreground mb-4">Answer</div>
              <div className="text-xl text-center">{back}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4. RatingButtons Component

**Location:** `src/components/study/RatingButtons.tsx`

```typescript
import * as React from "react";
import { Button } from "@/components/ui/button";

interface RatingButtonsProps {
  onRate: (rating: number) => void;
  disabled?: boolean;
}

const RATINGS = [
  { value: 1, label: "Again", description: "Complete blackout", color: "bg-red-500 hover:bg-red-600" },
  { value: 2, label: "Hard", description: "Incorrect recall", color: "bg-orange-500 hover:bg-orange-600" },
  { value: 3, label: "Good", description: "Correct with effort", color: "bg-yellow-500 hover:bg-yellow-600" },
  { value: 4, label: "Easy", description: "Perfect recall", color: "bg-green-500 hover:bg-green-600" },
];

export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-muted-foreground mb-4">
        How well did you recall this card?
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {RATINGS.map((rating) => (
          <Button
            key={rating.value}
            onClick={() => onRate(rating.value)}
            disabled={disabled}
            className={cn(
              "flex flex-col h-auto py-4 text-white",
              rating.color
            )}
          >
            <div className="text-lg font-bold mb-1">{rating.label}</div>
            <div className="text-xs opacity-90">{rating.description}</div>
            <div className="text-xs mt-2 opacity-75">Press {rating.value}</div>
          </Button>
        ))}
      </div>
    </div>
  );
}
```

### 5. StudyProgress Component

**Location:** `src/components/study/StudyProgress.tsx`

```typescript
import * as React from "react";
import { Progress } from "@/components/ui/progress";

interface StudyProgressProps {
  current: number;
  total: number;
  totalDue: number;
}

export function StudyProgress({ current, total, totalDue }: StudyProgressProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Card {current} of {total}
        </span>
        <span>{totalDue} cards due today</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
```

### 6. EmptyStudyState Component

**Location:** `src/components/study/EmptyStudyState.tsx`

```typescript
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function EmptyStudyState() {
  return (
    <div className="container mx-auto py-16 px-4 md:max-w-2xl">
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2">You're All Caught Up!</h2>
          <p className="text-muted-foreground mb-6">
            No flashcards are due for review right now. Great work!
          </p>
          <div className="space-x-4">
            <Button asChild>
              <a href="/flashcards">View My Flashcards</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/generate">Generate More Cards</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 7. StudyComplete Component

**Location:** `src/components/study/StudyComplete.tsx`

```typescript
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface StudyCompleteProps {
  reviewedCount: number;
  onContinue: () => void;
}

export function StudyComplete({ reviewedCount, onContinue }: StudyCompleteProps) {
  return (
    <div className="container mx-auto py-16 px-4 md:max-w-2xl">
      <Card>
        <CardContent className="p-12 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
          <p className="text-muted-foreground mb-6">
            You reviewed {reviewedCount} card{reviewedCount !== 1 ? "s" : ""}.
          </p>
          <div className="space-x-4">
            <Button onClick={onContinue}>Continue Studying</Button>
            <Button variant="outline" asChild>
              <a href="/flashcards">View My Flashcards</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Spaced Repetition Algorithm

### Library Selection: ts-fsrs

**Recommendation:** Use `ts-fsrs` (Free Spaced Repetition Scheduler)

**Rationale:**

- TypeScript native (type safety)
- Based on FSRS algorithm (modern, scientifically validated)
- MIT licensed (open source)
- Active maintenance
- Better than SM-2 (Anki's original algorithm)
- No dependencies

**Installation:**

```bash
npm install ts-fsrs
```

**Algorithm Overview:**

FSRS (Free Spaced Repetition Scheduler) uses:

- **Difficulty** - How hard the card is to remember
- **Stability** - How well the memory has been consolidated
- **Retrievability** - Probability of successful recall

**Key Parameters:**

```typescript
{
  request_retention: 0.9,    // Target 90% retention
  maximum_interval: 36500,    // Max 100 years
  enable_fuzz: true,          // Add randomness to prevent clustering
  w: [...],                   // 17 weights (can be trained)
}
```

### Integration Example

See `ReviewsService` implementation above for full integration.

**Key Methods:**

```typescript
// Create new card
const card = new Card();

// Schedule review
const now = new Date();
const scheduling = fsrs.repeat(card, now);

// Get next due date based on rating
const nextCard = scheduling[Rating.Good];
console.log(nextCard.due); // Next review date
```

### Rating Scale Mapping

| User Rating | Description            | FSRS Rating  | Typical Interval |
| ----------- | ---------------------- | ------------ | ---------------- |
| 1 - Again   | Complete blackout      | Rating.Again | ~10 minutes      |
| 2 - Hard    | Incorrect but familiar | Rating.Hard  | ~1-2 days        |
| 3 - Good    | Correct with effort    | Rating.Good  | ~3-7 days        |
| 4 - Easy    | Perfect recall         | Rating.Easy  | ~14+ days        |

---

## Testing Strategy

### Test Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** All API endpoints
- **E2E Tests:** Critical user flows
- **Performance Tests:** Response times <200ms

### Unit Tests (Vitest)

#### 1. ReviewsService Tests

**Location:** `src/lib/services/reviews.service.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { reviewsService } from "./reviews.service";
import { createMockSupabaseClient } from "@/test/mocks";

describe("ReviewsService", () => {
  describe("getDueFlashcards", () => {
    it("should return flashcards with no reviews", async () => {
      const mockSupabase = createMockSupabaseClient({
        flashcards: [{ id: "1", front: "Q1", back: "A1", reviews: [] }],
      });

      const result = await reviewsService.getDueFlashcards(mockSupabase, "user-123", 20);

      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].flashcard_id).toBe("1");
    });

    it("should return flashcards with due reviews", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockSupabase = createMockSupabaseClient({
        flashcards: [
          {
            id: "1",
            front: "Q1",
            back: "A1",
            reviews: [{ next_due: pastDate.toISOString() }],
          },
        ],
      });

      const result = await reviewsService.getDueFlashcards(mockSupabase, "user-123", 20);

      expect(result.cards).toHaveLength(1);
    });

    it("should not return flashcards not yet due", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockSupabase = createMockSupabaseClient({
        flashcards: [
          {
            id: "1",
            front: "Q1",
            back: "A1",
            reviews: [{ next_due: futureDate.toISOString() }],
          },
        ],
      });

      const result = await reviewsService.getDueFlashcards(mockSupabase, "user-123", 20);

      expect(result.cards).toHaveLength(0);
    });
  });

  describe("calculateNextDue", () => {
    it("should calculate correct interval for new card", () => {
      const result = reviewsService["calculateNextDue"]([], 3);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });

    it("should increase interval for good ratings", () => {
      const review1 = reviewsService["calculateNextDue"]([], 3);
      const review2 = reviewsService["calculateNextDue"]([{ rating: 3, reviewed_at: new Date() }], 3);

      expect(review2.getTime()).toBeGreaterThan(review1.getTime());
    });
  });
});
```

### Integration Tests (API)

**Location:** `src/pages/api/learning-sessions.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { GET } from "./learning-sessions";
import { createMockAPIContext } from "@/test/mocks";

describe("GET /api/learning-sessions", () => {
  it("should return 401 for unauthenticated requests", async () => {
    const context = createMockAPIContext({ user: null });
    const response = await GET(context);

    expect(response.status).toBe(401);
  });

  it("should return due flashcards for authenticated user", async () => {
    const context = createMockAPIContext({
      user: { id: "user-123" },
      flashcards: [{ id: "1", front: "Q1", back: "A1", reviews: [] }],
    });

    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cards).toHaveLength(1);
  });

  it("should respect limit parameter", async () => {
    const context = createMockAPIContext({
      user: { id: "user-123" },
      url: "http://localhost/api/learning-sessions?limit=5",
      flashcards: Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `${i}`,
          front: `Q${i}`,
          back: `A${i}`,
          reviews: [],
        })),
    });

    const response = await GET(context);
    const data = await response.json();

    expect(data.cards.length).toBeLessThanOrEqual(5);
  });
});
```

### E2E Tests (Playwright)

**Location:** `tests/e2e/study-session.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { loginAsTestUser, createTestFlashcard } from "./helpers";

test.describe("Study Session", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("should display empty state when no cards are due", async ({ page }) => {
    await page.goto("/study");

    await expect(page.getByText("You're All Caught Up!")).toBeVisible();
  });

  test("should display flashcard for review", async ({ page }) => {
    // Create a flashcard
    await createTestFlashcard(page, {
      front: "What is 2+2?",
      back: "4",
    });

    await page.goto("/study");

    // Should show question
    await expect(page.getByText("What is 2+2?")).toBeVisible();
    await expect(page.getByText("4")).not.toBeVisible();
  });

  test("should flip card on click", async ({ page }) => {
    await createTestFlashcard(page, {
      front: "What is 2+2?",
      back: "4",
    });

    await page.goto("/study");

    // Click to flip
    await page.click('[data-testid="card-viewer"]');

    // Should show answer
    await expect(page.getByText("4")).toBeVisible();
  });

  test("should submit rating and move to next card", async ({ page }) => {
    await createTestFlashcard(page, { front: "Q1", back: "A1" });
    await createTestFlashcard(page, { front: "Q2", back: "A2" });

    await page.goto("/study");

    // Flip card
    await page.click('[data-testid="card-viewer"]');

    // Rate as "Good"
    await page.click('[data-testid="rating-button-3"]');

    // Should show next card
    await expect(page.getByText("Q2")).toBeVisible();
  });

  test("should show completion screen after reviewing all cards", async ({ page }) => {
    await createTestFlashcard(page, { front: "Q1", back: "A1" });

    await page.goto("/study");

    // Review the card
    await page.click('[data-testid="card-viewer"]');
    await page.click('[data-testid="rating-button-3"]');

    // Should show completion
    await expect(page.getByText("Session Complete!")).toBeVisible();
  });

  test("should support keyboard shortcuts", async ({ page }) => {
    await createTestFlashcard(page, { front: "Q1", back: "A1" });

    await page.goto("/study");

    // Press Space to flip
    await page.keyboard.press("Space");
    await expect(page.getByText("A1")).toBeVisible();

    // Press 3 to rate
    await page.keyboard.press("3");

    // Should move to next/complete
    await expect(page.getByText(/Session Complete|Q2/)).toBeVisible();
  });
});
```

### Performance Tests

**Location:** `tests/performance/study-session.perf.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Study Session Performance", () => {
  test("should load due cards in <500ms", async ({ page }) => {
    const start = Date.now();

    await page.goto("/study");
    await page.waitForSelector('[data-testid="card-viewer"]');

    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(500);
  });

  test("should submit rating in <200ms", async ({ page }) => {
    await page.goto("/study");
    await page.click('[data-testid="card-viewer"]');

    const start = Date.now();
    await page.click('[data-testid="rating-button-3"]');
    await page.waitForResponse("/api/learning-sessions/responses");

    const responseTime = Date.now() - start;
    expect(responseTime).toBeLessThan(200);
  });
});
```

---

## Implementation Phases

### Phase 1: Foundation (Days 1-2)

**Goal:** Set up infrastructure and core service layer

**Tasks:**

1. Install `ts-fsrs` package
2. Create `ReviewsService` with FSRS integration
3. Implement scheduling logic
4. Create validation schemas
5. Add TypeScript types (if missing)
6. Write unit tests for service layer

**Deliverables:**

- ✅ ReviewsService fully tested
- ✅ FSRS algorithm integrated
- ✅ 80%+ test coverage

### Phase 2: API Layer (Days 2-3)

**Goal:** Implement all API endpoints

**Tasks:**

1. Create `GET /api/learning-sessions`
2. Create `POST /api/learning-sessions/responses`
3. Create `GET /api/reviews` (optional)
4. Create `POST /api/reviews` (optional)
5. Add error handling
6. Write integration tests

**Deliverables:**

- ✅ 4 API endpoints functional
- ✅ All endpoints tested
- ✅ Error handling implemented

### Phase 3: UI Components (Days 4-5)

**Goal:** Build all React components

**Tasks:**

1. Create `CardViewer.tsx` with flip animation
2. Create `RatingButtons.tsx`
3. Create `StudyProgress.tsx`
4. Create `EmptyStudyState.tsx`
5. Create `StudyComplete.tsx`
6. Add CSS animations
7. Write component tests

**Deliverables:**

- ✅ 6 components completed
- ✅ Responsive design
- ✅ Accessibility support

### Phase 4: Main Container & Hooks (Days 6-7)

**Goal:** Integrate components and create hooks

**Tasks:**

1. Create `useStudySession.ts` hook
2. Create `useSubmitReview.ts` hook
3. Create `StudySession.tsx` container
4. Implement keyboard shortcuts
5. Add loading/error states
6. Write hook tests

**Deliverables:**

- ✅ Hooks functional
- ✅ Container component complete
- ✅ User interactions working

### Phase 5: Page & Navigation (Day 7)

**Goal:** Create study page and add navigation

**Tasks:**

1. Create `src/pages/study/index.astro`
2. Add `/study` link to header
3. Update middleware for route protection
4. Test navigation flow

**Deliverables:**

- ✅ Study page accessible
- ✅ Navigation working
- ✅ Route protection active

### Phase 6: Testing & Polish (Days 8-9)

**Goal:** Comprehensive testing and UX improvements

**Tasks:**

1. Write E2E tests for all user flows
2. Test keyboard shortcuts
3. Test error scenarios
4. Performance testing
5. Accessibility audit
6. UI/UX polish
7. Documentation

**Deliverables:**

- ✅ Full E2E test coverage
- ✅ Performance targets met
- ✅ Accessibility compliant
- ✅ Documentation complete

### Phase 7: Production Deployment (Day 10)

**Goal:** Deploy to production

**Tasks:**

1. Final code review
2. Check database migrations
3. Update environment variables
4. Deploy to Cloudflare Pages
5. Monitor errors
6. User acceptance testing

**Deliverables:**

- ✅ Production deployment
- ✅ Monitoring active
- ✅ Feature live

---

## Security Considerations

### Authentication & Authorization

**Implemented:**

- ✅ JWT-based authentication via Supabase
- ✅ RLS policies on `reviews` table
- ✅ Middleware enforces authentication

**Additional Measures:**

1. **API Endpoint Security:**

```typescript
// Always verify user authentication
export async function GET(context: APIContext) {
  const user = context.locals.user;

  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  // Proceed with user.id
}
```

2. **Input Validation:**

```typescript
// Use Zod schemas for all inputs
const validation = submitResponsesSchema.safeParse(body);
if (!validation.success) {
  return errorResponse(400, validation.error);
}
```

3. **Rate Limiting:**
   - Consider adding rate limiting on review submissions
   - Prevent abuse (e.g., 1000 reviews/minute)
   - Use Cloudflare Workers rate limiting

4. **Data Access:**
   - Always filter by `user_id`
   - Never trust client-side flashcard IDs
   - Verify ownership before operations

### Potential Vulnerabilities

| Threat                            | Mitigation                          |
| --------------------------------- | ----------------------------------- |
| **Mass review submission**        | Rate limit API endpoints            |
| **Unauthorized flashcard access** | Verify user_id in queries           |
| **SQL injection**                 | Use Supabase query builder (safe)   |
| **XSS in flashcard content**      | Sanitize on display (React escapes) |
| **CSRF**                          | Use Supabase JWT (stateless)        |

---

## Performance Optimization

### Database Optimization

**Current Indexes:**

```sql
create index idx_reviews_user_id on reviews(user_id);
create index idx_reviews_flashcard_id on reviews(flashcard_id);
create index idx_reviews_next_due on reviews(next_due);
```

**Recommended Addition:**

```sql
-- Composite index for due cards query
create index idx_reviews_user_next_due
  on reviews(user_id, next_due)
  where deleted_at is null;
```

### Query Optimization

**Efficient Due Cards Query:**

```typescript
// Avoid N+1 queries - use single join
const { data } = await supabase
  .from("flashcards")
  .select(
    `
    id,
    front,
    back,
    reviews!inner (
      next_due,
      reviewed_at
    )
  `
  )
  .eq("user_id", userId)
  .lte("reviews.next_due", now)
  .limit(20);
```

### Caching Strategy

**Client-Side:**

- Cache due cards for session duration
- Optimistic UI updates
- Local state management

**Server-Side:**

- Consider Redis for high-traffic scenarios
- Cache user statistics
- Cache FSRS parameters

### Frontend Performance

**Code Splitting:**

```typescript
// Lazy load study components
const StudySession = React.lazy(() => import("./StudySession"));
```

**Memoization:**

```typescript
// Memoize expensive calculations
const cardStats = React.useMemo(() => {
  return calculateStats(reviews);
}, [reviews]);
```

### Performance Targets

| Metric                  | Target | Current |
| ----------------------- | ------ | ------- |
| **API Response Time**   | <200ms | TBD     |
| **Page Load Time**      | <1s    | TBD     |
| **Card Flip Animation** | 60 FPS | TBD     |
| **Database Query Time** | <50ms  | TBD     |

---

## Production Readiness Checklist

### Development

- [ ] All TypeScript types defined
- [ ] Service layer implemented
- [ ] API endpoints created
- [ ] UI components built
- [ ] React hooks created
- [ ] Page created
- [ ] Navigation added

### Testing

- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests (all endpoints)
- [ ] E2E tests (critical flows)
- [ ] Performance tests
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

### Security

- [ ] Authentication enforced
- [ ] Authorization implemented
- [ ] Input validation complete
- [ ] RLS policies active
- [ ] Rate limiting configured
- [ ] Security audit passed

### Performance

- [ ] Database indexes optimized
- [ ] Queries efficient
- [ ] Response times <200ms
- [ ] Page load <1s
- [ ] No memory leaks
- [ ] Code splitting implemented

### Documentation

- [ ] API documentation updated
- [ ] Component documentation
- [ ] User guide created
- [ ] Developer documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

### Deployment

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Cloudflare Pages deployment
- [ ] Error monitoring active
- [ ] Analytics tracking
- [ ] Rollback plan ready

### Post-Launch

- [ ] User feedback collected
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] Usage analytics
- [ ] A/B testing (optional)
- [ ] Iteration planning

---

## Appendix A: File Structure

```
10xCards/
├── src/
│   ├── pages/
│   │   ├── study/
│   │   │   └── index.astro                    # NEW: Study page
│   │   └── api/
│   │       ├── learning-sessions.ts           # NEW: Get due cards
│   │       ├── learning-sessions/
│   │       │   └── responses.ts               # NEW: Submit ratings
│   │       └── reviews.ts                     # NEW: Review CRUD
│   ├── components/
│   │   └── study/                             # NEW: Study components
│   │       ├── StudySession.tsx
│   │       ├── CardViewer.tsx
│   │       ├── RatingButtons.tsx
│   │       ├── StudyProgress.tsx
│   │       ├── StudyComplete.tsx
│   │       └── EmptyStudyState.tsx
│   ├── lib/
│   │   ├── services/
│   │   │   └── reviews.service.ts             # NEW: Reviews service
│   │   ├── hooks/
│   │   │   ├── useStudySession.ts             # NEW: Study session hook
│   │   │   └── useSubmitReview.ts             # NEW: Submit review hook
│   │   └── schemas/
│   │       └── reviews.schemas.ts             # NEW: Validation schemas
│   └── types.ts                               # UPDATE: Add missing types
├── tests/
│   ├── unit/
│   │   └── reviews.service.test.ts            # NEW: Service tests
│   ├── integration/
│   │   └── learning-sessions.test.ts          # NEW: API tests
│   └── e2e/
│       └── study-session.spec.ts              # NEW: E2E tests
└── package.json                               # UPDATE: Add ts-fsrs
```

---

## Appendix B: Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "ts-fsrs": "^3.0.0"
  }
}
```

### Install Command

```bash
npm install ts-fsrs
```

---

## Appendix C: Database Migration (Optional)

If adding composite index:

```sql
-- Migration: Add composite index for due cards query
-- File: supabase/migrations/20251212000001_add_reviews_composite_index.sql

create index if not exists idx_reviews_user_next_due
  on reviews(user_id, next_due)
  where deleted_at is null;
```

---

## Conclusion

This comprehensive analysis provides a complete roadmap for implementing the Learning Session feature (US-010) in a production-ready manner. The implementation follows existing patterns, adheres to best practices, and ensures:

- **Type Safety:** Full TypeScript coverage
- **Security:** RLS, authentication, validation
- **Performance:** Optimized queries, caching
- **Testing:** 80%+ coverage, E2E tests
- **UX:** Responsive, accessible, intuitive
- **Maintainability:** Clean architecture, documentation

**Estimated Timeline:** 9-12 days for complete production-ready implementation.

**Next Steps:**

1. Review and approve this plan
2. Create implementation tickets
3. Begin Phase 1 (Foundation)
4. Iterate through phases
5. Deploy to production

---

**Document Prepared By:** Claude Code
**Date:** 2025-12-12
**Version:** 1.0
**Status:** Ready for Implementation
