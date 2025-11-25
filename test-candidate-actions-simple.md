# Quick Test Guide: Candidate Actions Endpoint

## Prerequisites

1. Start the dev server: `npm run dev`
2. Make sure Supabase is running

## Step 1: Create a Generation Session

```bash
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Photosynthesis is the process by which plants convert light energy into chemical energy. This process occurs in the chloroplasts of plant cells, specifically in structures called thylakoids. The light-dependent reactions take place in the thylakoid membranes, where chlorophyll absorbs light energy. This energy is used to split water molecules, releasing oxygen as a byproduct. The light-independent reactions, also known as the Calvin cycle, occur in the stroma of the chloroplast. During this stage, carbon dioxide is fixed into organic molecules using the energy stored from the light-dependent reactions. The overall equation for photosynthesis is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. This process is essential for life on Earth as it produces oxygen and serves as the foundation of most food chains. Plants are called autotrophs because they can produce their own food through photosynthesis. The rate of photosynthesis can be affected by several factors including light intensity, carbon dioxide concentration, temperature, and water availability. Understanding photosynthesis is crucial for agriculture, climate science, and developing sustainable energy solutions.",
    "model": "gpt-3.5-turbo"
  }' | jq '.'
```

**Save the `id` from the response** - this is your `SESSION_ID`

## Step 2: Get Candidates

Replace `{SESSION_ID}` with the ID from Step 1:

```bash
curl -X GET http://localhost:3000/api/ai-sessions/{SESSION_ID}/candidates | jq '.'
```

**Save the `id` values from candidates** - you'll need at least 3 for testing

## Step 3: Test the Candidate Actions Endpoint

### Test 3a: Happy Path - Mixed Actions

Replace `{SESSION_ID}`, `{CANDIDATE_1}`, `{CANDIDATE_2}`, `{CANDIDATE_3}` with actual UUIDs:

```bash
curl -X POST http://localhost:3000/api/ai-sessions/{SESSION_ID}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "{CANDIDATE_1}",
        "action": "accept"
      },
      {
        "candidate_id": "{CANDIDATE_2}",
        "action": "edit",
        "edited_front": "Updated front text",
        "edited_back": "Updated back text"
      },
      {
        "candidate_id": "{CANDIDATE_3}",
        "action": "reject"
      }
    ]
  }' | jq '.'
```

**Expected Response (200 OK):**

```json
{
  "accepted": ["{CANDIDATE_1}"],
  "edited": ["{CANDIDATE_2}"],
  "rejected": ["{CANDIDATE_3}"]
}
```

### Test 3b: Validation Error - Missing edited_front

```bash
curl -X POST http://localhost:3000/api/ai-sessions/{SESSION_ID}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "{CANDIDATE_1}",
        "action": "edit",
        "edited_back": "Back text only"
      }
    ]
  }' | jq '.'
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "custom",
      "message": "edited_front is required when action is edit",
      "path": ["actions", 0, "edited_front"]
    }
  ]
}
```

### Test 3c: Validation Error - Invalid Action

```bash
curl -X POST http://localhost:3000/api/ai-sessions/{SESSION_ID}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "{CANDIDATE_1}",
        "action": "invalid_action"
      }
    ]
  }' | jq '.'
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "details": [...]
}
```

### Test 3d: Authorization Error - Session Not Found

```bash
curl -X POST http://localhost:3000/api/ai-sessions/00000000-0000-0000-0000-000000000000/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "{CANDIDATE_1}",
        "action": "accept"
      }
    ]
  }' | jq '.'
```

**Expected Response (404 Not Found):**

```json
{
  "error": "Not found",
  "message": "Session not found"
}
```

### Test 3e: Authorization Error - Candidate Not Found

```bash
curl -X POST http://localhost:3000/api/ai-sessions/{SESSION_ID}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "00000000-0000-0000-0000-000000000001",
        "action": "accept"
      }
    ]
  }' | jq '.'
```

**Expected Response (404 Not Found):**

```json
{
  "error": "Not found",
  "message": "Candidates not found: 00000000-0000-0000-0000-000000000001"
}
```

## Step 4: Verify Database State

After running the tests, verify the database changes:

### Check Flashcards

```sql
SELECT id, front, back, ai_session_id, deleted_at, source
FROM flashcards
WHERE ai_session_id = '{SESSION_ID}' OR id IN (
  SELECT DISTINCT flashcard_id FROM event_logs WHERE ai_session_id = '{SESSION_ID}'
)
ORDER BY created_at;
```

**Expected:**

- Accepted candidate: `ai_session_id` cleared (null), `deleted_at` is NULL
- Edited candidate: `ai_session_id` cleared (null), `front` and `back` updated
- Rejected candidate: `ai_session_id` still set, `deleted_at` is set
- Unprocessed candidates: `ai_session_id` still set, `deleted_at` is NULL

### Check Session Counters

```sql
SELECT id, accepted_unedited_count, accepted_edited_count
FROM ai_generation_sessions
WHERE id = '{SESSION_ID}';
```

**Expected:**

- `accepted_unedited_count` = 1
- `accepted_edited_count` = 1

### Check Event Logs

```sql
SELECT event_type, created_at
FROM event_logs
WHERE ai_session_id = '{SESSION_ID}'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Events:**

- `candidate_actions_processed:total=3`
- `candidates_accepted_unedited:1`
- `candidates_accepted_edited:1`
- `candidates_rejected:1`
- `generation_session_created` (from Step 1)

## Automated Test Script

For automated testing, run:

```bash
./test-candidate-actions.sh
```

This will run all 8 test cases automatically and show pass/fail results.
