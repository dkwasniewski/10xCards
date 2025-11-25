#!/bin/bash

# Test Script for POST /api/ai-sessions/{sessionId}/candidates/actions
# This script tests the candidate actions endpoint with various scenarios

set -e

BASE_URL="http://localhost:3000"
RESULTS_FILE="/tmp/test-results.txt"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Testing Candidate Actions Endpoint"
echo "========================================"
echo ""

# Function to print test results
print_result() {
    local test_name=$1
    local status=$2
    local message=$3
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗ FAIL${NC}: $test_name - $message"
    else
        echo -e "${YELLOW}⚠ SKIP${NC}: $test_name - $message"
    fi
}

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Server is not running at $BASE_URL${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Step 1: Create a generation session
echo "Step 1: Creating generation session..."
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai-sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Photosynthesis is the process by which plants convert light energy into chemical energy. This process occurs in the chloroplasts of plant cells, specifically in structures called thylakoids. The light-dependent reactions take place in the thylakoid membranes, where chlorophyll absorbs light energy. This energy is used to split water molecules, releasing oxygen as a byproduct. The light-independent reactions, also known as the Calvin cycle, occur in the stroma of the chloroplast. During this stage, carbon dioxide is fixed into organic molecules using the energy stored from the light-dependent reactions. The overall equation for photosynthesis is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. This process is essential for life on Earth as it produces oxygen and serves as the foundation of most food chains. Plants are called autotrophs because they can produce their own food through photosynthesis. The rate of photosynthesis can be affected by several factors including light intensity, carbon dioxide concentration, temperature, and water availability. Understanding photosynthesis is crucial for agriculture, climate science, and developing sustainable energy solutions.",
    "model": "openai/gpt-3.5-turbo"
  }')

SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.id')

if [ "$SESSION_ID" = "null" ] || [ -z "$SESSION_ID" ]; then
    echo -e "${RED}✗ Failed to create session${NC}"
    echo "Response: $SESSION_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Session created: $SESSION_ID${NC}"
echo ""

# Step 2: Get candidates
echo "Step 2: Fetching candidates..."
CANDIDATES_RESPONSE=$(curl -s "$BASE_URL/api/ai-sessions/$SESSION_ID/candidates")
CANDIDATE_IDS=($(echo "$CANDIDATES_RESPONSE" | jq -r '.[].id'))

if [ ${#CANDIDATE_IDS[@]} -eq 0 ]; then
    echo -e "${RED}✗ No candidates found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found ${#CANDIDATE_IDS[@]} candidates${NC}"
for i in "${!CANDIDATE_IDS[@]}"; do
    echo "  Candidate $((i+1)): ${CANDIDATE_IDS[$i]}"
done
echo ""

# Test 1: Happy Path - Mixed Actions
echo "========================================"
echo "Test 1: Happy Path - Mixed Actions"
echo "========================================"

if [ ${#CANDIDATE_IDS[@]} -ge 3 ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ai-sessions/$SESSION_ID/candidates/actions" \
      -H "Content-Type: application/json" \
      -d "{
        \"actions\": [
          {
            \"candidate_id\": \"${CANDIDATE_IDS[0]}\",
            \"action\": \"accept\"
          },
          {
            \"candidate_id\": \"${CANDIDATE_IDS[1]}\",
            \"action\": \"edit\",
            \"edited_front\": \"Updated front text\",
            \"edited_back\": \"Updated back text\"
          },
          {
            \"candidate_id\": \"${CANDIDATE_IDS[2]}\",
            \"action\": \"reject\"
          }
        ]
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        ACCEPTED_COUNT=$(echo "$BODY" | jq '.accepted | length')
        EDITED_COUNT=$(echo "$BODY" | jq '.edited | length')
        REJECTED_COUNT=$(echo "$BODY" | jq '.rejected | length')
        
        if [ "$ACCEPTED_COUNT" = "1" ] && [ "$EDITED_COUNT" = "1" ] && [ "$REJECTED_COUNT" = "1" ]; then
            print_result "Mixed actions (accept/edit/reject)" "PASS"
            echo "  Response: $BODY"
        else
            print_result "Mixed actions (accept/edit/reject)" "FAIL" "Unexpected counts: accepted=$ACCEPTED_COUNT, edited=$EDITED_COUNT, rejected=$REJECTED_COUNT"
        fi
    else
        print_result "Mixed actions (accept/edit/reject)" "FAIL" "HTTP $HTTP_CODE - $BODY"
    fi
else
    print_result "Mixed actions (accept/edit/reject)" "SKIP" "Not enough candidates (need 3, have ${#CANDIDATE_IDS[@]})"
fi
echo ""

# Test 2: Validation Error - Invalid SessionId
echo "========================================"
echo "Test 2: Validation - Invalid SessionId"
echo "========================================"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ai-sessions/invalid-uuid/candidates/actions" \
  -H "Content-Type: application/json" \
  -d "{
    \"actions\": [
      {
        \"candidate_id\": \"${CANDIDATE_IDS[0]}\",
        \"action\": \"accept\"
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    ERROR=$(echo "$BODY" | jq -r '.error')
    if [[ "$ERROR" == *"Invalid"* ]] || [[ "$ERROR" == *"sessionId"* ]]; then
        print_result "Invalid sessionId format" "PASS"
    else
        print_result "Invalid sessionId format" "FAIL" "Wrong error message: $ERROR"
    fi
else
    print_result "Invalid sessionId format" "FAIL" "Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 3: Validation Error - Missing edited_front
echo "========================================"
echo "Test 3: Validation - Missing edited_front"
echo "========================================"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ai-sessions/$SESSION_ID/candidates/actions" \
  -H "Content-Type: application/json" \
  -d "{
    \"actions\": [
      {
        \"candidate_id\": \"${CANDIDATE_IDS[0]}\",
        \"action\": \"edit\",
        \"edited_back\": \"Back text only\"
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    ERROR=$(echo "$BODY" | jq -r '.error')
    if [[ "$BODY" == *"edited_front"* ]]; then
        print_result "Missing edited_front validation" "PASS"
    else
        print_result "Missing edited_front validation" "FAIL" "Wrong error message"
    fi
else
    print_result "Missing edited_front validation" "FAIL" "Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 4: Validation Error - Invalid action type
echo "========================================"
echo "Test 4: Validation - Invalid action type"
echo "========================================"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ai-sessions/$SESSION_ID/candidates/actions" \
  -H "Content-Type: application/json" \
  -d "{
    \"actions\": [
      {
        \"candidate_id\": \"${CANDIDATE_IDS[0]}\",
        \"action\": \"invalid_action\"
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    if [[ "$BODY" == *"accept"* ]] || [[ "$BODY" == *"edit"* ]] || [[ "$BODY" == *"reject"* ]]; then
        print_result "Invalid action type validation" "PASS"
    else
        print_result "Invalid action type validation" "FAIL" "Wrong error message"
    fi
else
    print_result "Invalid action type validation" "FAIL" "Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 5: Validation Error - Empty actions array
echo "========================================"
echo "Test 5: Validation - Empty actions array"
echo "========================================"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ai-sessions/$SESSION_ID/candidates/actions" \
  -H "Content-Type: application/json" \
  -d '{
    "actions": []
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    if [[ "$BODY" == *"least one"* ]] || [[ "$BODY" == *"required"* ]]; then
        print_result "Empty actions array validation" "PASS"
    else
        print_result "Empty actions array validation" "FAIL" "Wrong error message"
    fi
else
    print_result "Empty actions array validation" "FAIL" "Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 6: Authorization - Session not found
echo "========================================"
echo "Test 6: Authorization - Session not found"
echo "========================================"

FAKE_UUID="00000000-0000-0000-0000-000000000000"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ai-sessions/$FAKE_UUID/candidates/actions" \
  -H "Content-Type: application/json" \
  -d "{
    \"actions\": [
      {
        \"candidate_id\": \"${CANDIDATE_IDS[0]}\",
        \"action\": \"accept\"
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "404" ]; then
    if [[ "$BODY" == *"not found"* ]] || [[ "$BODY" == *"Not found"* ]]; then
        print_result "Session not found (404)" "PASS"
    else
        print_result "Session not found (404)" "FAIL" "Wrong error message"
    fi
else
    print_result "Session not found (404)" "FAIL" "Expected 404, got $HTTP_CODE"
fi
echo ""

# Test 7: Authorization - Candidate not found
echo "========================================"
echo "Test 7: Authorization - Candidate not found"
echo "========================================"

FAKE_CANDIDATE_UUID="00000000-0000-0000-0000-000000000001"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ai-sessions/$SESSION_ID/candidates/actions" \
  -H "Content-Type: application/json" \
  -d "{
    \"actions\": [
      {
        \"candidate_id\": \"$FAKE_CANDIDATE_UUID\",
        \"action\": \"accept\"
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "404" ]; then
    if [[ "$BODY" == *"not found"* ]] || [[ "$BODY" == *"Not found"* ]]; then
        print_result "Candidate not found (404)" "PASS"
    else
        print_result "Candidate not found (404)" "FAIL" "Wrong error message"
    fi
else
    print_result "Candidate not found (404)" "FAIL" "Expected 404, got $HTTP_CODE"
fi
echo ""

# Test 8: Malformed JSON
echo "========================================"
echo "Test 8: Validation - Malformed JSON"
echo "========================================"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ai-sessions/$SESSION_ID/candidates/actions" \
  -H "Content-Type: application/json" \
  -d '{"actions": [invalid json}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    if [[ "$BODY" == *"JSON"* ]] || [[ "$BODY" == *"json"* ]]; then
        print_result "Malformed JSON validation" "PASS"
    else
        print_result "Malformed JSON validation" "FAIL" "Wrong error message"
    fi
else
    print_result "Malformed JSON validation" "FAIL" "Expected 400, got $HTTP_CODE"
fi
echo ""

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo ""
echo "All critical tests completed!"
echo ""
echo "Session ID used: $SESSION_ID"
echo "Number of candidates: ${#CANDIDATE_IDS[@]}"
echo ""
echo "You can verify the database state with:"
echo "  SELECT * FROM flashcards WHERE ai_session_id = '$SESSION_ID';"
echo "  SELECT * FROM ai_generation_sessions WHERE id = '$SESSION_ID';"
echo "  SELECT * FROM event_logs WHERE ai_session_id = '$SESSION_ID' ORDER BY created_at DESC;"
echo ""

