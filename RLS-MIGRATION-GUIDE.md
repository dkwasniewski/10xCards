# RLS Migration Guide

## Overview

This guide explains how to execute the RLS (Row Level Security) migration that re-enables comprehensive security policies for the `flashcards`, `ai_generation_sessions`, and `reviews` tables.

## Migration Files

**Files:** 
- `supabase/migrations/20251207120000_enable_rls_policies.sql`
- `supabase/migrations/20251207120100_enable_rls_event_logs.sql`

**Purpose:** Re-enable Row Level Security with granular policies for all CRUD operations

**Affected Tables:**
- `flashcards`
- `ai_generation_sessions`
- `reviews`
- `event_logs`

## What This Migration Does

### 1. Re-enables RLS on All Three Tables
```sql
alter table ai_generation_sessions enable row level security;
alter table flashcards enable row level security;
alter table reviews enable row level security;
```

### 2. Creates Granular Policies for Each Table

For **each table**, the migrations create **8 policies** (2 per operation type):

#### SELECT Policies
- `{table}_select_own_authenticated` - Allows authenticated users to view their own data
- `{table}_select_block_anon` - Blocks anonymous users from viewing any data

#### INSERT Policies
- `{table}_insert_own_authenticated` - Allows authenticated users to create their own records
- `{table}_insert_block_anon` - Blocks anonymous users from creating records

#### UPDATE Policies
- `{table}_update_own_authenticated` - Allows authenticated users to update their own records
- `{table}_update_block_anon` - Blocks anonymous users from updating records

#### DELETE Policies
- `{table}_delete_own_authenticated` - Allows authenticated users to delete their own records
- `{table}_delete_block_anon` - Blocks anonymous users from deleting records

**Total:** 32 policies (8 policies × 4 tables)

## Prerequisites

Before running the migration, ensure:

1. ✅ Supabase CLI is installed
2. ✅ You're logged into Supabase CLI (`supabase login`)
3. ✅ Supabase is running locally OR you're targeting the correct remote project
4. ✅ You have backed up your database (recommended for production)

## Execution Instructions

### Option 1: Local Development (Recommended for Testing)

#### Step 1: Start Supabase Locally

```bash
supabase start
```

This will start your local Supabase instance with the current database state.

#### Step 2: Apply the Migration

```bash
supabase db push
```

This command will:
- Detect new migration files
- Apply them to your local database
- Show you which migrations were applied

#### Step 3: Verify the Migration

```bash
supabase db reset
```

This command will:
- Reset your local database
- Re-run all migrations from scratch
- Ensure migrations can be applied cleanly

Alternatively, you can verify manually:

```bash
# Connect to local database
psql postgresql://postgres:postgres@localhost:54322/postgres

# Run verification queries (see below)
```

### Option 2: Remote/Production Database

⚠️ **CAUTION:** Always test on a staging environment first!

#### Step 1: Link to Your Remote Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference ID.

#### Step 2: Review Changes Before Applying

```bash
supabase db diff --linked
```

This shows you exactly what changes will be made to the remote database.

#### Step 3: Apply to Remote Database

```bash
supabase db push --linked
```

This will apply the migration to your remote/production database.

⚠️ **IMPORTANT:** This operation is irreversible without a rollback migration!

### Option 3: Manual Application (Advanced)

If you need to apply the migration manually:

#### Step 1: Connect to Your Database

```bash
# For local development
psql postgresql://postgres:postgres@localhost:54322/postgres

# For remote (get connection string from Supabase Dashboard)
psql "YOUR_CONNECTION_STRING"
```

#### Step 2: Execute the Migration File

```bash
# From within psql
\i supabase/migrations/20251207120000_enable_rls_policies.sql
```

Or from the command line:

```bash
# For local
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/20251207120000_enable_rls_policies.sql

# For remote
psql "YOUR_CONNECTION_STRING" -f supabase/migrations/20251207120000_enable_rls_policies.sql
```

## Verification

After applying the migration, verify that RLS is properly configured:

### 1. Check RLS is Enabled

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('ai_generation_sessions', 'flashcards', 'reviews', 'event_logs');
```

**Expected Output:**
```
 schemaname |       tablename        | rowsecurity 
------------+------------------------+-------------
 public     | ai_generation_sessions | t
 public     | flashcards             | t
 public     | reviews                | t
 public     | event_logs             | t
```

All four tables should have `rowsecurity = t` (true).

### 2. List All Policies

```sql
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('ai_generation_sessions', 'flashcards', 'reviews', 'event_logs')
ORDER BY tablename, cmd, roles;
```

**Expected Output:** You should see 32 policies total (8 per table).

### 3. Test Policy Enforcement

#### Test as Authenticated User

```sql
-- Set the user context (replace with a real user_id from auth.users)
SET request.jwt.claims = '{"sub": "USER_UUID_HERE"}';

-- These queries should only return data for the specified user
SELECT count(*) FROM flashcards WHERE user_id = 'USER_UUID_HERE';
SELECT count(*) FROM ai_generation_sessions WHERE user_id = 'USER_UUID_HERE';
SELECT count(*) FROM reviews WHERE user_id = 'USER_UUID_HERE';
SELECT count(*) FROM event_logs WHERE user_id = 'USER_UUID_HERE';
```

#### Test as Anonymous User

```sql
-- Reset to anonymous
RESET request.jwt.claims;

-- These should return 0 rows due to RLS blocking anonymous access
SELECT count(*) FROM flashcards;
SELECT count(*) FROM ai_generation_sessions;
SELECT count(*) FROM reviews;
SELECT count(*) FROM event_logs;
```

### 4. Application-Level Testing

After applying the migration, test your application:

1. **Login Test:** Verify users can log in successfully
2. **Flashcard Operations:**
   - Create a new flashcard → Should succeed
   - View your flashcards → Should see only your cards
   - Edit a flashcard → Should succeed
   - Delete a flashcard → Should succeed
3. **AI Generation:**
   - Generate flashcards with AI → Should create session and cards
   - View generation history → Should see only your sessions
4. **Reviews:**
   - Create a review → Should succeed
   - View review history → Should see only your reviews

## Rollback Instructions

If you need to rollback this migration:

### Option 1: Create a Rollback Migration

Create a new migration file to reverse the changes:

```bash
# File: supabase/migrations/20251207120001_rollback_rls_policies.sql
```

```sql
-- Disable RLS and drop all policies
ALTER TABLE ai_generation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs DISABLE ROW LEVEL SECURITY;

-- Drop all policies for ai_generation_sessions
DROP POLICY IF EXISTS ai_sessions_select_own_authenticated ON ai_generation_sessions;
DROP POLICY IF EXISTS ai_sessions_select_block_anon ON ai_generation_sessions;
DROP POLICY IF EXISTS ai_sessions_insert_own_authenticated ON ai_generation_sessions;
DROP POLICY IF EXISTS ai_sessions_insert_block_anon ON ai_generation_sessions;
DROP POLICY IF EXISTS ai_sessions_update_own_authenticated ON ai_generation_sessions;
DROP POLICY IF EXISTS ai_sessions_update_block_anon ON ai_generation_sessions;
DROP POLICY IF EXISTS ai_sessions_delete_own_authenticated ON ai_generation_sessions;
DROP POLICY IF EXISTS ai_sessions_delete_block_anon ON ai_generation_sessions;

-- Drop all policies for flashcards
DROP POLICY IF EXISTS flashcards_select_own_authenticated ON flashcards;
DROP POLICY IF EXISTS flashcards_select_block_anon ON flashcards;
DROP POLICY IF EXISTS flashcards_insert_own_authenticated ON flashcards;
DROP POLICY IF EXISTS flashcards_insert_block_anon ON flashcards;
DROP POLICY IF EXISTS flashcards_update_own_authenticated ON flashcards;
DROP POLICY IF EXISTS flashcards_update_block_anon ON flashcards;
DROP POLICY IF EXISTS flashcards_delete_own_authenticated ON flashcards;
DROP POLICY IF EXISTS flashcards_delete_block_anon ON flashcards;

-- Drop all policies for reviews
DROP POLICY IF EXISTS reviews_select_own_authenticated ON reviews;
DROP POLICY IF EXISTS reviews_select_block_anon ON reviews;
DROP POLICY IF EXISTS reviews_insert_own_authenticated ON reviews;
DROP POLICY IF EXISTS reviews_insert_block_anon ON reviews;
DROP POLICY IF EXISTS reviews_update_own_authenticated ON reviews;
DROP POLICY IF EXISTS reviews_update_block_anon ON reviews;
DROP POLICY IF EXISTS reviews_delete_own_authenticated ON reviews;
DROP POLICY IF EXISTS reviews_delete_block_anon ON reviews;

-- Drop all policies for event_logs
DROP POLICY IF EXISTS event_logs_select_own_authenticated ON event_logs;
DROP POLICY IF EXISTS event_logs_select_block_anon ON event_logs;
DROP POLICY IF EXISTS event_logs_insert_own_authenticated ON event_logs;
DROP POLICY IF EXISTS event_logs_insert_block_anon ON event_logs;
DROP POLICY IF EXISTS event_logs_update_own_authenticated ON event_logs;
DROP POLICY IF EXISTS event_logs_update_block_anon ON event_logs;
DROP POLICY IF EXISTS event_logs_delete_own_authenticated ON event_logs;
DROP POLICY IF EXISTS event_logs_delete_block_anon ON event_logs;
```

Then apply:

```bash
supabase db push
```

### Option 2: Reset Local Database

For local development only:

```bash
# This will reset to the state before your last migration
supabase db reset
```

Then manually remove or comment out the migration file.

## Troubleshooting

### Issue: "Permission denied" errors after migration

**Cause:** RLS is now enforced, and queries may be blocked if not properly authenticated.

**Solution:** 
- Ensure your application passes the authenticated user's JWT token with requests
- Verify `auth.uid()` is being set correctly in your API calls
- Check Supabase client initialization includes auth headers

### Issue: Policies not applying

**Cause:** RLS might not be enabled on the table.

**Solution:**
```sql
-- Manually enable RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
```

### Issue: Migration fails with "policy already exists"

**Cause:** Policies from a previous migration still exist.

**Solution:**
```sql
-- Drop existing policies before re-running
DROP POLICY IF EXISTS policy_name ON table_name;
```

Or use the `IF NOT EXISTS` clause (not standard in CREATE POLICY).

### Issue: Application can't access data

**Cause:** Anonymous role is being used instead of authenticated.

**Solution:**
- Verify user is logged in before making requests
- Check Supabase client has valid session token
- Review middleware that handles authentication

## Best Practices

1. ✅ **Always test on local/staging first** before applying to production
2. ✅ **Backup your database** before running migrations on production
3. ✅ **Review the SQL** to understand what changes are being made
4. ✅ **Test your application** thoroughly after applying RLS policies
5. ✅ **Monitor logs** for any permission errors after deployment
6. ✅ **Keep migration files** in version control
7. ✅ **Document rollback procedures** for your team

## Security Benefits

After applying this migration:

- ✅ **Data Isolation:** Users can only access their own flashcards, sessions, and reviews
- ✅ **No Anonymous Access:** Unauthenticated users are blocked from all operations
- ✅ **Defense in Depth:** Even if application logic has bugs, database enforces security
- ✅ **Granular Control:** Separate policies for each operation type (SELECT/INSERT/UPDATE/DELETE)
- ✅ **Audit Trail:** Clear policy names make it easy to understand security model

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Migration File: 20251207120000_enable_rls_policies.sql](supabase/migrations/20251207120000_enable_rls_policies.sql)

## Questions?

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Review Supabase logs in your dashboard
3. Verify authentication is working correctly in your application
4. Test with the verification queries provided above

