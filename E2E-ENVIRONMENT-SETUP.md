# E2E Test Environment Setup

## Overview

This project uses **different Supabase instances** for development and E2E testing:

- **Development**: Local Supabase (`http://127.0.0.1:54321`)
- **E2E Tests**: Remote Supabase (`https://imqdgswlhuzufrfsxouw.supabase.co`)

## How It Works

### Environment Files

1. **`.env`** - Local development configuration
   - Contains local Supabase URL and keys
   - Used when running `npm run dev`
   - Always present, never modified by tests

2. **`.env.test`** - E2E test configuration
   - Contains remote Supabase URL and keys
   - Contains E2E test user credentials
   - Source of truth for E2E environment
   - Never loaded directly by Astro

3. **`.env.local`** - Temporary test configuration
   - Created automatically during E2E tests
   - Copy of `.env.test` (Astro loads this with higher priority)
   - Automatically deleted after tests finish
   - In `.gitignore` - never committed

### Running Development Server

```bash
npm run dev
```

- Loads `.env` (local Supabase)
- Connects to local database at `http://127.0.0.1:54321`
- No impact on E2E test configuration

### Running E2E Tests

```bash
npm run test:e2e
```

**What happens:**

1. Playwright starts and calls `node scripts/dev-e2e.js`
2. Script backs up existing `.env.local` (if any)
3. Script copies `.env.test` → `.env.local`
4. Astro dev server starts and loads `.env.local` (remote Supabase)
5. Tests run against remote Supabase instance
6. When tests finish or are interrupted:
   - `.env.local` is deleted
   - Original `.env.local` is restored (if it existed)

### The Magic Script: `scripts/dev-e2e.js`

This script ensures:
- ✅ E2E tests use remote Supabase
- ✅ Development uses local Supabase
- ✅ Automatic cleanup after tests
- ✅ No manual environment switching needed

## Configuration Files

### `.env` (Development)
```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
OPENROUTER_API_KEY=your-key-here
```

### `.env.test` (E2E Testing)
```bash
SUPABASE_URL=https://imqdgswlhuzufrfsxouw.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
E2E_EMAIL=test@test.com
E2E_PASSWORD=10xCardsE2E
OPENROUTER_API_KEY=your-key-here
```

## Playwright Configuration

In `playwright.config.ts`:

```typescript
webServer: {
  command: "node scripts/dev-e2e.js",  // Uses custom script
  url: "http://localhost:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
}
```

## Benefits

1. **Isolation**: Dev and test environments are completely separate
2. **Automatic**: No manual environment switching
3. **Safe**: Original configuration is always preserved
4. **Clean**: Automatic cleanup prevents environment pollution
5. **Consistent**: All developers use the same test environment

## Troubleshooting

### Tests are using local Supabase instead of remote

Check if `.env.local` exists and contains remote config:
```bash
cat .env.local | grep SUPABASE_URL
```

Should show: `https://imqdgswlhuzufrfsxouw.supabase.co`

### .env.local not being cleaned up

If tests crash, manually remove it:
```bash
rm .env.local
```

### Want to verify which environment is being used

During tests, check the Astro dev server logs - it will show which Supabase URL is being used.

## Important Notes

- ⚠️ Never commit `.env.local` (already in `.gitignore`)
- ⚠️ Keep `.env.test` updated with valid remote credentials
- ⚠️ Both `.env` and `.env.test` need `OPENROUTER_API_KEY` for AI features
- ✅ The test user (`test@test.com`) must exist in the remote Supabase instance


