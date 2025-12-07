# E2E Database Cleanup Implementation

## Overview

Automatic Supabase database cleanup after all E2E tests complete using Playwright's global teardown feature.

## Implementation

### Global Teardown File

**Location**: `e2e/global-teardown.ts`

This file:

- Runs **once** after all E2E tests complete
- Connects to Supabase using test environment credentials
- Authenticates as the E2E test user
- Deletes all test data in proper order (respecting foreign key constraints)
- Signs out and cleans up

### Deletion Order

Data is deleted in this order to respect foreign key constraints:

1. **reviews** - Delete review records first (references flashcards)
2. **event_logs** - Delete event logs (references flashcards, ai_generation_sessions, reviews)
3. **flashcards** - Delete flashcards (references ai_generation_sessions)
4. **ai_generation_sessions** - Delete AI generation sessions last

### Configuration

**Playwright Config** (`playwright.config.ts`):

```typescript
export default defineConfig({
  // Global teardown - cleanup database after all tests
  globalTeardown: "./e2e/global-teardown.ts",
  // ... rest of config
});
```

## Environment Variables

The teardown uses the following environment variables from `.env.test`:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key (public key)
- `E2E_EMAIL` - Test user email for authentication
- `E2E_PASSWORD` - Test user password

## Database Schema

Tables cleaned (from `src/db/database.types.ts`):

### ai_generation_sessions

- Stores AI flashcard generation sessions
- Fields: `id`, `user_id`, `input_text`, `model`, `generation_duration`, etc.

### flashcards

- Stores flashcard data
- Fields: `id`, `user_id`, `front`, `back`, `source`, `ai_session_id`, etc.
- Foreign key: `ai_session_id` → `ai_generation_sessions.id`

### reviews

- Stores flashcard review history
- Fields: `id`, `user_id`, `flashcard_id`, `rating`, `next_due`, etc.
- Foreign key: `flashcard_id` → `flashcards.id`

### event_logs

- Stores user activity events
- Fields: `id`, `user_id`, `event_type`, `flashcard_id`, `ai_session_id`, `review_id`, etc.
- Foreign keys to flashcards, ai_generation_sessions, reviews

## Usage

### Running Tests with Cleanup

```bash
# Run all E2E tests - cleanup happens automatically at the end
npm run test:e2e

# Run specific test file - cleanup still happens after all tests
npx playwright test e2e/generate/generate-flashcards.spec.ts
```

### Manual Verification

To verify cleanup is working:

1. Run tests and let them create data
2. Check the console output at the end - you should see cleanup logs
3. Verify database is clean by logging into Supabase dashboard

### Expected Output

```
🧹 Starting database cleanup...

🔍 Found test user: test@test.com (ID: xxx-xxx-xxx)

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

## Error Handling

The teardown includes comprehensive error handling:

- **Missing credentials**: Throws error if environment variables are missing
- **Authentication failure**: Reports and throws if test user login fails
- **Deletion errors**: Logs specific errors but continues with remaining deletions
- **Graceful cleanup**: Always signs out even if errors occur

## Benefits

1. **Clean Slate**: Each test run starts with a clean database
2. **Automatic**: No manual cleanup needed
3. **Safe**: Only deletes data for the test user
4. **Visible**: Console output shows exactly what was cleaned
5. **Reliable**: Respects database constraints and foreign keys

## Troubleshooting

### Cleanup not running

- Ensure Playwright completes normally (not forcefully killed)
- Check that `globalTeardown` is configured in `playwright.config.ts`

### Authentication errors

- Verify `E2E_EMAIL` and `E2E_PASSWORD` in `.env.test`
- Ensure test user exists in Supabase

### Foreign key constraint errors

- Deletion order is critical - do not change it
- Order respects all foreign key relationships

### Permission errors

- Using anon key is sufficient as we authenticate as the test user
- RLS policies should allow users to delete their own data
- If issues persist, verify RLS policies in Supabase

## Notes

- Cleanup runs **after all tests**, not after each test
- Uses the same credentials as the tests (`.env.test`)
- Only affects data owned by the test user
- Does not delete the test user account itself
- Safe to run multiple times (idempotent)

## Future Enhancements

Potential improvements:

- Add flag to skip cleanup for debugging
- Support cleaning specific date ranges
- Add database snapshot/restore functionality
- Create setup fixture for initial test data
