# Testing the Candidate Actions Endpoint

This guide explains how to test the newly implemented `POST /api/ai-sessions/{sessionId}/candidates/actions` endpoint.

## Quick Start

### Option 1: Automated Test Script (Recommended)

1. Start the development server:

   ```bash
   npm run dev
   ```

2. In a new terminal, run the automated test script:
   ```bash
   ./test-candidate-actions.sh
   ```

This will automatically:

- Create a generation session
- Fetch candidates
- Run 8 different test scenarios
- Show pass/fail results for each test
- Provide database verification queries

### Option 2: Manual Testing

Follow the step-by-step guide in `test-candidate-actions-simple.md`:

1. Start the server: `npm run dev`
2. Create a session (copy the session ID)
3. Get candidates (copy candidate IDs)
4. Run test curl commands with your IDs
5. Verify database state

## Test Files

- **`test-candidate-actions.sh`** - Automated test script (8 test cases)
- **`test-candidate-actions-simple.md`** - Manual testing guide with curl commands
- **`.ai/candidate-actions-endpoint-tests.md`** - Comprehensive test documentation (23 test cases)

## What Gets Tested

### Happy Path Tests

✅ Accept candidates (unedited)  
✅ Edit candidates (with new front/back)  
✅ Reject candidates (soft delete)  
✅ Mixed actions in single request

### Validation Tests

✅ Invalid sessionId format  
✅ Missing edited_front when action is "edit"  
✅ Missing edited_back when action is "edit"  
✅ Invalid action type  
✅ Empty actions array  
✅ Malformed JSON

### Authorization Tests

✅ Session not found (404)  
✅ Candidate not found (404)

## Expected Results

### Successful Request (200 OK)

```json
{
  "accepted": ["uuid1", "uuid2"],
  "edited": ["uuid3"],
  "rejected": ["uuid4"]
}
```

### Validation Error (400 Bad Request)

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

### Not Found Error (404 Not Found)

```json
{
  "error": "Not found",
  "message": "Session not found"
}
```

## Database Verification

After running tests, verify the changes in your database:

### Flashcards Table

```sql
SELECT id, front, back, updated_at, deleted_at, source
FROM flashcards
WHERE ai_session_id = '{your-session-id}'
ORDER BY created_at;
```

**What to check:**

- Accepted: `updated_at` changed, `deleted_at` is NULL
- Edited: `front`/`back` updated, `updated_at` changed
- Rejected: `deleted_at` is set (soft delete)

### Session Counters

```sql
SELECT id, accepted_unedited_count, accepted_edited_count
FROM ai_generation_sessions
WHERE id = '{your-session-id}';
```

**What to check:**

- `accepted_unedited_count` matches number of accept actions
- `accepted_edited_count` matches number of edit actions

### Event Logs

```sql
SELECT event_type, created_at
FROM event_logs
WHERE ai_session_id = '{your-session-id}'
ORDER BY created_at DESC;
```

**What to check:**

- `candidates_accepted_unedited:{count}` event
- `candidates_accepted_edited:{count}` event
- `candidates_rejected:{count}` event
- `candidate_actions_processed:total={count}` event

## Troubleshooting

### Server Not Running

```
ERROR: Server is not running at http://localhost:3000
```

**Solution:** Start the server with `npm run dev`

### Connection Refused

```
curl: (7) Failed to connect to localhost port 3000
```

**Solution:** Check if the server is running and on the correct port

### Database Errors

```
error: "Internal server error"
```

**Solution:**

1. Check if Supabase is running
2. Verify `.env` file has correct credentials
3. Check server logs for detailed error messages

### Validation Errors

```
error: "Validation failed"
```

**Solution:** Check the `details` array in the response for specific validation issues

## Performance Benchmarks

Expected response times (on local development):

- Small batch (1-10 actions): < 500ms
- Medium batch (11-50 actions): < 1000ms
- Large batch (51-100 actions): < 2000ms

## Next Steps

After testing:

1. ✅ Verify all tests pass
2. ✅ Check database state is correct
3. ✅ Review event logs for analytics
4. 🚀 Deploy to staging
5. 🎨 Integrate with frontend UI

## Need Help?

- Full test documentation: `.ai/candidate-actions-endpoint-tests.md`
- Implementation details: `.ai/candidate-actions-endpoint-implementation-summary.md`
- API specification: `.ai/api-plan.md`
