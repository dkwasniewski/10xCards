# Local Supabase Setup & Connection Guide

**Date:** December 7, 2025  
**Status:** ✅ FIXED - Connection working properly

## Problem Summary

The local Supabase connection stopped working due to:

1. **Missing `.env` file** - Environment variables were not configured
2. **Database was reset** - Running `supabase db reset` wiped all users and data
3. **Email confirmation enabled** - Required manual confirmation for new users

## Solution Implemented

### 1. Created `.env` File

Created `/Users/danielkwasniewski/Desktop/10xCards/.env` with proper local Supabase credentials:

```env
# Supabase Configuration (Local Development)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# OpenRouter API Key (for AI flashcard generation)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Site URL (for email redirects)
PUBLIC_SITE_URL=http://localhost:3000
```

**Note:** The `SUPABASE_KEY` is the **anon key** from local Supabase (same for all local instances).

### 2. Disabled Email Confirmation for Local Development

Updated `supabase/config.toml`:

```toml
[auth.email]
enable_confirmations = false  # Disabled for local development
```

This allows users to login immediately after registration without email confirmation.

### 3. Created Seed File

Created `supabase/seed.sql` to automatically populate test data when resetting the database:

- **Test User 1:** `test@example.com` / `testpassword123`
- **Test User 2:** `demo@example.com` / `testpassword123`
- **Sample flashcards** for both users

### 4. Created Test Connection Script

Created `scripts/test-local-connection.ts` to verify Supabase connection and create test users.

## Understanding Database Reset

### What `supabase db reset` Does:

⚠️ **WARNING:** This is a **destructive operation**!

1. **Drops the entire local database** (all tables, data, users)
2. **Recreates the database schema from scratch**
3. **Re-runs all migrations** in order (from `supabase/migrations/`)
4. **Runs seed files** (from `supabase/seed.sql`)

### When to Use `supabase db reset`:

✅ **Good reasons:**
- You added new migrations and want to test them from scratch
- Your database schema is corrupted
- You want to start fresh with clean seed data
- You're testing migration rollback/replay scenarios

❌ **Bad reasons:**
- Just to "fix" auth issues (usually it's a different problem)
- You have important test data you want to keep
- You're not sure what the issue is (investigate first!)

### Safer Alternatives:

Instead of resetting, try:

```bash
# Just restart Supabase (keeps data)
supabase stop
supabase start

# Check migrations status
supabase migration list

# Repair migrations if needed
supabase migration repair <version>

# Only reset if absolutely necessary
supabase db reset
```

## Local Development Workflow

### Starting Everything:

```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Start Astro dev server
npm run dev
```

### Useful URLs:

- **App:** http://localhost:3000
- **Supabase Studio:** http://127.0.0.1:54323
- **Mailpit (Email Testing):** http://127.0.0.1:54324
- **API:** http://127.0.0.1:54321

### Test Credentials:

After seeding (or running the test script), you can login with:

- Email: `test@example.com`
- Password: `testpassword123`

or

- Email: `demo@example.com`
- Password: `testpassword123`

## Verifying Connection

Run the test script to verify everything works:

```bash
npx tsx scripts/test-local-connection.ts
```

Expected output:
```
✅ Database connection successful!
✅ Test user exists: test@example.com
✅ All tests passed! Your Supabase connection is working.
```

## Database Management Commands

### Checking Database Status:

```bash
# Check Supabase status
supabase status

# Check running containers
docker ps | grep supabase

# Check volumes (where data is stored)
docker volume ls --filter label=com.supabase.cli.project=10xCards
```

### Inspecting the Database:

```bash
# Connect to database directly
docker exec -it supabase_db_10xCards psql -U postgres

# Check users
docker exec supabase_db_10xCards psql -U postgres -c "SELECT id, email, email_confirmed_at FROM auth.users;"

# Check flashcards
docker exec supabase_db_10xCards psql -U postgres -c "SELECT id, user_id, front FROM flashcards LIMIT 5;"

# Check RLS status
docker exec supabase_db_10xCards psql -U postgres -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```

## Migration History

Your current migrations (in order):

1. `20251014000001_enable_extensions_and_enums.sql` - Extensions and enums
2. `20251014000002_create_core_tables.sql` - Tables creation
3. `20251014000003_create_indexes.sql` - Indexes
4. `20251014000004_create_rls_policies.sql` - RLS policies (enabled)
5. `20251014000005_create_triggers_and_functions.sql` - Triggers
6. `20251014000006_disable_rls_policies.sql` - **Disabled RLS** (⚠️ conflict)
7. `20251118000001_add_flashcards_user_created_index.sql` - Index
8. `20251207120000_enable_rls_policies.sql` - **Re-enabled RLS** (resolved conflict)
9. `20251207120100_enable_rls_event_logs.sql` - RLS for event_logs

**Note:** Migration #6 was disabling RLS while #4 enabled it. This was causing auth issues. Migration #8 properly re-enabled RLS with comprehensive policies.

## Troubleshooting

### Issue: "Can't connect to Supabase"

**Check:**
1. Is Supabase running? `supabase status`
2. Does `.env` file exist with correct values?
3. Is frontend running on port 3000? `npm run dev`

**Fix:**
```bash
# Restart Supabase
supabase stop
supabase start

# Verify .env file
cat .env
```

### Issue: "Login fails with 'Invalid credentials'"

**Check:**
1. Does the user exist in the database?
2. Is the email confirmed?

**Fix:**
```bash
# Check users
docker exec supabase_db_10xCards psql -U postgres -c "SELECT id, email, email_confirmed_at FROM auth.users;"

# Manually confirm a user's email
docker exec supabase_db_10xCards psql -U postgres -c "UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'your@email.com';"

# Or reset and use seed data
supabase db reset
```

### Issue: "All my data is gone!"

**Likely cause:** You ran `supabase db reset` which wipes everything.

**Fix:**
```bash
# Reset and seed with test data
supabase db reset

# Or manually create a user
npx tsx scripts/test-local-connection.ts
```

### Issue: "Password reset not working"

**Check:**
1. Is Mailpit running? http://127.0.0.1:54324
2. Is email confirmation disabled in `supabase/config.toml`?

**Fix:**
- Check Mailpit for the reset email
- The reset link will be there with the token

## Important Files

- **`.env`** - Environment variables (local Supabase connection)
- **`supabase/config.toml`** - Supabase configuration
- **`supabase/migrations/`** - Database migrations
- **`supabase/seed.sql`** - Seed data for local development
- **`src/db/supabase.client.ts`** - Supabase client configuration
- **`src/middleware/index.ts`** - Authentication middleware

## Next Steps

1. ✅ Connection working - `.env` file created
2. ✅ Test user created - Can login locally
3. ✅ Seed file created - Automatic test data on reset
4. ✅ Email confirmation disabled - Easier local development
5. 🔄 **You may need to add your OpenRouter API key** to `.env` for AI features

## Summary

Your users disappeared because `supabase db reset` **completely wipes the database**. It's like reformatting your hard drive - everything goes! 💥

The good news:
- ✅ Connection is now properly configured
- ✅ Seed file will recreate test users automatically
- ✅ Email confirmation disabled for easier testing
- ✅ Test script available to verify connection

**Pro tip:** In the future, use `supabase stop/start` instead of `reset` to preserve your data!

