# OpenRouter Integration - Testing Guide

## Overview

This guide provides comprehensive testing instructions for the OpenRouter integration that powers AI flashcard generation.

## Test Files Created

### 1. `test-quick.sh` - Quick Test

**Purpose**: Single-command test to verify the integration is working

**Usage**:

```bash
./test-quick.sh
```

**What it does**:

- Sends a POST request with sample AI text (1000+ chars)
- Uses default model (openai/gpt-4o-mini)
- Pretty-prints the JSON response

### 2. `test-openrouter-integration.sh` - Full Test Suite

**Purpose**: Comprehensive test suite covering all scenarios

**Usage**:

```bash
./test-openrouter-integration.sh
```

**Tests included**:

1. ✅ Valid request with default model
2. ✅ Valid request with specific model (gpt-3.5-turbo)
3. ✅ Invalid request - text too short (< 1000 chars)
4. ✅ Invalid request - invalid model
5. ✅ Invalid request - malformed JSON

**Features**:

- Color-coded output (green = success, red = error, yellow = test name)
- HTTP status code validation
- Detailed error messages
- JSON pretty-printing with jq

### 3. `CURL_EXAMPLES.md` - Documentation

**Purpose**: Complete reference for all cURL commands

**Contents**:

- Basic request examples
- All model variations
- Error scenarios
- Performance testing
- Troubleshooting guide
- Tips and tricks

### 4. `sample-text.txt` - Test Data

**Purpose**: Sample text file for testing (1000+ characters)

**Usage**:

```bash
INPUT_TEXT=$(cat sample-text.txt)
curl -X POST http://localhost:4321/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d "{\"input_text\": \"${INPUT_TEXT}\"}"
```

## Prerequisites

### 1. Environment Setup

Create `.env` file with:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 2. Dependencies

Install required tools:

```bash
# jq for JSON parsing (optional but recommended)
brew install jq  # macOS
sudo apt install jq  # Linux
```

### 3. Start Development Server

```bash
npm run dev
```

Server should be running at `http://localhost:3000`

## Testing Workflow

### Step 1: Quick Smoke Test

```bash
./test-quick.sh
```

**Expected output**:

```json
{
  "id": "uuid-here",
  "candidates": [
    {
      "front": "What is Artificial Intelligence?",
      "back": "AI refers to the simulation of human intelligence...",
      "prompt": "Generate a flashcard about AI definition"
    }
    // ... more candidates
  ],
  "input_text_hash": "md5-hash-here"
}
```

### Step 2: Full Test Suite

```bash
./test-openrouter-integration.sh
```

**Expected results**:

- Test 1: ✓ Status 201 (Success)
- Test 2: ✓ Status 201 (Success)
- Test 3: ✓ Status 400 (Expected validation error)
- Test 4: ✓ Status 400 (Expected validation error)
- Test 5: ✓ Status 400 (Expected JSON parse error)

### Step 3: Manual Testing

Use examples from `CURL_EXAMPLES.md` to test specific scenarios:

```bash
# Test with GPT-4
curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "YOUR_TEXT_HERE",
    "model": "openai/gpt-4"
  }' | jq '.'
```

## Validation Checklist

### ✅ Functional Tests

- [ ] Default model generates flashcards
- [ ] All allowed models work correctly
- [ ] Response includes session ID
- [ ] Response includes candidates array
- [ ] Response includes input_text_hash
- [ ] Candidates have front, back, and prompt fields
- [ ] Generation duration is tracked

### ✅ Validation Tests

- [ ] Text < 1000 chars returns 400 error
- [ ] Text > 10000 chars returns 400 error
- [ ] Invalid model returns 400 error
- [ ] Malformed JSON returns 400 error
- [ ] Missing input_text returns 400 error

### ✅ Integration Tests

- [ ] Session is created in database
- [ ] Candidates are stored in database
- [ ] Event log is created
- [ ] Generation duration is updated
- [ ] Input text hash is correct

### ✅ Error Handling

- [ ] Invalid API key returns appropriate error
- [ ] Network errors are handled gracefully
- [ ] Rate limits trigger retry logic
- [ ] Server errors trigger retry logic
- [ ] Timeout errors are handled

## Common Issues and Solutions

### Issue 1: "command not found: jq"

**Solution**: Install jq or remove `| jq '.'` from commands

```bash
brew install jq  # macOS
```

### Issue 2: "Connection refused"

**Solution**: Ensure dev server is running

```bash
npm run dev
```

### Issue 3: "OPENROUTER_API_KEY environment variable is not set"

**Solution**: Check `.env` file exists and contains the key

```bash
cat .env | grep OPENROUTER_API_KEY
```

### Issue 4: 500 Internal Server Error

**Solution**: Check server logs for details

```bash
# In the terminal running npm run dev
# Look for error messages
```

### Issue 5: Rate limit errors

**Solution**: Wait for the retry-after period or use a different model

```bash
# OpenRouter has different rate limits per model
# Try switching to a different model
```

## Performance Benchmarks

### Expected Response Times

- **GPT-4o-mini**: 2-5 seconds
- **GPT-3.5-turbo**: 3-6 seconds
- **GPT-4**: 5-10 seconds
- **Claude-3-haiku**: 2-4 seconds
- **Claude-3-sonnet**: 4-8 seconds

### Measuring Performance

```bash
time ./test-quick.sh
```

Or with curl:

```bash
time curl -X POST http://localhost:3000/api/ai-sessions \
  -H "Content-Type: application/json" \
  -d @sample-text.txt
```

## Database Verification

After successful generation, verify in database:

### Check Session Created

```sql
SELECT * FROM ai_generation_sessions
ORDER BY created_at DESC
LIMIT 1;
```

### Check Candidates Stored

```sql
SELECT id, front, back, ai_session_id
FROM flashcards
WHERE ai_session_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Check Event Logged

```sql
SELECT * FROM event_logs
WHERE event_type = 'generation_session_created'
ORDER BY created_at DESC
LIMIT 1;
```

## Next Steps

1. ✅ Run quick test to verify basic functionality
2. ✅ Run full test suite to validate all scenarios
3. ✅ Check database for stored data
4. ✅ Test candidate actions (accept/edit/reject)
5. ✅ Monitor API usage in OpenRouter dashboard
6. ✅ Test in production environment
7. ✅ Set up monitoring and alerts

## API Usage Monitoring

Track your OpenRouter usage:

1. Visit [OpenRouter Dashboard](https://openrouter.ai/dashboard)
2. Check "Usage" section for:
   - Total requests
   - Tokens consumed
   - Cost per model
   - Rate limit status

## Support

If you encounter issues:

1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure OpenRouter API key is valid
4. Check OpenRouter status page for outages
5. Review `CURL_EXAMPLES.md` for troubleshooting tips

## Summary

The testing suite provides:

- ✅ Quick smoke test for rapid verification
- ✅ Comprehensive test suite for all scenarios
- ✅ Detailed documentation with examples
- ✅ Sample data for easy testing
- ✅ Performance benchmarking tools
- ✅ Database verification queries
- ✅ Troubleshooting guide

All tests are automated and can be run with a single command!
