#!/bin/bash

# Test OpenRouter Integration
# This script tests the AI flashcard generation endpoint

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_ENDPOINT="${BASE_URL}/api/ai-sessions"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}OpenRouter Integration Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Sample text for testing (1000+ characters)
SAMPLE_TEXT="Artificial Intelligence (AI) has revolutionized numerous fields, from healthcare to finance, transportation to entertainment. At its core, AI refers to the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, and self-correction. Machine learning, a subset of AI, enables systems to automatically learn and improve from experience without being explicitly programmed. Deep learning, a further subset of machine learning, uses neural networks with multiple layers to progressively extract higher-level features from raw input. Natural Language Processing (NLP) is another crucial area of AI that focuses on the interaction between computers and human language. It enables machines to read, understand, and derive meaning from human languages in a valuable way. Computer vision, yet another important AI domain, trains computers to interpret and understand the visual world. Using digital images from cameras and videos and deep learning models, machines can accurately identify and classify objects. The applications of AI are vast and growing. In healthcare, AI assists in diagnosis, drug discovery, and personalized treatment plans. In finance, it powers algorithmic trading, fraud detection, and risk assessment. Autonomous vehicles rely heavily on AI for navigation and decision-making. Virtual assistants like Siri and Alexa use AI to understand and respond to user queries. As AI continues to evolve, ethical considerations become increasingly important, including concerns about privacy, bias, job displacement, and the need for responsible AI development."

# Test 1: Valid request with default model
echo -e "${YELLOW}Test 1: Valid request with default model${NC}"
echo "POST ${API_ENDPOINT}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d "{
    \"input_text\": \"${SAMPLE_TEXT}\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✓ Status: ${HTTP_CODE} (Success)${NC}"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.'
  
  # Extract session ID for next tests
  SESSION_ID=$(echo "$BODY" | jq -r '.id')
  echo ""
  echo -e "${GREEN}Session ID: ${SESSION_ID}${NC}"
else
  echo -e "${RED}✗ Status: ${HTTP_CODE} (Failed)${NC}"
  echo "Response:"
  echo "$BODY" | jq '.'
fi

echo ""
echo -e "${BLUE}----------------------------------------${NC}"
echo ""

# Test 2: Valid request with specific model
echo -e "${YELLOW}Test 2: Valid request with specific model (gpt-3.5-turbo)${NC}"
echo "POST ${API_ENDPOINT}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d "{
    \"input_text\": \"${SAMPLE_TEXT}\",
    \"model\": \"openai/gpt-3.5-turbo\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✓ Status: ${HTTP_CODE} (Success)${NC}"
  echo ""
  echo "Response (first 500 chars):"
  echo "$BODY" | jq '.' | head -c 500
  echo "..."
else
  echo -e "${RED}✗ Status: ${HTTP_CODE} (Failed)${NC}"
  echo "Response:"
  echo "$BODY" | jq '.'
fi

echo ""
echo -e "${BLUE}----------------------------------------${NC}"
echo ""

# Test 3: Invalid request - text too short
echo -e "${YELLOW}Test 3: Invalid request - text too short (< 1000 chars)${NC}"
echo "POST ${API_ENDPOINT}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d "{
    \"input_text\": \"This text is too short for flashcard generation.\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ Status: ${HTTP_CODE} (Expected validation error)${NC}"
  echo ""
  echo "Error response:"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: ${HTTP_CODE} (Unexpected)${NC}"
  echo "Response:"
  echo "$BODY" | jq '.'
fi

echo ""
echo -e "${BLUE}----------------------------------------${NC}"
echo ""

# Test 4: Invalid request - invalid model
echo -e "${YELLOW}Test 4: Invalid request - invalid model${NC}"
echo "POST ${API_ENDPOINT}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d "{
    \"input_text\": \"${SAMPLE_TEXT}\",
    \"model\": \"invalid/model-name\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ Status: ${HTTP_CODE} (Expected validation error)${NC}"
  echo ""
  echo "Error response:"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: ${HTTP_CODE} (Unexpected)${NC}"
  echo "Response:"
  echo "$BODY" | jq '.'
fi

echo ""
echo -e "${BLUE}----------------------------------------${NC}"
echo ""

# Test 5: Invalid request - malformed JSON
echo -e "${YELLOW}Test 5: Invalid request - malformed JSON${NC}"
echo "POST ${API_ENDPOINT}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d "{ invalid json }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ Status: ${HTTP_CODE} (Expected JSON parse error)${NC}"
  echo ""
  echo "Error response:"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: ${HTTP_CODE} (Unexpected)${NC}"
  echo "Response:"
  echo "$BODY"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Suite Complete${NC}"
echo -e "${BLUE}========================================${NC}"

