# Change Log: Candidate State Management Using `ai_session_id`

**Date:** November 21, 2025  
**Type:** Implementation Change  
**Status:** ✅ Completed

## Problem

After implementing the candidate actions endpoint, we discovered that **all candidates were immediately visible in "My Flashcards"** view, even before being reviewed. This violated the intended workflow from the PRD:

1. Generate candidates → Review view
2. Accept/Edit/Reject → Accepted ones move to "My Flashcards"

The issue was that the `listFlashcards` query only filtered by `deleted_at`, showing ALL flashcards regardless of their review status.

## Solution Options Considered

### Option 1: Use `updated_at = NULL` for Candidates ❌
- Set `updated_at = NULL` for unreviewed candidates
- Set `updated_at = <timestamp>` when accepted/edited
- **Rejected:** Database trigger auto-sets `updated_at` on every update, making this approach impossible

### Option 2: Add `status` Column ⚠️
- Add enum: `candidate`, `active`, `rejected`
- Most explicit and maintainable
- **Rejected for MVP:** Requires migration, adds complexity

### Option 3: Use `ai_session_id` as State Indicator ✅ **CHOSEN**
- Candidates: `ai_session_id != null` (linked to session)
- Active: `ai_session_id = null` (processed or manual)
- Natural semantics, no migration needed

## Implementation

### Changes Made

#### 1. Updated `processCandidateActions()` Service
**File:** `src/lib/services/ai-sessions.service.ts`

**Accept Actions:**
```typescript
.update({
  ai_session_id: null,  // ← NEW: Clears session link
  updated_at: new Date().toISOString(),
})
```

**Edit Actions:**
```typescript
.update({
  ai_session_id: null,  // ← NEW: Clears session link
  front: editAction.front,
  back: editAction.back,
  updated_at: new Date().toISOString(),
})
```

**Reject Actions:**
```typescript
.update({
  deleted_at: new Date().toISOString(),
  // ai_session_id kept intact for audit trail
})
```

#### 2. Updated `listFlashcards()` Query
**File:** `src/lib/services/flashcards.service.ts`

**Before:**
```typescript
.eq("user_id", userId)
.is("deleted_at", null)
```

**After:**
```typescript
.eq("user_id", userId)
.is("deleted_at", null)
.is("ai_session_id", null)  // ← NEW: Filter out candidates
```

#### 3. Updated Documentation
- `candidate-actions-endpoint-implementation-summary.md` - Added design decision
- `flashcard-lifecycle.md` - New comprehensive lifecycle documentation
- `test-candidate-actions-simple.md` - Updated verification queries

## Behavior Changes

### Before This Change

| Flashcard Type | `ai_session_id` | `deleted_at` | Shows in "My Flashcards"? |
|----------------|----------------|--------------|---------------------------|
| Unreviewed candidate | `<uuid>` | `null` | ✅ YES (BUG!) |
| Accepted candidate | `<uuid>` | `null` | ✅ YES |
| Edited candidate | `<uuid>` | `null` | ✅ YES |
| Rejected candidate | `<uuid>` | `<timestamp>` | ❌ NO |
| Manual flashcard | `null` | `null` | ✅ YES |

### After This Change

| Flashcard Type | `ai_session_id` | `deleted_at` | Shows in "My Flashcards"? |
|----------------|----------------|--------------|---------------------------|
| Unreviewed candidate | `<uuid>` | `null` | ❌ NO (FIXED!) |
| Accepted candidate | `null` ← | `null` | ✅ YES |
| Edited candidate | `null` ← | `null` | ✅ YES |
| Rejected candidate | `<uuid>` | `<timestamp>` | ❌ NO |
| Manual flashcard | `null` | `null` | ✅ YES |

## Benefits

✅ **No Migration Required** - Works with existing schema  
✅ **Clear Separation** - Candidates vs active flashcards  
✅ **Simple Queries** - Easy to filter by `ai_session_id`  
✅ **Natural Semantics** - Linked to session = still under review  
✅ **Audit Trail** - Session link preserved in event logs  
✅ **Works with Triggers** - No conflict with `updated_at` auto-update  

## Trade-offs

⚠️ **Session Link Lost After Acceptance**
- Cannot query "all flashcards from session X" after they're accepted
- Mitigation: Session link preserved in event logs for analytics

⚠️ **Less Explicit Than Status Column**
- State is implied by presence/absence of `ai_session_id`
- Mitigation: Well-documented, can add status column later if needed

## Testing

### Verification Steps

1. **Create a session:**
   ```bash
   curl -X POST http://localhost:3000/api/ai-sessions -d '{"input_text": "..."}'
   ```
   - Candidates created with `ai_session_id` set
   - Should NOT appear in "My Flashcards"

2. **Accept a candidate:**
   ```bash
   curl -X POST http://localhost:3000/api/ai-sessions/{id}/candidates/actions \
     -d '{"actions": [{"candidate_id": "...", "action": "accept"}]}'
   ```
   - `ai_session_id` cleared
   - Should NOW appear in "My Flashcards"

3. **Edit a candidate:**
   ```bash
   curl -X POST http://localhost:3000/api/ai-sessions/{id}/candidates/actions \
     -d '{"actions": [{"candidate_id": "...", "action": "edit", "edited_front": "...", "edited_back": "..."}]}'
   ```
   - `ai_session_id` cleared
   - Content updated
   - Should NOW appear in "My Flashcards"

4. **Reject a candidate:**
   ```bash
   curl -X POST http://localhost:3000/api/ai-sessions/{id}/candidates/actions \
     -d '{"actions": [{"candidate_id": "...", "action": "reject"}]}'
   ```
   - `ai_session_id` kept
   - `deleted_at` set
   - Should NOT appear anywhere

### Database Verification

```sql
-- Check candidates (should NOT show in My Flashcards)
SELECT id, front, ai_session_id, deleted_at
FROM flashcards
WHERE ai_session_id IS NOT NULL AND deleted_at IS NULL;

-- Check active flashcards (should show in My Flashcards)
SELECT id, front, ai_session_id, deleted_at
FROM flashcards
WHERE ai_session_id IS NULL AND deleted_at IS NULL;

-- Check rejected (should not show anywhere)
SELECT id, front, ai_session_id, deleted_at
FROM flashcards
WHERE deleted_at IS NOT NULL;
```

## Migration Path (If Needed Later)

If we decide to add an explicit `status` column in the future:

```sql
-- Create enum
CREATE TYPE flashcard_status AS ENUM ('candidate', 'active', 'rejected');

-- Add column
ALTER TABLE flashcards 
ADD COLUMN status flashcard_status NOT NULL DEFAULT 'active';

-- Migrate existing data
UPDATE flashcards 
SET status = CASE
  WHEN deleted_at IS NOT NULL THEN 'rejected'
  WHEN ai_session_id IS NOT NULL THEN 'candidate'
  ELSE 'active'
END;

-- Create index
CREATE INDEX idx_flashcards_status ON flashcards(status);
```

Then update queries to use `status` instead of `ai_session_id` check.

## Related Files

### Modified
- `src/lib/services/ai-sessions.service.ts`
- `src/lib/services/flashcards.service.ts`
- `.ai/candidate-actions-endpoint-implementation-summary.md`
- `test-candidate-actions-simple.md`

### Created
- `.ai/flashcard-lifecycle.md`
- `.ai/candidate-state-management-change.md` (this file)

## Build Status

✅ All linter checks pass  
✅ Production build successful  
✅ No TypeScript errors  
✅ No breaking changes to existing functionality

## Conclusion

This change properly implements the PRD workflow by ensuring candidates remain hidden from "My Flashcards" until they're explicitly accepted or edited. The solution is elegant, requires no migration, and can be easily enhanced with an explicit status column if needed in the future.

The key insight: **Use `ai_session_id` as a dual-purpose field** - it links candidates to their session AND indicates their review status (null = processed).


