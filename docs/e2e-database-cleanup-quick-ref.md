# E2E Database Cleanup - Quick Reference

## What It Does

Automatically cleans all test data from Supabase after E2E tests complete.

## How It Works

- Runs **once** after all tests finish
- Deletes only test user's data
- Respects foreign key constraints
- Shows cleanup summary in console

## Usage

```bash
# Just run tests normally - cleanup happens automatically
npm run test:e2e

# Or run specific tests
npx playwright test e2e/example.spec.ts
```

## Console Output

```
🧹 Starting database cleanup...
🔍 Found test user: test@test.com (ID: xxx)
📋 Deleting reviews...
✅ Deleted 5 reviews
📋 Deleting event logs...
✅ Deleted 12 event logs
📋 Deleting flashcards...
✅ Deleted 8 flashcards
📋 Deleting AI generation sessions...
✅ Deleted 2 AI generation sessions
✨ Database cleanup completed successfully!
```

## Deletion Order

1. **reviews** → 2. **event_logs** → 3. **flashcards** → 4. **ai_generation_sessions**

## Environment Variables Required

From `.env.test`:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `E2E_EMAIL`
- `E2E_PASSWORD`

## Configuration

**File**: `e2e/global-teardown.ts`
**Config**: `playwright.config.ts` → `globalTeardown: "./e2e/global-teardown.ts"`

## Troubleshooting

| Issue               | Solution                                             |
| ------------------- | ---------------------------------------------------- |
| Cleanup not running | Ensure Playwright completes normally                 |
| Auth errors         | Verify `E2E_EMAIL` and `E2E_PASSWORD` in `.env.test` |
| Permission errors   | Check RLS policies allow user to delete own data     |
| Foreign key errors  | Don't modify deletion order                          |

## Full Documentation

See: `docs/e2e-database-cleanup.md`

