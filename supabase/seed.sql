-- ============================================================================
-- Seed File for Local Development
-- ============================================================================
-- Purpose: Populate the local database with test data for development
-- Note: This file runs after migrations during `supabase db reset`
-- ============================================================================

-- ============================================================================
-- TEST USERS
-- ============================================================================
-- Note: Users are created via the test-local-connection.ts script instead of seed.sql
-- This is because auth.users table requires special handling and the Supabase client
-- properly manages password hashing and identity creation.
--
-- To create test users, run:
--   npx tsx scripts/test-local-connection.ts
--
-- Or manually create users via Supabase Studio at http://127.0.0.1:54323
--
-- Default test credentials (after running the script):
--   Email: test@example.com
--   Password: testpassword123
-- ============================================================================

-- ============================================================================
-- SAMPLE FLASHCARDS
-- ============================================================================
-- Note: Sample flashcards will be created after test users are created
-- Run the test script first: npx tsx scripts/test-local-connection.ts
-- Then you can manually add flashcards via the app or Supabase Studio
-- ============================================================================

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Uncomment to verify seed data was created:
-- SELECT id, email, email_confirmed_at FROM auth.users;
-- SELECT id, user_id, front, back FROM flashcards ORDER BY created_at;
-- ============================================================================

