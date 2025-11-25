# Flashcard Lifecycle & State Management

## Overview

This document explains how flashcards move through different states in the 10xCards application and how the system distinguishes between candidates, active flashcards, and rejected cards.

## Design Decision: Using `ai_session_id` as State Indicator

Instead of adding a separate `status` column, we use the existing `ai_session_id` field to track flashcard state:

- **Candidates** (under review): `ai_session_id != null`
- **Active flashcards** (ready for study): `ai_session_id = null`
- **Rejected** (soft deleted): `deleted_at != null`

### Why This Approach?

✅ **No migration needed** - Works with existing schema  
✅ **Natural semantics** - Linked to session = still a candidate  
✅ **Clear separation** - Simple to query different states  
✅ **Audit trail** - Session link preserved in event logs  
✅ **Works with triggers** - No conflict with `updated_at` auto-update

## Flashcard States

### State 1: Candidate (Under Review)

**Database State:**
```
ai_session_id: <uuid>
deleted_at: null
source: 'ai'
```

**Where it appears:**
- ❌ NOT in "My Flashcards" view
- ✅ In "Review Candidates" view (to be built)
- ✅ Via `/api/ai-sessions/{sessionId}/candidates` endpoint

**How it's created:**
```typescript
POST /api/ai-sessions
// Creates session + generates candidates with ai_session_id set
```

**User actions available:**
- Accept → Moves to State 2
- Edit → Moves to State 2
- Reject → Moves to State 3

---

### State 2: Active Flashcard (Ready for Study)

**Database State:**
```
ai_session_id: null
deleted_at: null
source: 'ai' or 'manual'
```

**Where it appears:**
- ✅ In "My Flashcards" view
- ✅ In study sessions
- ✅ Via `/api/flashcards` endpoint

**How it's created:**

**Option A - From Candidate (Accept):**
```typescript
POST /api/ai-sessions/{sessionId}/candidates/actions
{
  "actions": [
    { "candidate_id": "uuid", "action": "accept" }
  ]
}
// Clears ai_session_id → graduates to active
```

**Option B - From Candidate (Edit):**
```typescript
POST /api/ai-sessions/{sessionId}/candidates/actions
{
  "actions": [
    { 
      "candidate_id": "uuid", 
      "action": "edit",
      "edited_front": "...",
      "edited_back": "..."
    }
  ]
}
// Updates content + clears ai_session_id → graduates to active
```

**Option C - Manual Creation:**
```typescript
POST /api/flashcards
{
  "front": "...",
  "back": "...",
  "source": "manual"
}
// Created with ai_session_id = null (already active)
```

**User actions available:**
- Edit content → Stays in State 2
- Delete → Moves to State 3

---

### State 3: Rejected/Deleted (Hidden)

**Database State:**
```
ai_session_id: <uuid> or null (depends on how it was deleted)
deleted_at: <timestamp>
source: 'ai' or 'manual'
```

**Where it appears:**
- ❌ NOT in "My Flashcards" view
- ❌ NOT in "Review Candidates" view
- ❌ NOT in study sessions
- ✅ Still in database (soft delete for audit)

**How it's created:**

**Option A - Reject Candidate:**
```typescript
POST /api/ai-sessions/{sessionId}/candidates/actions
{
  "actions": [
    { "candidate_id": "uuid", "action": "reject" }
  ]
}
// Sets deleted_at, keeps ai_session_id for audit
```

**Option B - Delete Active Flashcard:**
```typescript
DELETE /api/flashcards/{id}
// Sets deleted_at
```

**User actions available:**
- None (soft deleted, preserved for audit)

---

## Query Patterns

### Get Candidates for Review
```typescript
supabase
  .from("flashcards")
  .select("*")
  .eq("ai_session_id", sessionId)
  .is("deleted_at", null)
```

### Get Active Flashcards (My Flashcards)
```typescript
supabase
  .from("flashcards")
  .select("*")
  .eq("user_id", userId)
  .is("ai_session_id", null)  // Only processed/manual
  .is("deleted_at", null)
```

### Get All Flashcards from a Session (Including Processed)
```sql
-- Not possible after acceptance since ai_session_id is cleared
-- Use event_logs for historical tracking:
SELECT DISTINCT flashcard_id 
FROM event_logs 
WHERE ai_session_id = '<session-id>' 
  AND event_type LIKE 'candidates_accepted%';
```

---

## State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│                    FLASHCARD LIFECYCLE                       │
└─────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  AI Generation   │
    │  POST /ai-sessions│
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │   CANDIDATE      │  ai_session_id: <uuid>
    │  (Under Review)  │  deleted_at: null
    └────────┬─────────┘
             │
        ┌────┴────┬────────────┐
        │         │            │
        ▼         ▼            ▼
    Accept     Edit        Reject
        │         │            │
        │         │            ▼
        │         │    ┌──────────────┐
        │         │    │   REJECTED   │  deleted_at: <timestamp>
        │         │    │  (Hidden)    │  ai_session_id: <uuid>
        │         │    └──────────────┘
        │         │
        └────┬────┘
             │
             ▼
    ┌──────────────────┐
    │  ACTIVE          │  ai_session_id: null
    │  (My Flashcards) │  deleted_at: null
    └────────┬─────────┘
             │
             │ Delete
             ▼
    ┌──────────────────┐
    │   DELETED        │  deleted_at: <timestamp>
    │   (Hidden)       │  ai_session_id: null
    └──────────────────┘


    ┌──────────────────┐
    │ Manual Creation  │
    │ POST /flashcards │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  ACTIVE          │  ai_session_id: null
    │  (My Flashcards) │  deleted_at: null
    │  source: manual  │
    └────────┬─────────┘
             │
             │ Delete
             ▼
    ┌──────────────────┐
    │   DELETED        │  deleted_at: <timestamp>
    │   (Hidden)       │  ai_session_id: null
    └──────────────────┘
```

---

## Database Schema Reference

### Flashcards Table (Relevant Columns)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner of the flashcard |
| `ai_session_id` | uuid (nullable) | **State indicator**: null = active, uuid = candidate |
| `source` | enum | 'ai' or 'manual' |
| `front` | varchar(200) | Question/front of card |
| `back` | varchar(500) | Answer/back of card |
| `deleted_at` | timestamp (nullable) | **Soft delete**: null = visible, timestamp = deleted |
| `created_at` | timestamp | When created |
| `updated_at` | timestamp | When last modified (auto-updated by trigger) |

---

## Implementation Files

### Service Layer
- **`src/lib/services/ai-sessions.service.ts`**
  - `processCandidateActions()` - Clears `ai_session_id` on accept/edit
  - `getAiSessionCandidates()` - Fetches candidates for review

- **`src/lib/services/flashcards.service.ts`**
  - `listFlashcards()` - Filters by `ai_session_id = null` for active flashcards

### API Endpoints
- **`POST /api/ai-sessions`** - Creates candidates with `ai_session_id` set
- **`GET /api/ai-sessions/{sessionId}/candidates`** - Lists candidates
- **`POST /api/ai-sessions/{sessionId}/candidates/actions`** - Processes candidates (clears `ai_session_id`)
- **`GET /api/flashcards`** - Lists active flashcards (filters out candidates)

---

## Future Enhancements

### Option 1: Add Status Column (More Explicit)
```sql
CREATE TYPE flashcard_status AS ENUM ('candidate', 'active', 'rejected');
ALTER TABLE flashcards ADD COLUMN status flashcard_status DEFAULT 'active';
```

**Pros:**
- More explicit state management
- Preserves session link after acceptance
- Easier to add new states (draft, archived, etc.)

**Cons:**
- Requires migration
- More complex queries

### Option 2: Keep Session Link After Acceptance
Instead of clearing `ai_session_id`, add a `processed_at` timestamp:

```sql
ALTER TABLE flashcards ADD COLUMN processed_at timestamp;
```

**Query for active flashcards:**
```typescript
.is("deleted_at", null)
.or("ai_session_id.is.null,processed_at.not.is.null")
```

**Pros:**
- Preserves session link
- Can query all flashcards from a session

**Cons:**
- More complex queries
- Requires migration

---

## Testing the Lifecycle

### Test Script
Use `test-candidate-actions.sh` to test the full lifecycle:

1. Creates session → Candidates with `ai_session_id` set
2. Accepts candidate → Clears `ai_session_id`
3. Edits candidate → Clears `ai_session_id` + updates content
4. Rejects candidate → Sets `deleted_at`

### Verification Queries

**Check candidate state:**
```sql
SELECT id, front, ai_session_id, deleted_at
FROM flashcards
WHERE ai_session_id = '<session-id>';
```

**Check active flashcards:**
```sql
SELECT id, front, ai_session_id, deleted_at
FROM flashcards
WHERE user_id = '<user-id>'
  AND ai_session_id IS NULL
  AND deleted_at IS NULL;
```

**Check rejected/deleted:**
```sql
SELECT id, front, ai_session_id, deleted_at
FROM flashcards
WHERE deleted_at IS NOT NULL;
```

---

## Summary

| State | `ai_session_id` | `deleted_at` | Visible In |
|-------|----------------|--------------|------------|
| **Candidate** | `<uuid>` | `null` | Review view only |
| **Active** | `null` | `null` | My Flashcards, Study |
| **Rejected/Deleted** | any | `<timestamp>` | Nowhere (audit only) |

**Key Insight:** The `ai_session_id` field serves double duty:
1. Links candidates to their generation session
2. Acts as a state flag (null = processed/active)

This elegant solution requires no migration and works seamlessly with the existing schema! 🎯


