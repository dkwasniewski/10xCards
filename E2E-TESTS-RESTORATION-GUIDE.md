# E2E Tests Restoration Guide

---
⚠️ **OUTDATED DOCUMENT** - December 2025

This document contains **outdated information** about environment variables. Many variables mentioned here (like `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `E2E_USERNAME_ID`) have been removed as they were not actually used in the code.

**For current environment setup, see:**
- `ENV_VARIABLES_ANALYSIS.md` - Complete analysis
- `E2E-ENVIRONMENT-VARIABLES-UPDATE.md` - Migration guide
- `.env.example` - Current template

---

## Issues Found

### 1. Environment Variable Mismatches

**Problem in `.env.test`:**
```bash
# Wrong variable names
SUPABASE_URL=...
SUPABASE_KEY=...

# Should be:
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. Missing OpenRouter API Key

**Problem:**
```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**Solution:** You need to add your actual OpenRouter API key from `.env` file.

### 3. Password Mismatch

**In `.env.test`:**
```bash
E2E_PASSWORD=10xCardsE2E
```

**In test files:**
```typescript
const testPassword = process.env.E2E_PASSWORD || "test1234";
```

The tests fall back to `test1234` when `E2E_PASSWORD` is not loaded properly.

## Step-by-Step Fix

### Step 1: Update .env.test

Replace the contents of `.env.test` with:

```bash
# Supabase Configuration (use PUBLIC_ prefix for Astro)
PUBLIC_SUPABASE_URL=https://imqdgswlhuzufrfsxouw.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWRnc3dsaHV6dWZyZnN4b3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDg1NDUsImV4cCI6MjA4MDMyNDU0NX0.d2AOnDe7rP7gzPMZHS2tzfHCae4Ou_gGGATx71cjKG0

# E2E Test User Credentials
E2E_USERNAME_ID=65541b90-4a20-4e83-84b3-0f6d64c59fbb
E2E_EMAIL=test@test.com
E2E_PASSWORD=10xCardsE2E

# OpenRouter API (copy from your .env file)
OPENROUTER_API_KEY=<YOUR_ACTUAL_KEY_FROM_.ENV_FILE>
OPENROUTER_API_URL=https://openrouter.ai/api/v1

# Base URL for tests
BASE_URL=http://localhost:3000
```

### Step 2: Update Test Files to Use Correct Password

The tests should use `E2E_EMAIL` and `E2E_PASSWORD` from environment:

**File:** `e2e/flashcards/create-flashcard.spec.ts` (line 29-30)
**File:** `e2e/generate/generate-flashcards.spec.ts` (line 28-29)

Current code:
```typescript
const testEmail = process.env.E2E_EMAIL || "test@test.com";
const testPassword = process.env.E2E_PASSWORD || "test1234";
```

This is actually correct! The issue is that the environment variables aren't being loaded.

### Step 3: Fix playwright.config.ts

The config already loads `.env.test`, but let's make sure it's working:

```typescript
import dotenv from "dotenv";
import path from "path";

// Load .env.test before anything else
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
```

### Step 4: Verify Environment Loading

Create a test script to verify environment variables are loaded:

```bash
# test-env.js
require('dotenv').config({ path: '.env.test' });
console.log('E2E_EMAIL:', process.env.E2E_EMAIL);
console.log('E2E_PASSWORD:', process.env.E2E_PASSWORD ? '***' : 'NOT SET');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '***' : 'NOT SET');
console.log('PUBLIC_SUPABASE_URL:', process.env.PUBLIC_SUPABASE_URL ? '***' : 'NOT SET');
```

Run it:
```bash
node test-env.js
```

## Quick Fix Commands

### 1. Copy OpenRouter API Key from .env to .env.test

```bash
# Extract OPENROUTER_API_KEY from .env
grep OPENROUTER_API_KEY .env

# Manually copy the value to .env.test
```

### 2. Update .env.test with correct variable names

```bash
# Backup current .env.test
cp .env.test .env.test.backup

# Edit .env.test and change:
# SUPABASE_URL → PUBLIC_SUPABASE_URL
# SUPABASE_KEY → PUBLIC_SUPABASE_ANON_KEY
# E2E_USERNAME → E2E_EMAIL (if needed)
```

### 3. Run Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run only flashcard creation tests
npm run test:e2e -- flashcards/create-flashcard.spec.ts

# Run with debug
DEBUG=pw:api npm run test:e2e
```

## Expected Results After Fix

✅ **Homepage tests** - Should still pass (2/2)
✅ **Create Flashcard tests** - Should pass (6/6)
  - Login should succeed
  - Redirect should work
  - Flashcard creation should work

✅ **Generate Flashcards tests** - Should pass (12/12)
  - Character count should update
  - OpenRouter API should work
  - Flashcard generation should succeed

## Common Issues and Solutions

### Issue 1: "OPENROUTER_API_KEY environment variable is not set"

**Solution:** Make sure you copied the actual API key from `.env` to `.env.test`, not the placeholder.

### Issue 2: Login still fails

**Solution:** 
1. Verify the test user exists in Supabase
2. Check the password is correct: `10xCardsE2E`
3. Try logging in manually with these credentials

### Issue 3: "No cookie auth credentials found"

**Solution:** This is misleading - it's actually a 401 from OpenRouter. Check that:
1. OPENROUTER_API_KEY is set correctly
2. The API key is valid
3. You have credits in your OpenRouter account

### Issue 4: Tests still timeout

**Solution:** Increase timeouts in test files:
```typescript
// In beforeEach
await page.waitForURL(/\/(generate|flashcards)/, { timeout: 10000 }); // Increased from 5000

// In tests
await expect(element).toBeVisible({ timeout: 10000 }); // Increased from 5000
```

## Verification Checklist

- [ ] `.env.test` has `PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`)
- [ ] `.env.test` has `PUBLIC_SUPABASE_ANON_KEY` (not `SUPABASE_KEY`)
- [ ] `.env.test` has actual `OPENROUTER_API_KEY` (not placeholder)
- [ ] `.env.test` has `E2E_EMAIL=test@test.com`
- [ ] `.env.test` has `E2E_PASSWORD=10xCardsE2E`
- [ ] Test user exists in Supabase with correct password
- [ ] `.cursorignore` does NOT include `.env.test`
- [ ] `playwright.config.ts` loads `.env.test` correctly

## Files to Modify

1. **`.env.test`** - Fix variable names and add real API key
2. **`.cursorignore`** - Already fixed (removed `.env.test`)

## Files Already Correct

- ✅ `playwright.config.ts` - Loads `.env.test` correctly
- ✅ `e2e/flashcards/create-flashcard.spec.ts` - Uses environment variables correctly
- ✅ `e2e/generate/generate-flashcards.spec.ts` - Uses environment variables correctly

---

**Next Action:** Update `.env.test` with correct variable names and real API key, then run tests again.

