# Testing Guide: GET /api/ai-sessions/{sessionId}/candidates

## Prerequisites

1. Supabase running (local or remote)
2. Dev server running (`npm run dev`)
3. At least one AI generation session with candidates in database

## Setup Test Data

Create a generation session first:

```bash
curl -X POST http://localhost:4321/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "'"$(printf 'a%.0s' {1..1000})"'",
    "model": "gpt-4"
  }'
```

**Save the returned `id`** - you'll use it as `{sessionId}` in tests below.

---

## Test 1: Get Candidates (Happy Path)

```bash
# Replace {sessionId} with actual UUID from setup
curl "http://localhost:4321/api/ai-sessions/{sessionId}/candidates" | jq .
```

**Expected Response:**

- Status: `200 OK`
- Body: Array of candidates

```json
[
  {
    "id": "uuid",
    "front": "Question text",
    "back": "Answer text",
    "prompt": "Prompt used"
  },
  ...
]
```

---

## Test 2: Invalid sessionId Format

```bash
curl "http://localhost:4321/api/ai-sessions/invalid-uuid/candidates" -v | jq .
```

**Expected Response:**

- Status: `400 Bad Request`
- Body:

```json
{
  "error": "Invalid sessionId",
  "details": [...]
}
```

---

## Test 3: Session Not Found

```bash
# Valid UUID but doesn't exist
curl "http://localhost:4321/api/ai-sessions/00000000-0000-0000-0000-000000000000/candidates" -v | jq .
```

**Expected Response:**

- Status: `404 Not Found`
- Body:

```json
{
  "error": "Session not found"
}
```

---

## Test 4: Empty Candidates

Create a session but delete all its candidates, then fetch:

```bash
curl "http://localhost:4321/api/ai-sessions/{sessionId}/candidates" | jq .
```

**Expected Response:**

- Status: `200 OK`
- Body: `[]` (empty array)

---

## Verification Checklist

- [ ] Happy path returns 200 with array of candidates
- [ ] Invalid UUID returns 400 with validation error
- [ ] Non-existent session returns 404
- [ ] Empty session returns 200 with empty array
- [ ] Candidates ordered by created_at (oldest first)
- [ ] Response includes Cache-Control header
