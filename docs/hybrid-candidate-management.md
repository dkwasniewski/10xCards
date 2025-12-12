# Hybrid Candidate Management

## Overview

The Hybrid Candidate Management system ensures that AI-generated flashcard candidates are never lost when creating new generation sessions. Users can review and manage candidates from multiple sessions simultaneously.

## The Problem

Previously, when users generated flashcards in session A and then created a new session B, the localStorage would update to session B's ID. This caused candidates from session A to become inaccessible in the UI, even though they still existed in the database with `ai_session_id` set.

## The Solution: Hybrid Approach

The hybrid approach displays candidates from two sources:

1. **Pending Candidates** - From the current session (stored in localStorage)
2. **Other Pending Candidates** - From all previous sessions

This ensures all pending candidates remain accessible regardless of how many new sessions are created.

## Architecture

### Data Flow

```
User generates Session A (10 candidates)
  ↓
localStorage: { lastSessionId: "session-a-uuid" }
  ↓
User generates Session B (10 candidates)
  ↓
localStorage: { lastSessionId: "session-b-uuid" } (updated)
  ↓
After page refresh:
  - "Pending Candidates" shows Session B candidates (current session)
  - "Other Pending Candidates" shows Session A candidates (previous sessions)
```

### Database State

Candidates are stored in the `flashcards` table with:
- `ai_session_id` - Links to the generation session (NULL for accepted/rejected candidates)
- `user_id` - Owns the candidate
- `deleted_at` - NULL for pending, timestamp for rejected

## API Endpoints

### GET /api/ai-sessions/:sessionId/candidates

**Purpose:** Fetch candidates for a specific session (current session)

**Query Parameters:** None

**Response:**
```typescript
CandidateDto[] // Candidates from the specified session
```

**Used By:** `useCandidates(sessionId)` hook for "Pending Candidates" section

---

### GET /api/candidates/other-pending

**Purpose:** Fetch candidates from all sessions EXCEPT the current one

**Query Parameters:**
- `excludeSessionId` (optional) - Session ID to exclude (typically current session)

**Response:**
```typescript
CandidateDto[] // Candidates from other sessions
```

**Implementation:**
```sql
SELECT id, front, back, prompt, ai_session_id
FROM flashcards
WHERE user_id = $userId
  AND ai_session_id IS NOT NULL
  AND deleted_at IS NULL
  AND ai_session_id != $excludeSessionId
ORDER BY created_at ASC
```

**Used By:** `useOtherPendingCandidates(excludeSessionId)` hook for "Other Pending Candidates" section

**File:** `/src/pages/api/candidates/other-pending.ts`

---

### POST /api/ai-sessions/:sessionId/candidates/actions

**Purpose:** Process actions (accept/edit/reject) on candidates

**Request Body:**
```typescript
{
  actions: [
    { candidate_id: "uuid", action: "accept" },
    { candidate_id: "uuid", action: "reject" },
    {
      candidate_id: "uuid",
      action: "edit",
      edited_front: "New front",
      edited_back: "New back"
    }
  ]
}
```

**Behavior:**
- **Accept:** Sets `ai_session_id = NULL` (graduates to active flashcard)
- **Edit:** Sets `ai_session_id = NULL` and updates front/back
- **Reject:** Sets `deleted_at` timestamp (soft delete)

**Used By:** Individual and bulk action handlers in `GenerateReview` component

---

### GET /api/candidates/orphaned

**Purpose:** Fetch orphaned candidates (>7 days old with `ai_session_id` set)

**Response:**
```typescript
{
  count: number,
  candidates: CandidateDto[]
}
```

**File:** `/src/pages/api/candidates/orphaned.ts`

---

### DELETE /api/candidates/orphaned

**Purpose:** Clean up orphaned candidates (soft delete)

**Response:**
```typescript
{
  deleted: number,
  message: string
}
```

**File:** `/src/pages/api/candidates/orphaned.ts`

## React Hooks

### useCandidates(sessionId)

**Purpose:** Fetch candidates for the CURRENT session

**Parameters:**
- `sessionId` - The AI generation session ID from localStorage

**Returns:**
```typescript
{
  data: CandidateViewModel[],
  isLoading: boolean,
  error: string | null,
  refresh: () => Promise<void>
}
```

**File:** `/src/lib/hooks/ai-candidates.ts:88`

---

### useOtherPendingCandidates(excludeSessionId)

**Purpose:** Fetch candidates from OTHER sessions (excluding current)

**Parameters:**
- `excludeSessionId` - Session ID to exclude (typically current session from localStorage)

**Returns:**
```typescript
{
  data: CandidateViewModel[],
  isLoading: boolean,
  error: string | null,
  refresh: () => Promise<void>
}
```

**File:** `/src/lib/hooks/ai-candidates.ts:170`

## UI Components

### GenerateReview Component

**File:** `/src/components/generate/GenerateReview.tsx`

**Sections:**

1. **Pending Candidates Section**
   - Displays candidates from the current session
   - Hidden when "New Candidates" exist (prevents duplication)
   - Test ID: `pending-candidates-section`
   - Row Test ID: `pending-candidate-row-{id}`

2. **Other Pending Candidates Section**
   - Displays candidates from previous sessions
   - Hidden when "New Candidates" exist (prevents duplication)
   - Test ID: `other-pending-candidates-section`
   - Row Test ID: `other-pending-candidate-row-{id}`

3. **New Candidates Section**
   - Displays freshly generated candidates (in-memory state)
   - Cleared on page refresh
   - Test ID: `new-candidates-section`
   - Row Test ID: `new-candidate-row-{id}`

**UI Behavior:**

```
When new candidates exist:
  ✓ Show "New Candidates" section
  ✗ Hide "Pending Candidates" section
  ✗ Hide "Other Pending Candidates" section

After page refresh:
  ✗ "New Candidates" cleared (in-memory state reset)
  ✓ Show "Pending Candidates" (current session)
  ✓ Show "Other Pending Candidates" (previous sessions)
```

### Action Handlers

All action handlers (accept/edit/reject) now use the candidate's own `ai_session_id` instead of relying on the current session from localStorage:

```typescript
const handleAcceptCandidate = async (id: string) => {
  // Find candidate in ALL lists
  const candidate = [
    ...pendingCandidates,
    ...otherPendingCandidates,
    ...newCandidates
  ].find(c => c.id === id);

  // Use candidate's session ID, not currentSessionId
  await processActions(candidate.aiSessionId, command);

  // Refresh BOTH pending lists
  await refreshPending();
  await refreshOtherPending();
};
```

### Bulk Actions

Bulk actions group candidates by session ID and process each session independently:

```typescript
const handleBulkAccept = async () => {
  const selectedCandidates = [
    ...pendingCandidates,
    ...otherPendingCandidates,
    ...newCandidates
  ].filter(c => selectedIds.includes(c.id));

  // Group by session ID
  const candidatesBySession = selectedCandidates.reduce((acc, c) => {
    if (!acc[c.aiSessionId]) acc[c.aiSessionId] = [];
    acc[c.aiSessionId].push(c.id);
    return acc;
  }, {});

  // Process each session separately
  for (const [sessionId, candidateIds] of Object.entries(candidatesBySession)) {
    await processActions(sessionId, command);
  }

  // Refresh both lists
  await refreshPending();
  await refreshOtherPending();
};
```

## User Flow Example

### Scenario: Multi-Session Workflow

1. **Generate Session A**
   ```
   User: Pastes 2000 chars about "React Hooks"
   System: Generates 10 candidates
   localStorage: { lastSessionId: "session-a-uuid" }
   UI: Shows "New Candidates" (10 cards)
   ```

2. **Page Refresh**
   ```
   System: Clears in-memory "New Candidates" state
   UI: Shows "Pending Candidates" (10 cards from session A)
   ```

3. **Generate Session B**
   ```
   User: Pastes 2000 chars about "TypeScript Generics"
   System: Generates 10 candidates
   localStorage: { lastSessionId: "session-b-uuid" } (updated!)
   UI: Shows "New Candidates" (10 cards)
   ```

4. **Page Refresh**
   ```
   System: Clears in-memory "New Candidates" state
   UI: Shows TWO sections:
     - "Pending Candidates" (10 cards from session B - current session)
     - "Other Pending Candidates" (10 cards from session A - previous session)
   ```

5. **Accept/Reject Candidates**
   ```
   User: Accepts 3 cards from session A, rejects 2 from session B
   System: Sets ai_session_id = NULL for accepted cards
          Sets deleted_at for rejected cards
   UI: Cards disappear from pending sections
   ```

## Testing

### E2E Tests

**File:** `/e2e/generate/generate-flashcards.spec.ts`

**Key Tests:**
- "should not show pending candidates when new candidates exist (no duplication)"
- "should show pending candidates after page refresh (new candidates cleared)"
- "should show candidates from previous sessions as 'Other Pending Candidates'" (SKIPPED - needs debugging)
- "should accept candidates from different sessions independently" (SKIPPED - needs debugging)

**Test IDs:**
- `pending-candidates-section`
- `other-pending-candidates-section`
- `new-candidates-section`
- `pending-candidate-row-{id}`
- `other-pending-candidate-row-{id}`
- `new-candidate-row-{id}`

## Database Cleanup

### Orphaned Candidates

Candidates with `ai_session_id` set that are older than 7 days are considered "orphaned" - they're no longer in active review sessions.

**Detection:**
```sql
SELECT COUNT(*) FROM flashcards
WHERE user_id = $userId
  AND ai_session_id IS NOT NULL
  AND deleted_at IS NULL
  AND created_at < (NOW() - INTERVAL '7 days')
```

**Cleanup:**
- UI shows banner when orphaned candidates detected
- User clicks "Clean Up" button
- System soft-deletes all orphaned candidates
- Frees database space

**File:** `/src/components/generate/GenerateReview.tsx:619-638`

## Benefits

1. **No Lost Candidates** - All candidates remain accessible across sessions
2. **Clear Organization** - Current vs. previous sessions clearly separated
3. **Flexible Workflow** - Users can generate new content without losing old reviews
4. **Database Hygiene** - Automatic orphan detection and cleanup
5. **Session Independence** - Actions work correctly across different sessions

## Technical Notes

### Why Not Just Use One List?

Separating current and previous sessions provides:
- **Better UX** - Users know which candidates are from their latest generation
- **Performance** - Current session is prioritized (fewer candidates to load initially)
- **Clarity** - Clear distinction between "just generated" vs "older pending"

### Why localStorage for Session ID?

- **Simplicity** - No server-side session management required
- **Stateless API** - Sessions are self-contained
- **Client-driven** - Users control which session is "current"
- **Offline-friendly** - Works even when disconnected

### Migration Path

For existing users with orphaned candidates:
1. System detects candidates >7 days old with `ai_session_id` set
2. Shows cleanup banner with count
3. User can choose to clean up or keep reviewing
4. Cleanup is reversible (soft delete with `deleted_at`)
