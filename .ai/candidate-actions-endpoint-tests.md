# Testing Guide: POST `/api/ai-sessions/{sessionId}/candidates/actions`

## Endpoint Overview
**URL:** `POST /api/ai-sessions/{sessionId}/candidates/actions`  
**Purpose:** Bulk process candidate flashcards (accept/edit/reject) from an AI generation session

## Test Environment Setup

### Prerequisites
1. Running Supabase instance
2. Valid user session (DEFAULT_USER_ID for development)
3. Existing AI generation session with candidate flashcards

### Setup Steps
1. Create a generation session: `POST /api/ai-sessions` with input text
2. Note the returned `sessionId` and candidate IDs from the response
3. Use these IDs for testing the candidate actions endpoint

---

## Test Cases

### 1. Happy Path - Mixed Actions

**Test ID:** `TC-001`  
**Description:** Process multiple candidates with different actions (accept/edit/reject)  
**Priority:** High

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "uuid-1",
        "action": "accept"
      },
      {
        "candidate_id": "uuid-2",
        "action": "edit",
        "edited_front": "Updated front text",
        "edited_back": "Updated back text"
      },
      {
        "candidate_id": "uuid-3",
        "action": "reject"
      }
    ]
  }'
```

**Expected Response:**
- Status: `200 OK`
- Body:
```json
{
  "accepted": ["uuid-1"],
  "edited": ["uuid-2"],
  "rejected": ["uuid-3"]
}
```

**Verification:**
- Check `flashcards` table: uuid-1 should have updated `updated_at`
- Check `flashcards` table: uuid-2 should have new front/back values
- Check `flashcards` table: uuid-3 should have `deleted_at` set
- Check `ai_generation_sessions` table: counters updated correctly
- Check `event_logs` table: 4 events logged (3 action-specific + 1 summary)

---

### 2. Accept Only - Batch Processing

**Test ID:** `TC-002`  
**Description:** Accept multiple candidates without editing  
**Priority:** High

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {"candidate_id": "uuid-1", "action": "accept"},
      {"candidate_id": "uuid-2", "action": "accept"},
      {"candidate_id": "uuid-3", "action": "accept"}
    ]
  }'
```

**Expected Response:**
- Status: `200 OK`
- Body:
```json
{
  "accepted": ["uuid-1", "uuid-2", "uuid-3"],
  "edited": [],
  "rejected": []
}
```

**Verification:**
- All three flashcards have updated `updated_at` timestamps
- `accepted_unedited_count` = 3 in session table
- Event log contains `candidates_accepted_unedited:3`

---

### 3. Edit Only - Individual Updates

**Test ID:** `TC-003`  
**Description:** Edit multiple candidates with different content  
**Priority:** High

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "uuid-1",
        "action": "edit",
        "edited_front": "Front 1",
        "edited_back": "Back 1"
      },
      {
        "candidate_id": "uuid-2",
        "action": "edit",
        "edited_front": "Front 2",
        "edited_back": "Back 2"
      }
    ]
  }'
```

**Expected Response:**
- Status: `200 OK`
- Body:
```json
{
  "accepted": [],
  "edited": ["uuid-1", "uuid-2"],
  "rejected": []
}
```

**Verification:**
- Both flashcards have new front/back content
- `accepted_edited_count` = 2 in session table
- Event log contains `candidates_accepted_edited:2`

---

### 4. Reject Only - Soft Delete

**Test ID:** `TC-004`  
**Description:** Reject multiple candidates  
**Priority:** High

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {"candidate_id": "uuid-1", "action": "reject"},
      {"candidate_id": "uuid-2", "action": "reject"}
    ]
  }'
```

**Expected Response:**
- Status: `200 OK`
- Body:
```json
{
  "accepted": [],
  "edited": [],
  "rejected": ["uuid-1", "uuid-2"]
}
```

**Verification:**
- Both flashcards have `deleted_at` timestamp set
- Event log contains `candidates_rejected:2`

---

### 5. Validation Error - Invalid SessionId

**Test ID:** `TC-005`  
**Description:** Request with invalid UUID format for sessionId  
**Priority:** High

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/invalid-uuid/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {"candidate_id": "uuid-1", "action": "accept"}
    ]
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Body:
```json
{
  "error": "Invalid sessionId",
  "details": [
    {
      "code": "invalid_string",
      "message": "Invalid sessionId format. Must be a valid UUID.",
      "path": []
    }
  ]
}
```

---

### 6. Validation Error - Missing edited_front

**Test ID:** `TC-006`  
**Description:** Edit action without required edited_front field  
**Priority:** High

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "uuid-1",
        "action": "edit",
        "edited_back": "Back text only"
      }
    ]
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Body:
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

---

### 7. Validation Error - Missing edited_back

**Test ID:** `TC-007`  
**Description:** Edit action without required edited_back field  
**Priority:** High

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "uuid-1",
        "action": "edit",
        "edited_front": "Front text only"
      }
    ]
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Body contains validation error for missing `edited_back`

---

### 8. Validation Error - Invalid Action Type

**Test ID:** `TC-008`  
**Description:** Request with invalid action value  
**Priority:** Medium

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "uuid-1",
        "action": "invalid_action"
      }
    ]
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Body:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_enum_value",
      "message": "action must be one of: accept, edit, reject",
      "path": ["actions", 0, "action"]
    }
  ]
}
```

---

### 9. Validation Error - Empty Actions Array

**Test ID:** `TC-009`  
**Description:** Request with empty actions array  
**Priority:** Medium

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": []
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Body:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "message": "At least one action is required",
      "path": ["actions"]
    }
  ]
}
```

---

### 10. Validation Error - Too Many Actions

**Test ID:** `TC-010`  
**Description:** Request with more than 100 actions  
**Priority:** Medium

**Request:**
```bash
# Generate 101 actions programmatically
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [/* 101 action objects */]
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Body:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_big",
      "message": "Maximum 100 actions allowed per request",
      "path": ["actions"]
    }
  ]
}
```

---

### 11. Validation Error - Invalid Candidate UUID

**Test ID:** `TC-011`  
**Description:** Request with invalid UUID format for candidate_id  
**Priority:** Medium

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "not-a-uuid",
        "action": "accept"
      }
    ]
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Body contains validation error for invalid UUID format

---

### 12. Validation Error - Front Text Too Long

**Test ID:** `TC-012`  
**Description:** Edit action with edited_front exceeding 200 characters  
**Priority:** Medium

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "uuid-1",
        "action": "edit",
        "edited_front": "' + 'a'.repeat(201) + '",
        "edited_back": "Valid back text"
      }
    ]
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Body contains validation error for exceeding max length

---

### 13. Validation Error - Back Text Too Long

**Test ID:** `TC-013`  
**Description:** Edit action with edited_back exceeding 500 characters  
**Priority:** Medium

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {
        "candidate_id": "uuid-1",
        "action": "edit",
        "edited_front": "Valid front text",
        "edited_back": "' + 'a'.repeat(501) + '"
      }
    ]
  }'
```

**Expected Response:**
- Status: `400 Bad Request`
- Body contains validation error for exceeding max length

---

### 14. Validation Error - Malformed JSON

**Test ID:** `TC-014`  
**Description:** Request with invalid JSON body  
**Priority:** High

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{"actions": [invalid json}'
```

**Expected Response:**
- Status: `400 Bad Request`
- Body:
```json
{
  "error": "Invalid JSON",
  "message": "Request body must be valid JSON."
}
```

---

### 15. Authorization Error - Session Not Found

**Test ID:** `TC-015`  
**Description:** Request with valid UUID but non-existent session  
**Priority:** High

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/00000000-0000-0000-0000-000000000000/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {"candidate_id": "uuid-1", "action": "accept"}
    ]
  }'
```

**Expected Response:**
- Status: `404 Not Found`
- Body:
```json
{
  "error": "Not found",
  "message": "Session not found"
}
```

---

### 16. Authorization Error - Candidate Not Found

**Test ID:** `TC-016`  
**Description:** Request with valid session but non-existent candidate ID  
**Priority:** High

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {"candidate_id": "00000000-0000-0000-0000-000000000000", "action": "accept"}
    ]
  }'
```

**Expected Response:**
- Status: `404 Not Found`
- Body:
```json
{
  "error": "Not found",
  "message": "Candidates not found: 00000000-0000-0000-0000-000000000000"
}
```

---

### 17. Authorization Error - Candidate From Different Session

**Test ID:** `TC-017`  
**Description:** Request with candidate_id that belongs to a different session  
**Priority:** High

**Setup:**
1. Create two sessions (sessionA and sessionB)
2. Get candidate IDs from sessionB
3. Try to process sessionB candidates via sessionA endpoint

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionA-id}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {"candidate_id": "{sessionB-candidate-id}", "action": "accept"}
    ]
  }'
```

**Expected Response:**
- Status: `404 Not Found`
- Body:
```json
{
  "error": "Not found",
  "message": "Candidates not found: {sessionB-candidate-id}"
}
```

---

### 18. Edge Case - Single Action

**Test ID:** `TC-018`  
**Description:** Process exactly one candidate  
**Priority:** Low

**Request:**
```bash
curl -X POST http://localhost:4321/api/ai-sessions/{sessionId}/candidates/actions \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {"candidate_id": "uuid-1", "action": "accept"}
    ]
  }'
```

**Expected Response:**
- Status: `200 OK`
- Body:
```json
{
  "accepted": ["uuid-1"],
  "edited": [],
  "rejected": []
}
```

---

### 19. Edge Case - Maximum Actions (100)

**Test ID:** `TC-019`  
**Description:** Process exactly 100 candidates (maximum allowed)  
**Priority:** Low

**Setup:**
1. Create a session with at least 100 candidates
2. Process all 100 in a single request

**Expected Response:**
- Status: `200 OK`
- Response contains all 100 IDs distributed across action types
- All database updates complete successfully
- Event logs created correctly

---

### 20. Idempotency - Already Processed Candidates

**Test ID:** `TC-020`  
**Description:** Attempt to process the same candidate twice  
**Priority:** Medium

**Setup:**
1. Process a candidate with "accept" action
2. Try to process the same candidate again

**Expected Behavior:**
- First request: `200 OK` with candidate in accepted array
- Second request: Should succeed (candidate already accepted, just updates timestamp)

**Note:** Current implementation doesn't prevent reprocessing. This is acceptable for MVP but should be documented.

---

## Performance Tests

### 21. Response Time - Small Batch

**Test ID:** `PT-001`  
**Description:** Measure response time for 10 actions  
**Target:** < 500ms

### 22. Response Time - Large Batch

**Test ID:** `PT-002`  
**Description:** Measure response time for 100 actions  
**Target:** < 2000ms

### 23. Concurrent Requests

**Test ID:** `PT-003`  
**Description:** Send 10 concurrent requests to different sessions  
**Target:** All succeed without errors

---

## Database Verification Queries

After each test, verify database state:

```sql
-- Check flashcard updates
SELECT id, front, back, updated_at, deleted_at 
FROM flashcards 
WHERE ai_session_id = '{sessionId}';

-- Check session counters
SELECT accepted_unedited_count, accepted_edited_count 
FROM ai_generation_sessions 
WHERE id = '{sessionId}';

-- Check event logs
SELECT event_type, created_at 
FROM event_logs 
WHERE ai_session_id = '{sessionId}' 
ORDER BY created_at DESC;
```

---

## Test Execution Checklist

- [ ] All happy path tests pass (TC-001 to TC-004)
- [ ] All validation tests pass (TC-005 to TC-014)
- [ ] All authorization tests pass (TC-015 to TC-017)
- [ ] All edge cases handled (TC-018 to TC-020)
- [ ] Performance targets met (PT-001 to PT-003)
- [ ] Database state verified after each test
- [ ] Event logs created correctly
- [ ] No linter errors
- [ ] Build succeeds
- [ ] No console errors or warnings

---

## Known Limitations

1. **No Idempotency Protection:** Candidates can be processed multiple times. For MVP, this is acceptable as it just updates timestamps.

2. **No Partial Failure Handling:** If one action fails mid-batch, the entire request fails. Future enhancement could return partial success.

3. **No Status Column:** Using soft delete (`deleted_at`) instead of explicit status field. Works for MVP but limits ability to "unreject" candidates.

4. **Counter Increments:** Session counters are set to the count from current request, not incremented. If multiple requests process different candidates, only the last request's counts are stored.

---

## Recommended Testing Order

1. Start with TC-001 (happy path) to ensure basic functionality
2. Run validation tests (TC-005 to TC-014) to verify input handling
3. Run authorization tests (TC-015 to TC-017) to verify security
4. Run edge cases (TC-018 to TC-020) to verify robustness
5. Run performance tests (PT-001 to PT-003) to verify scalability


