# RLS Migration - Quick Start

## 🚀 Execute Migration (Local)

```bash
# 1. Start Supabase
supabase start

# 2. Apply migration
supabase db push

# 3. Verify (optional)
supabase db reset
```

## 🌐 Execute Migration (Production)

```bash
# 1. Link to project
supabase link --project-ref YOUR_PROJECT_REF

# 2. Preview changes
supabase db diff --linked

# 3. Apply migration
supabase db push --linked
```

## ✅ Quick Verification

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('ai_generation_sessions', 'flashcards', 'reviews', 'event_logs');
-- All should show rowsecurity = t

-- Count policies (should be 32 total)
SELECT count(*) FROM pg_policies 
WHERE tablename IN ('ai_generation_sessions', 'flashcards', 'reviews', 'event_logs');
```

## 📋 What Was Created

**Migration Files:** 
- `supabase/migrations/20251207120000_enable_rls_policies.sql`
- `supabase/migrations/20251207120100_enable_rls_event_logs.sql`

**32 RLS Policies Created:**
- **ai_generation_sessions:** 8 policies (SELECT, INSERT, UPDATE, DELETE for authenticated + anon)
- **flashcards:** 8 policies (SELECT, INSERT, UPDATE, DELETE for authenticated + anon)
- **reviews:** 8 policies (SELECT, INSERT, UPDATE, DELETE for authenticated + anon)
- **event_logs:** 8 policies (SELECT, INSERT, UPDATE, DELETE for authenticated + anon)

**Security Model:**
- ✅ Authenticated users: Can perform all CRUD operations on their own data
- ❌ Anonymous users: Blocked from all operations
- 🔒 Data isolation: `user_id = auth.uid()` enforced on all policies

## 🔄 Rollback (If Needed)

```sql
-- Disable RLS
ALTER TABLE ai_generation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs DISABLE ROW LEVEL SECURITY;

-- Then drop all policies (see RLS-MIGRATION-GUIDE.md for full commands)
```

## 📚 Full Documentation

See [RLS-MIGRATION-GUIDE.md](RLS-MIGRATION-GUIDE.md) for complete instructions, verification steps, and troubleshooting.

