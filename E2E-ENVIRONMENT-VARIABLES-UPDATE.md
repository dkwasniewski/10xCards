# E2E Environment Variables Update

⚠️ **IMPORTANT**: This document describes outdated information about environment variables. The environment configuration has been updated and simplified.

## What Changed (December 2025)

The following environment variables were **REMOVED** as they were not actually used in the codebase:

- ❌ `PUBLIC_SUPABASE_URL` (was duplicate of `SUPABASE_URL`)
- ❌ `PUBLIC_SUPABASE_KEY` / `PUBLIC_SUPABASE_ANON_KEY` (was duplicate of `SUPABASE_KEY`)
- ❌ `OPENROUTER_API_URL` (hardcoded in service)
- ❌ `SITE_URL` (never used)
- ❌ `E2E_USERNAME_ID` (never used)
- ❌ `E2E_USERNAME` (duplicate of `E2E_EMAIL`)

## Current Correct Configuration

### For `.env.test` (E2E Testing)

```bash
# Supabase Configuration (Testing)
SUPABASE_URL=https://imqdgswlhuzufrfsxouw.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenRouter API Configuration
OPENROUTER_API_KEY=sk-or-v1-...

# Site URL Configuration
PUBLIC_SITE_URL=http://localhost:3000

# E2E Testing Credentials
E2E_EMAIL=test@test.com
E2E_PASSWORD=10xCardsE2E
```

## Outdated Documentation

The following documentation files contain **outdated** information about environment variables:

- `FIX-E2E-TESTS-NOW.md` - References removed `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
- `E2E-TESTS-FIX-SUMMARY.md` - References removed variables
- `E2E-TESTS-RESTORATION-GUIDE.md` - References removed variables

**⚠️ Do not follow the environment variable setup in those files!**

Instead, refer to:
- `.env.example` - Template with correct variables
- `ENV_VARIABLES_ANALYSIS.md` - Complete analysis and current configuration

## Why These Variables Were Removed

1. **PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY**: These were duplicates of `SUPABASE_URL` and `SUPABASE_KEY`. The code actually uses the non-PUBLIC versions via `import.meta.env`, not client-side access.

2. **OPENROUTER_API_URL**: The OpenRouter service has this URL hardcoded as `https://openrouter.ai/api/v1` (line 117 in `openrouter.service.ts`). The environment variable was defined but never used.

3. **SITE_URL**: Defined but never referenced in any code. `PUBLIC_SITE_URL` is used instead.

4. **E2E_USERNAME_ID**: Never referenced in any test files.

5. **E2E_USERNAME**: Exact duplicate of `E2E_EMAIL` with same value. Tests only use `E2E_EMAIL`.

## Migration Guide

If you have existing `.env.test` or `.env.local` files with old variables:

1. Remove the variables listed above
2. Ensure `PUBLIC_SITE_URL` is set to your app URL (not Supabase URL!)
3. Keep these required variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENROUTER_API_KEY`
   - `PUBLIC_SITE_URL`
   - `E2E_EMAIL` (for E2E tests)
   - `E2E_PASSWORD` (for E2E tests)

See `ENV_VARIABLES_ANALYSIS.md` for complete details and step-by-step instructions.


