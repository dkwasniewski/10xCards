# Environment Variables Analysis

## Executive Summary

This document provides a comprehensive analysis of all environment variables across the 5 `.env` files in the project, their actual usage in the codebase, and recommendations for standardization.

### 🎯 Quick Summary

**Files analyzed:** 5 `.env` files (`.env`, `.env.local`, `.env.local.backup`, `.env.test`, `.env.example`)

**Variables found:** 14 unique variables

**Actually used in code:** 6 variables
- ✅ `SUPABASE_URL` - Required
- ✅ `SUPABASE_KEY` - Required
- ✅ `OPENROUTER_API_KEY` - Required
- ✅ `PUBLIC_SITE_URL` - Required (but has WRONG values in some files!)
- ✅ `E2E_EMAIL` - Required for E2E tests
- ✅ `E2E_PASSWORD` - Required for E2E tests

**Not used (can be removed):** 8 variables
- 🗑️ `PUBLIC_SUPABASE_URL` - Duplicate, never used
- 🗑️ `PUBLIC_SUPABASE_KEY` - Duplicate, never used
- 🗑️ `OPENROUTER_API_URL` - Hardcoded in service
- 🗑️ `SITE_URL` - Never used
- 🗑️ `E2E_USERNAME_ID` - Never used
- 🗑️ `E2E_USERNAME` - Duplicate of E2E_EMAIL

**⚠️ CRITICAL SECURITY ISSUE:** `.env.local.backup` is NOT in `.gitignore` and could be committed with real credentials!

**⚠️ WRONG VALUES:** `PUBLIC_SITE_URL` is set to Supabase URL instead of app URL in `.env.local`, `.env.local.backup`, and `.env.test`

### Before vs After

| File | Before (variables) | After (variables) | Change |
|------|-------------------|-------------------|--------|
| `.env` | 6 variables | 4 variables | ✅ Correct, remove OPENROUTER_API_URL, SITE_URL |
| `.env.local` | 12 variables | 6 variables | ⚠️ Remove 6 unused vars, fix PUBLIC_SITE_URL |
| `.env.local.backup` | 12 variables | 6 variables OR delete file | ⚠️ Remove 6 unused vars, fix PUBLIC_SITE_URL |
| `.env.test` | 12 variables | 6 variables | ⚠️ Remove 6 unused vars, fix PUBLIC_SITE_URL |
| `.env.example` | 6 variables | 4 variables | ✅ Correct, remove OPENROUTER_API_URL, SITE_URL |
| `src/env.d.ts` | 6 types | 4 types | ⚠️ Remove 2 unused type definitions |
| `.gitignore` | Missing backup | Includes backup | 🔒 Add .env.local.backup |

---

## 🗺️ Visual Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ENVIRONMENT VARIABLES USAGE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✅ USED IN CODE (6 variables)                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  SUPABASE_URL          → supabase.client.ts, reset-password.ts      │
│  SUPABASE_KEY          → supabase.client.ts                         │
│  OPENROUTER_API_KEY    → ai.service.ts                              │
│  PUBLIC_SITE_URL       → auth.service.ts, forgot-password.ts        │
│  E2E_EMAIL             → E2E test files                             │
│  E2E_PASSWORD          → E2E test files                             │
│                                                                     │
│  🗑️ NOT USED - REMOVE (8 variables)                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  PUBLIC_SUPABASE_URL   → Duplicate, never referenced               │
│  PUBLIC_SUPABASE_KEY   → Duplicate, never referenced               │
│  OPENROUTER_API_URL    → Hardcoded in service                      │
│  SITE_URL              → Never referenced                           │
│  E2E_USERNAME_ID       → Never referenced                           │
│  E2E_USERNAME          → Duplicate of E2E_EMAIL                     │
│                                                                     │
│  ⚠️ ISSUES FOUND                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  🔒 .env.local.backup NOT in .gitignore (SECURITY RISK!)           │
│  🐛 PUBLIC_SITE_URL has wrong value (Supabase URL instead of app)  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Environment Files Overview

| File | Purpose | Environment |
|------|---------|-------------|
| `.env` | Local development with local Supabase | Development (Local) |
| `.env.local` | Development with remote Supabase | Development (Remote) |
| `.env.local.backup` | Backup of `.env.local` | Backup |
| `.env.test` | E2E testing environment | Testing (Playwright) |
| `.env.example` | Template for new developers | Documentation |

---

## 🔍 Variable-by-Variable Analysis

### 1. **SUPABASE_URL**

**Status:** ✅ **REQUIRED** - Currently in use

**Found in:**
- ✅ `.env` (local: `http://127.0.0.1:54321`)
- ✅ `.env.local` (remote: `https://imqdgswlhuzufrfsxouw.supabase.co`)
- ✅ `.env.local.backup` (remote: `https://imqdgswlhuzufrfsxouw.supabase.co`)
- ✅ `.env.test` (remote: `https://imqdgswlhuzufrfsxouw.supabase.co`)
- ✅ `.env.example` (local: `http://127.0.0.1:54321`)

**Usage in code:**
- `src/db/supabase.client.ts:7` - Creates Supabase client
- `src/pages/api/reset-password.ts:133` - Extracts project ref for cookies
- `src/env.d.ts:18` - TypeScript type definition

**Recommendation:** ✅ Keep in all files

---

### 2. **SUPABASE_KEY**

**Status:** ✅ **REQUIRED** - Currently in use

**Found in:**
- ✅ `.env` (local key)
- ✅ `.env.local` (remote anon key)
- ✅ `.env.local.backup` (remote anon key)
- ✅ `.env.test` (remote anon key)
- ✅ `.env.example` (local key)

**Usage in code:**
- `src/db/supabase.client.ts:8` - Creates Supabase client
- `src/env.d.ts:19` - TypeScript type definition

**Recommendation:** ✅ Keep in all files

---

### 3. **PUBLIC_SUPABASE_URL**

**Status:** ⚠️ **NOT USED** - Defined but never referenced in code

**Found in:**
- ❌ `.env` (not present)
- ✅ `.env.local` (same as SUPABASE_URL)
- ✅ `.env.local.backup` (same as SUPABASE_URL)
- ✅ `.env.test` (same as SUPABASE_URL)
- ❌ `.env.example` (not present)

**Usage in code:**
- 🚫 **No actual code usage found!**
- Only mentioned in documentation files (FIX-E2E-TESTS-NOW.md, E2E-TESTS-FIX-SUMMARY.md)

**Recommendation:** 🗑️ **REMOVE** from all files - This is a duplicate that's not used anywhere in the actual codebase.

---

### 4. **PUBLIC_SUPABASE_KEY**

**Status:** ⚠️ **NOT USED** - Defined but never referenced in code

**Found in:**
- ❌ `.env` (not present)
- ✅ `.env.local` (same as SUPABASE_KEY)
- ✅ `.env.local.backup` (same as SUPABASE_KEY)
- ✅ `.env.test` (same as SUPABASE_KEY)
- ❌ `.env.example` (not present)

**Usage in code:**
- 🚫 **No actual code usage found!**
- Only mentioned in documentation files

**Recommendation:** 🗑️ **REMOVE** from all files - This is a duplicate that's not used anywhere in the actual codebase.

---

### 5. **OPENROUTER_API_KEY**

**Status:** ✅ **REQUIRED** - Currently in use

**Found in:**
- ✅ `.env` (actual key)
- ✅ `.env.local` (actual key)
- ✅ `.env.local.backup` (actual key)
- ✅ `.env.test` (actual key)
- ✅ `.env.example` (placeholder: `your_openrouter_api_key_here`)

**Usage in code:**
- `src/lib/services/ai.service.ts:13` - Used for flashcard generation
- `src/env.d.ts:20` - TypeScript type definition
- Documentation files (examples)

**Recommendation:** ✅ Keep in all files

---

### 6. **OPENROUTER_API_URL**

**Status:** ⚠️ **DEFINED BUT NOT USED**

**Found in:**
- ✅ `.env` (`https://openrouter.ai/api/v1`)
- ✅ `.env.local` (`https://openrouter.ai/api/v1`)
- ✅ `.env.local.backup` (`https://openrouter.ai/api/v1`)
- ✅ `.env.test` (`https://openrouter.ai/api/v1`)
- ✅ `.env.example` (`https://openrouter.ai/api/v1`)

**Usage in code:**
- `src/env.d.ts:21` - TypeScript type definition
- 🚫 **Never actually used in runtime code!**
- `OpenRouterService` (line 117) has this URL hardcoded as default: `"https://openrouter.ai/api/v1"`
- The service CAN accept a custom baseURL via constructor options, but it's never passed

**Recommendation:** 
- 🗑️ **REMOVE** from all files - The URL is already hardcoded in the service as default
- The value in `.env` files matches the hardcoded default anyway
- Only needed if you plan to use a different OpenRouter endpoint (unlikely)

---

### 7. **SITE_URL**

**Status:** ⚠️ **DEFINED BUT NOT USED**

**Found in:**
- ✅ `.env` (`http://localhost:3000`)
- ✅ `.env.local` (`https://imqdgswlhuzufrfsxouw.supabase.co`) ⚠️ Wrong value! Should be app URL, not Supabase URL
- ✅ `.env.local.backup` (same wrong value)
- ✅ `.env.test` (same wrong value)
- ✅ `.env.example` (`http://localhost:3000`)

**Usage in code:**
- `src/env.d.ts:22` - TypeScript type definition
- 🚫 **Never actually used in runtime code!**

**Recommendation:** 
- 🗑️ **REMOVE** if not needed
- If needed for future server-side URLs, fix the values in `.env.local`, `.env.local.backup`, and `.env.test`

---

### 8. **PUBLIC_SITE_URL**

**Status:** ✅ **REQUIRED** - Currently in use

**Found in:**
- ✅ `.env` (`http://localhost:3000`)
- ✅ `.env.local` (`https://imqdgswlhuzufrfsxouw.supabase.co`) ⚠️ Wrong value!
- ✅ `.env.local.backup` (same wrong value)
- ✅ `.env.test` (same wrong value)
- ✅ `.env.example` (`http://localhost:3000`)

**Usage in code:**
- `src/lib/services/auth.service.ts:24` - Email verification redirect
- `src/pages/api/forgot-password.ts:55` - Password reset redirect
- `src/env.d.ts:23` - TypeScript type definition

**Recommendation:** 
- ✅ **KEEP** in all files
- ⚠️ **FIX VALUES** in `.env.local`, `.env.local.backup`, and `.env.test`
- Should be the application URL, not the Supabase URL!

---

### 9. **E2E_USERNAME_ID**

**Status:** ⚠️ **NOT USED** - Only in E2E files, never referenced

**Found in:**
- ❌ `.env` (not present)
- ✅ `.env.local` (`65541b90-4a20-4e83-84b3-0f6d64c59fbb`)
- ✅ `.env.local.backup` (same)
- ✅ `.env.test` (same)
- ❌ `.env.example` (not present)

**Usage in code:**
- 🚫 **No code usage found!**

**Recommendation:** 🗑️ **REMOVE** from all files - Not used anywhere

---

### 10. **E2E_USERNAME**

**Status:** ⚠️ **DUPLICATE** - Same as E2E_EMAIL

**Found in:**
- ❌ `.env` (not present)
- ✅ `.env.local` (`test@test.com`)
- ✅ `.env.local.backup` (`test@test.com`)
- ✅ `.env.test` (`test@test.com`)
- ❌ `.env.example` (not present)

**Usage in code:**
- 🚫 **No code usage found!**

**Recommendation:** 🗑️ **REMOVE** - Use E2E_EMAIL instead (they're identical)

---

### 11. **E2E_EMAIL**

**Status:** ✅ **REQUIRED FOR E2E TESTS**

**Found in:**
- ❌ `.env` (not present - correct, not needed for dev)
- ✅ `.env.local` (`test@test.com`)
- ✅ `.env.local.backup` (`test@test.com`)
- ✅ `.env.test` (`test@test.com`)
- ❌ `.env.example` (not present - should add?)

**Usage in code:**
- `e2e/generate/generate-flashcards.spec.ts:28` - E2E test login
- `e2e/flashcards/create-flashcard.spec.ts:29` - E2E test login

**Recommendation:** 
- ✅ **KEEP** in `.env.local`, `.env.local.backup`, `.env.test`
- ❌ Don't add to `.env` (local dev doesn't need it)
- ❓ Consider adding to `.env.example` with comment that it's only for E2E

---

### 12. **E2E_PASSWORD**

**Status:** ✅ **REQUIRED FOR E2E TESTS**

**Found in:**
- ❌ `.env` (not present - correct, not needed for dev)
- ✅ `.env.local` (`10xCardsE2E`)
- ✅ `.env.local.backup` (`10xCardsE2E`)
- ✅ `.env.test` (`10xCardsE2E`)
- ❌ `.env.example` (not present - should add?)

**Usage in code:**
- `e2e/generate/generate-flashcards.spec.ts:29` - E2E test login
- `e2e/flashcards/create-flashcard.spec.ts:30` - E2E test login

**Recommendation:** 
- ✅ **KEEP** in `.env.local`, `.env.local.backup`, `.env.test`
- ❌ Don't add to `.env` (local dev doesn't need it)
- ❓ Consider adding to `.env.example` with comment that it's only for E2E

---

### 13. **BASE_URL** (Playwright)

**Status:** ✅ **USED IN PLAYWRIGHT CONFIG**

**Found in:**
- ❌ Not in any `.env` files (uses default in code)

**Usage in code:**
- `playwright.config.ts:34` - Base URL for E2E tests (defaults to `http://localhost:3000`)

**Recommendation:** 
- ✅ **OPTIONAL** - Works fine with default value
- Could add to `.env.test` if you want to test against different URLs

---

### 14. **CI** (Playwright)

**Status:** ✅ **USED IN PLAYWRIGHT CONFIG**

**Found in:**
- ❌ Not in any `.env` files (set by CI systems automatically)

**Usage in code:**
- `playwright.config.ts:19` - forbidOnly setting
- `playwright.config.ts:22` - retries setting
- `playwright.config.ts:58` - reuseExistingServer setting

**Recommendation:** 
- ✅ **DO NOT ADD** - This is automatically set by CI systems (GitHub Actions, etc.)

---

## 📊 Summary Table

| Variable | .env | .env.local | .env.test | .env.example | Used in Code? | Action |
|----------|------|------------|-----------|--------------|---------------|--------|
| SUPABASE_URL | ✅ | ✅ | ✅ | ✅ | ✅ Yes | ✅ Keep |
| SUPABASE_KEY | ✅ | ✅ | ✅ | ✅ | ✅ Yes | ✅ Keep |
| PUBLIC_SUPABASE_URL | ❌ | ✅ | ✅ | ❌ | ❌ No | 🗑️ Remove |
| PUBLIC_SUPABASE_KEY | ❌ | ✅ | ✅ | ❌ | ❌ No | 🗑️ Remove |
| OPENROUTER_API_KEY | ✅ | ✅ | ✅ | ✅ | ✅ Yes | ✅ Keep |
| OPENROUTER_API_URL | ✅ | ✅ | ✅ | ✅ | ❌ No | 🗑️ Remove |
| SITE_URL | ✅ | ✅ | ✅ | ✅ | ❌ No | 🗑️ Remove |
| PUBLIC_SITE_URL | ✅ | ✅ | ✅ | ✅ | ✅ Yes | ✅ Keep + Fix |
| E2E_USERNAME_ID | ❌ | ✅ | ✅ | ❌ | ❌ No | 🗑️ Remove |
| E2E_USERNAME | ❌ | ✅ | ✅ | ❌ | ❌ No | 🗑️ Remove |
| E2E_EMAIL | ❌ | ✅ | ✅ | ❌ | ✅ Yes | ✅ Keep |
| E2E_PASSWORD | ❌ | ✅ | ✅ | ❌ | ✅ Yes | ✅ Keep |

---

## 🎯 Recommended Actions

### 0. **🔒 SECURITY FIX (DO THIS FIRST!)**

Add `.env.local.backup` to `.gitignore` to prevent accidentally committing credentials:

```bash
# Add to .gitignore in the "environment variables" section:
.env.local.backup
```

### 1. **Remove Unused Variables**

Remove these from `.env.local`, `.env.local.backup`, and `.env.test`:
- `PUBLIC_SUPABASE_URL` (duplicate of SUPABASE_URL, not used)
- `PUBLIC_SUPABASE_KEY` (duplicate of SUPABASE_KEY, not used)
- `E2E_USERNAME_ID` (never used)
- `E2E_USERNAME` (duplicate of E2E_EMAIL, not used)
- `SITE_URL` (not used, PUBLIC_SITE_URL is used instead)
- `OPENROUTER_API_URL` (hardcoded in service, not needed)

### 2. **Fix Incorrect Values**

In `.env.local`, `.env.local.backup`, and `.env.test`, fix:
```bash
# WRONG (current):
SITE_URL=https://imqdgswlhuzufrfsxouw.supabase.co
PUBLIC_SITE_URL=https://imqdgswlhuzufrfsxouw.supabase.co

# SHOULD BE (if you have a deployed app):
PUBLIC_SITE_URL=https://your-app-url.com

# OR (for local testing):
PUBLIC_SITE_URL=http://localhost:3000
```

### 3. **Remove OPENROUTER_API_URL**

This URL is hardcoded in `OpenRouterService` (line 117) as `"https://openrouter.ai/api/v1"` which matches the `.env` value. The service can accept a custom baseURL but this is never used, so the environment variable is redundant.

### 4. **Update TypeScript Definitions**

After removing unused variables, update `src/env.d.ts`:

```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly PUBLIC_SITE_URL: string;
}
```

---

## 📝 Corrected `.env` Files

### `.env` (Local Development)
```bash
# Supabase Configuration (Local Development)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# OpenRouter API Configuration
OPENROUTER_API_KEY=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

# Site URL Configuration
PUBLIC_SITE_URL=http://localhost:3000
```

### `.env.local` (Remote Development)
```bash
# Supabase Configuration (Remote Development)
SUPABASE_URL=https://imqdgswlhuzufrfsxouw.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWRnc3dsaHV6dWZyZnN4b3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDg1NDUsImV4cCI6MjA4MDMyNDU0NX0.d2AOnDe7rP7gzPMZHS2tzfHCae4Ou_gGGATx71cjKG0

# OpenRouter API Configuration
OPENROUTER_API_KEY=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

# Site URL Configuration (use your actual app URL)
PUBLIC_SITE_URL=http://localhost:3000

# E2E Testing Credentials
E2E_EMAIL=test@test.com
E2E_PASSWORD=10xCardsE2E
```

### `.env.test` (E2E Testing)
```bash
# Supabase Configuration (Testing)
SUPABASE_URL=https://imqdgswlhuzufrfsxouw.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWRnc3dsaHV6dWZyZnN4b3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDg1NDUsImV4cCI6MjA4MDMyNDU0NX0.d2AOnDe7rP7gzPMZHS2tzfHCae4Ou_gGGATx71cjKG0

# OpenRouter API Configuration
OPENROUTER_API_KEY=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

# Site URL Configuration
PUBLIC_SITE_URL=http://localhost:3000

# E2E Testing Credentials
E2E_EMAIL=test@test.com
E2E_PASSWORD=10xCardsE2E
```

### `.env.example` (Template)
```bash
# Supabase Configuration (Local Development)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Site URL Configuration
PUBLIC_SITE_URL=http://localhost:3000

# E2E Testing Credentials (only needed if running E2E tests)
# E2E_EMAIL=test@test.com
# E2E_PASSWORD=your_test_password
```

---

## 🔒 Security Notes

**⚠️ IMPORTANT:** The `.env` files in this analysis contain actual API keys and credentials that should **NEVER** be committed to version control!

**Current `.gitignore` status:**
- ✅ `.env` - ignored
- ✅ `.env.local` - ignored
- ❌ `.env.local.backup` - **NOT IGNORED!** ⚠️ 
- ✅ `.env.test` - ignored
- ✅ `.env.production` - ignored

**ACTION REQUIRED:** Add `.env.local.backup` to `.gitignore`:

```gitignore
# environment variables
.env
.env.test
.env.local
.env.local.backup
.env.production
.env.*.local
```

Only `.env.example` should be committed (with placeholder values).

---

## 📚 References

**Files Analyzed:**
- All 5 `.env` files
- `src/db/supabase.client.ts`
- `src/lib/services/ai.service.ts`
- `src/lib/services/auth.service.ts`
- `src/pages/api/reset-password.ts`
- `src/pages/api/forgot-password.ts`
- `src/env.d.ts`
- `playwright.config.ts`
- All E2E test files

**Total grep searches:**
- `import.meta.env.*` occurrences: 14 files
- `process.env.*` occurrences: 9 files

---

## ✅ Step-by-Step Action Plan

Follow these steps in order to clean up your environment variables:

### Step 1: Security Fix (CRITICAL)
```bash
# Add .env.local.backup to .gitignore
echo ".env.local.backup" >> .gitignore
```

### Step 2: Update .env (Local Development)
No changes needed - this file is already correct!

### Step 3: Update .env.local (Remote Development)
Edit `.env.local` to remove unused variables and fix PUBLIC_SITE_URL:

```bash
# Supabase Configuration (Remote Development)
SUPABASE_URL=https://imqdgswlhuzufrfsxouw.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWRnc3dsaHV6dWZyZnN4b3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDg1NDUsImV4cCI6MjA4MDMyNDU0NX0.d2AOnDe7rP7gzPMZHS2tzfHCae4Ou_gGGATx71cjKG0

# OpenRouter API Configuration
OPENROUTER_API_KEY=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

# Site URL Configuration (use your actual app URL or localhost for dev)
PUBLIC_SITE_URL=http://localhost:3000

# E2E Testing Credentials
E2E_EMAIL=test@test.com
E2E_PASSWORD=10xCardsE2E
```

**Variables removed:**
- ❌ PUBLIC_SUPABASE_URL
- ❌ PUBLIC_SUPABASE_KEY
- ❌ OPENROUTER_API_URL
- ❌ SITE_URL
- ❌ E2E_USERNAME_ID
- ❌ E2E_USERNAME

**Values fixed:**
- ✅ PUBLIC_SITE_URL: Changed from Supabase URL to app URL

### Step 4: Update .env.local.backup
Apply the same changes as Step 3, or simply delete this file if it's truly just a backup.

### Step 5: Update .env.test (E2E Testing)
Edit `.env.test` with the same structure as `.env.local`:

```bash
# Supabase Configuration (Testing)
SUPABASE_URL=https://imqdgswlhuzufrfsxouw.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWRnc3dsaHV6dWZyZnN4b3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDg1NDUsImV4cCI6MjA4MDMyNDU0NX0.d2AOnDe7rP7gzPMZHS2tzfHCae4Ou_gGGATx71cjKG0

# OpenRouter API Configuration
OPENROUTER_API_KEY=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

# Site URL Configuration
PUBLIC_SITE_URL=http://localhost:3000

# E2E Testing Credentials
E2E_EMAIL=test@test.com
E2E_PASSWORD=10xCardsE2E
```

### Step 6: Update .env.example (Template for new developers)
No changes needed - this file is already correct!

### Step 7: Update TypeScript Definitions
Edit `src/env.d.ts` to remove unused variable types:

```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly PUBLIC_SITE_URL: string;
}
```

**Variables removed from types:**
- ❌ OPENROUTER_API_URL
- ❌ SITE_URL

### Step 8: Test Everything
```bash
# Test local development
npm run dev

# Test E2E (in a separate terminal)
npm run test:e2e

# Verify no errors related to missing environment variables
```

### Step 9: Verify .gitignore
```bash
# Check that sensitive files are ignored
git status

# You should NOT see:
# - .env
# - .env.local
# - .env.local.backup
# - .env.test

# You SHOULD see:
# - .env.example (if you made changes)
```

---

## 🎉 Expected Results

After following all steps:

1. ✅ All `.env` files contain only variables that are actually used
2. ✅ No duplicate or redundant variables
3. ✅ `PUBLIC_SITE_URL` has the correct value in all files
4. ✅ `.env.local.backup` is in `.gitignore`
5. ✅ TypeScript definitions match actual environment variables
6. ✅ Application runs without environment variable errors
7. ✅ E2E tests run successfully

