# Example Test Output

This document shows what you should expect when running the automated test script.

## Running the Test

```bash
$ ./test-candidate-actions.sh
```

## Expected Output

```
========================================
Testing Candidate Actions Endpoint
========================================

Checking if server is running...
✓ Server is running

Step 1: Creating generation session...
✓ Session created: a1b2c3d4-e5f6-7890-abcd-ef1234567890

Step 2: Fetching candidates...
✓ Found 5 candidates
  Candidate 1: 11111111-2222-3333-4444-555555555555
  Candidate 2: 22222222-3333-4444-5555-666666666666
  Candidate 3: 33333333-4444-5555-6666-777777777777
  Candidate 4: 44444444-5555-6666-7777-888888888888
  Candidate 5: 55555555-6666-7777-8888-999999999999

========================================
Test 1: Happy Path - Mixed Actions
========================================
✓ PASS: Mixed actions (accept/edit/reject)
  Response: {"accepted":["11111111-2222-3333-4444-555555555555"],"edited":["22222222-3333-4444-5555-666666666666"],"rejected":["33333333-4444-5555-6666-777777777777"]}

========================================
Test 2: Validation - Invalid SessionId
========================================
✓ PASS: Invalid sessionId format

========================================
Test 3: Validation - Missing edited_front
========================================
✓ PASS: Missing edited_front validation

========================================
Test 4: Validation - Invalid action type
========================================
✓ PASS: Invalid action type validation

========================================
Test 5: Validation - Empty actions array
========================================
✓ PASS: Empty actions array validation

========================================
Test 6: Authorization - Session not found
========================================
✓ PASS: Session not found (404)

========================================
Test 7: Authorization - Candidate not found
========================================
✓ PASS: Candidate not found (404)

========================================
Test 8: Validation - Malformed JSON
========================================
✓ PASS: Malformed JSON validation

========================================
Test Summary
========================================

All critical tests completed!

Session ID used: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Number of candidates: 5

You can verify the database state with:
  SELECT * FROM flashcards WHERE ai_session_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  SELECT * FROM ai_generation_sessions WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  SELECT * FROM event_logs WHERE ai_session_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' ORDER BY created_at DESC;
```

## What Each Test Validates

### ✓ Test 1: Happy Path - Mixed Actions
- **Tests:** Accept, edit, and reject actions in a single request
- **Validates:** 
  - Response contains correct arrays
  - HTTP status is 200
  - Each action type is processed correctly

### ✓ Test 2: Invalid SessionId
- **Tests:** Request with malformed UUID
- **Validates:**
  - HTTP status is 400
  - Error message mentions sessionId or Invalid

### ✓ Test 3: Missing edited_front
- **Tests:** Edit action without required field
- **Validates:**
  - HTTP status is 400
  - Error message mentions edited_front

### ✓ Test 4: Invalid Action Type
- **Tests:** Action value not in enum (accept/edit/reject)
- **Validates:**
  - HTTP status is 400
  - Error message lists valid options

### ✓ Test 5: Empty Actions Array
- **Tests:** Request with no actions
- **Validates:**
  - HTTP status is 400
  - Error message mentions "at least one" or "required"

### ✓ Test 6: Session Not Found
- **Tests:** Valid UUID but non-existent session
- **Validates:**
  - HTTP status is 404
  - Error message mentions "not found"

### ✓ Test 7: Candidate Not Found
- **Tests:** Valid session but non-existent candidate
- **Validates:**
  - HTTP status is 404
  - Error message mentions "not found"

### ✓ Test 8: Malformed JSON
- **Tests:** Invalid JSON syntax
- **Validates:**
  - HTTP status is 400
  - Error message mentions JSON

## Database State After Tests

### Flashcards Table
```sql
SELECT id, front, back, updated_at, deleted_at 
FROM flashcards 
WHERE ai_session_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

**Expected Results:**

| id | front | back | updated_at | deleted_at |
|----|-------|------|------------|------------|
| 11111111... | Original front | Original back | 2025-11-20 21:30:00 | NULL |
| 22222222... | Updated front text | Updated back text | 2025-11-20 21:30:00 | NULL |
| 33333333... | Original front | Original back | 2025-11-20 21:00:00 | 2025-11-20 21:30:00 |
| 44444444... | Original front | Original back | 2025-11-20 21:00:00 | NULL |
| 55555555... | Original front | Original back | 2025-11-20 21:00:00 | NULL |

**Notes:**
- Candidate 1: Accepted (updated_at changed, deleted_at is NULL)
- Candidate 2: Edited (front/back changed, updated_at changed)
- Candidate 3: Rejected (deleted_at is set)
- Candidates 4-5: Untouched (original state)

### AI Generation Sessions Table
```sql
SELECT id, accepted_unedited_count, accepted_edited_count
FROM ai_generation_sessions 
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

**Expected Results:**

| id | accepted_unedited_count | accepted_edited_count |
|----|------------------------|----------------------|
| a1b2c3d4... | 1 | 1 |

### Event Logs Table
```sql
SELECT event_type, created_at
FROM event_logs 
WHERE ai_session_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ORDER BY created_at DESC;
```

**Expected Results:**

| event_type | created_at |
|------------|------------|
| candidate_actions_processed:total=3 | 2025-11-20 21:30:00 |
| candidates_rejected:1 | 2025-11-20 21:30:00 |
| candidates_accepted_edited:1 | 2025-11-20 21:30:00 |
| candidates_accepted_unedited:1 | 2025-11-20 21:30:00 |
| generation_session_created | 2025-11-20 21:00:00 |

## Troubleshooting Failed Tests

### If Test 1 Fails
**Possible causes:**
- Database connection issue
- Service layer bug
- Incorrect response format

**Debug steps:**
1. Check server logs for errors
2. Verify Supabase is running
3. Test each action type individually

### If Validation Tests Fail (Tests 2-5, 8)
**Possible causes:**
- Zod schema not working correctly
- Wrong HTTP status code returned

**Debug steps:**
1. Check the actual error response
2. Verify Zod schema in `flashcards.schemas.ts`
3. Check endpoint error handling

### If Authorization Tests Fail (Tests 6-7)
**Possible causes:**
- Service layer not throwing NotFoundError
- Wrong HTTP status code mapping

**Debug steps:**
1. Check service function error handling
2. Verify error name is "NotFoundError"
3. Check endpoint error handling logic

## Performance Metrics

After running the test, you should see:
- **Total test time:** < 5 seconds
- **Individual test time:** < 500ms each
- **Database queries:** 5-7 per request

## Next Actions

After all tests pass:
1. ✅ Commit the changes
2. ✅ Push to repository
3. 🚀 Deploy to staging
4. 🎨 Integrate with frontend
5. 📊 Monitor event logs for analytics


