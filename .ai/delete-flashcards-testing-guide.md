# Testing Guide: DELETE Flashcards Endpoints

## Prerequisites

1. **Supabase Running:** Ensure your local Supabase instance is running
2. **Dev Server Running:** Start your Astro dev server
3. **Test Data:** Create some flashcards to delete

## Setup Test Data

First, let's create some flashcards to test deletion:

```bash
# Create test flashcards using POST endpoint
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -d '[
    {
      "front": "Test Card 1",
      "back": "Answer 1",
      "source": "manual"
    },
    {
      "front": "Test Card 2",
      "back": "Answer 2",
      "source": "manual"
    },
    {
      "front": "Test Card 3",
      "back": "Answer 3",
      "source": "manual"
    }
  ]'
```

**Save the returned IDs** - you'll need them for testing!

## Test 1: Single Delete (Happy Path)

### Using curl:

```bash
# Replace {flashcard-id} with an actual UUID from your test data
curl -X DELETE http://localhost:3000/api/flashcards/{flashcard-id} -v
```

**Expected Response:**

- Status: `204 No Content`
- Body: Empty

### Using HTTPie (if installed):

```bash
http DELETE http://localhost:3000/api/flashcards/{flashcard-id}
```

### Verify Deletion:

```bash
# List all flashcards - the deleted one should not appear
curl http://localhost:3000/api/flashcards
```

---

## Test 2: Single Delete - Invalid UUID Format

```bash
curl -X DELETE http://localhost:3000/api/flashcards/invalid-uuid -v
```

**Expected Response:**

- Status: `400 Bad Request`
- Body:

```json
{
  "error": "Invalid flashcard ID format",
  "details": [
    {
      "validation": "uuid",
      "code": "invalid_string",
      "message": "Invalid uuid",
      "path": []
    }
  ]
}
```

---

## Test 3: Single Delete - Not Found

```bash
# Use a valid UUID that doesn't exist
curl -X DELETE http://localhost:3000/api/flashcards/00000000-0000-0000-0000-000000000000 -v
```

**Expected Response:**

- Status: `404 Not Found`
- Body:

```json
{
  "error": "Flashcard not found"
}
```

---

## Test 4: Bulk Delete (Happy Path)

```bash
# Replace with actual UUIDs from your test data
curl -X DELETE http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "uuid-1",
      "uuid-2",
      "uuid-3"
    ]
  }' -v
```

**Expected Response:**

- Status: `204 No Content`
- Body: Empty

### Verify Bulk Deletion:

```bash
curl http://localhost:3000/api/flashcards
```

---

## Test 5: Bulk Delete - Invalid Body

### Empty array:

```bash
curl -X DELETE http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{"ids": []}' -v
```

**Expected Response:**

- Status: `400 Bad Request`
- Body:

```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "array",
      "message": "Array must contain at least 1 element(s)",
      "path": ["ids"]
    }
  ]
}
```

### Too many IDs (>100):

```bash
# Generate 101 fake UUIDs
curl -X DELETE http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{"ids": ["'$(uuidgen)'",...]}' -v
```

**Expected Response:**

- Status: `400 Bad Request`
- Body: Validation error for array size

---

## Test 6: Bulk Delete - No Flashcards Found

```bash
# Use valid UUIDs that don't exist
curl -X DELETE http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "00000000-0000-0000-0000-000000000000",
      "00000000-0000-0000-0000-000000000001"
    ]
  }' -v
```

**Expected Response:**

- Status: `404 Not Found`
- Body:

```json
{
  "error": "No flashcards found to delete"
}
```

---

## Test 7: Soft Delete Verification

Test that deleted flashcards are not physically removed, just marked as deleted:

```bash
# 1. Create a flashcard
RESPONSE=$(curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -d '[{"front": "Test", "back": "Test", "source": "manual"}]')

# Extract ID from response (you may need jq for this)
ID=$(echo $RESPONSE | jq -r '.created[0].id')

# 2. Delete it
curl -X DELETE http://localhost:4321/api/flashcards/$ID

# 3. Try to delete it again - should get 404
curl -X DELETE http://localhost:4321/api/flashcards/$ID -v
```

**Expected:** Second delete returns `404 Not Found` (already deleted)

---

## Test 8: Check Database Directly

Verify soft-delete behavior in Supabase:

```sql
-- In Supabase Studio SQL Editor
SELECT id, front, deleted_at
FROM flashcards
WHERE user_id = 'your-default-user-id'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** Deleted flashcards should have `deleted_at` timestamp set, not be removed from the table.

---

## Using Postman/Insomnia

### Collection Setup:

1. **Base URL:** `http://localhost:3000`
2. **Environment Variables:**
   - `base_url`: `http://localhost:3000`
   - `flashcard_id`: (set after creating test data)

### Request Examples:

#### 1. DELETE Single Flashcard

- Method: `DELETE`
- URL: `{{base_url}}/api/flashcards/{{flashcard_id}}`
- Tests:
  ```javascript
  pm.test("Status is 204", () => {
    pm.response.to.have.status(204);
  });
  pm.test("Body is empty", () => {
    pm.expect(pm.response.text()).to.equal("");
  });
  ```

#### 2. DELETE Bulk Flashcards

- Method: `DELETE`
- URL: `{{base_url}}/api/flashcards`
- Body (JSON):
  ```json
  {
    "ids": ["uuid-1", "uuid-2"]
  }
  ```
- Tests:
  ```javascript
  pm.test("Status is 204", () => {
    pm.response.to.have.status(204);
  });
  ```

---

## Quick Test Script

Save this as `test-delete-endpoints.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🧪 Testing DELETE Endpoints"
echo "============================"

# Create test data
echo ""
echo "📝 Creating test flashcards..."
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/api/flashcards \
  -H "Content-Type: application/json" \
  -d '[
    {"front": "Delete Test 1", "back": "Test 1", "source": "manual"},
    {"front": "Delete Test 2", "back": "Test 2", "source": "manual"}
  ]')

echo "Created: $CREATE_RESPONSE"

# Extract IDs (requires jq)
if ! command -v jq &> /dev/null; then
    echo "❌ jq is required for this script. Install with: brew install jq"
    exit 1
fi

ID1=$(echo $CREATE_RESPONSE | jq -r '.created[0].id')
ID2=$(echo $CREATE_RESPONSE | jq -r '.created[1].id')

echo "ID1: $ID1"
echo "ID2: $ID2"

# Test 1: Single Delete
echo ""
echo "🧪 Test 1: Single Delete (Happy Path)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE $BASE_URL/api/flashcards/$ID1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "204" ]; then
    echo "✅ PASSED - Status: $HTTP_CODE"
else
    echo "❌ FAILED - Status: $HTTP_CODE"
fi

# Test 2: Invalid UUID
echo ""
echo "🧪 Test 2: Invalid UUID Format"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE $BASE_URL/api/flashcards/invalid-uuid)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "400" ]; then
    echo "✅ PASSED - Status: $HTTP_CODE"
else
    echo "❌ FAILED - Status: $HTTP_CODE"
fi

# Test 3: Not Found
echo ""
echo "🧪 Test 3: Not Found"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE $BASE_URL/api/flashcards/00000000-0000-0000-0000-000000000000)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "404" ]; then
    echo "✅ PASSED - Status: $HTTP_CODE"
else
    echo "❌ FAILED - Status: $HTTP_CODE"
fi

# Test 4: Bulk Delete
echo ""
echo "🧪 Test 4: Bulk Delete (Happy Path)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE $BASE_URL/api/flashcards \
  -H "Content-Type: application/json" \
  -d "{\"ids\": [\"$ID2\"]}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "204" ]; then
    echo "✅ PASSED - Status: $HTTP_CODE"
else
    echo "❌ FAILED - Status: $HTTP_CODE"
fi

# Test 5: Bulk Delete - Empty Array
echo ""
echo "🧪 Test 5: Bulk Delete - Empty Array"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE $BASE_URL/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{"ids": []}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "400" ]; then
    echo "✅ PASSED - Status: $HTTP_CODE"
else
    echo "❌ FAILED - Status: $HTTP_CODE"
fi

# Test 6: Bulk Delete - Not Found
echo ""
echo "🧪 Test 6: Bulk Delete - Not Found"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE $BASE_URL/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{"ids": ["00000000-0000-0000-0000-000000000000"]}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "404" ]; then
    echo "✅ PASSED - Status: $HTTP_CODE"
else
    echo "❌ FAILED - Status: $HTTP_CODE"
fi

echo ""
echo "============================"
echo "✅ All tests completed!"
```

Make it executable and run:

```bash
chmod +x test-delete-endpoints.sh
./test-delete-endpoints.sh
```

---

## Testing Checklist

- [ ] Single delete with valid ID returns 204
- [ ] Single delete with invalid UUID format returns 400
- [ ] Single delete with non-existent ID returns 404
- [ ] Bulk delete with valid IDs returns 204
- [ ] Bulk delete with empty array returns 400
- [ ] Bulk delete with >100 IDs returns 400
- [ ] Bulk delete with non-existent IDs returns 404
- [ ] Deleted flashcards don't appear in GET /api/flashcards
- [ ] Deleted flashcards have `deleted_at` set in database
- [ ] Cannot delete the same flashcard twice (2nd attempt returns 404)
- [ ] Error logs are created for 500 errors in `event_logs` table

---

## Troubleshooting

### Issue: "Supabase client not available"

**Solution:** Check that middleware is properly configured and Supabase is running

### Issue: All deletes return 404

**Solution:** Verify you're using the correct `DEFAULT_USER_ID` that matches your test data

### Issue: 500 errors

**Solution:** Check console logs and `event_logs` table in Supabase for detailed error messages

---

## Next Steps

Once manual testing is complete, consider:

1. Writing automated integration tests
2. Adding unit tests for the service layer
3. Setting up a test database with fixtures
4. Creating a Postman collection for the team
