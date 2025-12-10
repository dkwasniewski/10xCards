-- ============================================================================
-- Migration: Enable Row Level Security Policies
-- ============================================================================
-- Purpose: Re-enable comprehensive RLS policies for flashcards, ai_generation_sessions, and reviews tables
-- Affected Tables: flashcards, ai_generation_sessions, reviews
-- Created: 2025-12-07
-- 
-- Security Considerations:
--   - All policies enforce user_id = auth.uid() to ensure data isolation between users
--   - Granular policies created for each operation type (SELECT, INSERT, UPDATE, DELETE)
--   - Separate policies for 'authenticated' and 'anon' roles where applicable
--   - Anonymous users have no access to any tables (all operations blocked)
--   - Only authenticated users can perform CRUD operations on their own data
--
-- RLS Strategy:
--   - Each table has RLS explicitly enabled
--   - Policies use auth.uid() to verify ownership
--   - INSERT policies use WITH CHECK to validate new data
--   - SELECT/UPDATE/DELETE policies use USING to filter existing data
-- ============================================================================

-- ============================================================================
-- AI GENERATION SESSIONS TABLE - RLS POLICIES
-- ============================================================================
-- This table stores metadata about AI-powered flashcard generation sessions.
-- Only authenticated users can access their own generation sessions.

-- Re-enable Row Level Security on ai_generation_sessions table
-- IMPORTANT: This ensures that policies are enforced before any data access
alter table ai_generation_sessions enable row level security;

-- Policy: Allow authenticated users to SELECT their own AI generation sessions
-- Rationale: Users need to view their generation history for analytics and tracking
create policy ai_sessions_select_own_authenticated on ai_generation_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from SELECT on AI generation sessions
-- Rationale: Generation sessions contain user-specific data and should not be accessible to unauthenticated users
create policy ai_sessions_select_block_anon on ai_generation_sessions
  for select
  to anon
  using (false);

-- Policy: Allow authenticated users to INSERT their own AI generation sessions
-- Rationale: Users need to create new generation sessions when using the AI flashcard feature
-- WITH CHECK ensures the user_id matches the authenticated user
create policy ai_sessions_insert_own_authenticated on ai_generation_sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Block anonymous users from INSERT on AI generation sessions
-- Rationale: Only authenticated users should be able to create generation sessions
create policy ai_sessions_insert_block_anon on ai_generation_sessions
  for insert
  to anon
  with check (false);

-- Policy: Allow authenticated users to UPDATE their own AI generation sessions
-- Rationale: Users may need to update session metadata (e.g., accepted card counts)
-- USING clause ensures users can only update their own sessions
create policy ai_sessions_update_own_authenticated on ai_generation_sessions
  for update
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from UPDATE on AI generation sessions
-- Rationale: Anonymous users should not be able to modify any data
create policy ai_sessions_update_block_anon on ai_generation_sessions
  for update
  to anon
  using (false);

-- Policy: Allow authenticated users to DELETE their own AI generation sessions
-- Rationale: Users should be able to delete their generation history
-- USING clause ensures users can only delete their own sessions
create policy ai_sessions_delete_own_authenticated on ai_generation_sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from DELETE on AI generation sessions
-- Rationale: Anonymous users should not be able to delete any data
create policy ai_sessions_delete_block_anon on ai_generation_sessions
  for delete
  to anon
  using (false);

-- ============================================================================
-- FLASHCARDS TABLE - RLS POLICIES
-- ============================================================================
-- This table stores individual flashcard data with support for both manual and AI-generated cards.
-- Only authenticated users can access their own flashcards.

-- Re-enable Row Level Security on flashcards table
-- IMPORTANT: This ensures that policies are enforced before any data access
alter table flashcards enable row level security;

-- Policy: Allow authenticated users to SELECT their own flashcards
-- Rationale: Users need to view and study their own flashcards
create policy flashcards_select_own_authenticated on flashcards
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from SELECT on flashcards
-- Rationale: Flashcards are private user data and should not be accessible to unauthenticated users
create policy flashcards_select_block_anon on flashcards
  for select
  to anon
  using (false);

-- Policy: Allow authenticated users to INSERT their own flashcards
-- Rationale: Users need to create new flashcards either manually or via AI generation
-- WITH CHECK ensures the user_id matches the authenticated user
create policy flashcards_insert_own_authenticated on flashcards
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Block anonymous users from INSERT on flashcards
-- Rationale: Only authenticated users should be able to create flashcards
create policy flashcards_insert_block_anon on flashcards
  for insert
  to anon
  with check (false);

-- Policy: Allow authenticated users to UPDATE their own flashcards
-- Rationale: Users need to edit flashcard content, mark as deleted, etc.
-- USING clause ensures users can only update their own flashcards
create policy flashcards_update_own_authenticated on flashcards
  for update
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from UPDATE on flashcards
-- Rationale: Anonymous users should not be able to modify any flashcards
create policy flashcards_update_block_anon on flashcards
  for update
  to anon
  using (false);

-- Policy: Allow authenticated users to DELETE their own flashcards
-- Rationale: Users should be able to permanently delete their flashcards
-- USING clause ensures users can only delete their own flashcards
-- WARNING: This is a destructive operation. Consider soft deletes via deleted_at column instead.
create policy flashcards_delete_own_authenticated on flashcards
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from DELETE on flashcards
-- Rationale: Anonymous users should not be able to delete any flashcards
create policy flashcards_delete_block_anon on flashcards
  for delete
  to anon
  using (false);

-- ============================================================================
-- REVIEWS TABLE - RLS POLICIES
-- ============================================================================
-- This table stores spaced repetition review history for flashcards.
-- Only authenticated users can access their own review data.

-- Re-enable Row Level Security on reviews table
-- IMPORTANT: This ensures that policies are enforced before any data access
alter table reviews enable row level security;

-- Policy: Allow authenticated users to SELECT their own reviews
-- Rationale: Users need to view their review history and spaced repetition schedule
create policy reviews_select_own_authenticated on reviews
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from SELECT on reviews
-- Rationale: Review data is private and should not be accessible to unauthenticated users
create policy reviews_select_block_anon on reviews
  for select
  to anon
  using (false);

-- Policy: Allow authenticated users to INSERT their own reviews
-- Rationale: Users need to create new review records when studying flashcards
-- WITH CHECK ensures the user_id matches the authenticated user
create policy reviews_insert_own_authenticated on reviews
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Block anonymous users from INSERT on reviews
-- Rationale: Only authenticated users should be able to create review records
create policy reviews_insert_block_anon on reviews
  for insert
  to anon
  with check (false);

-- Policy: Allow authenticated users to UPDATE their own reviews
-- Rationale: Users may need to update review metadata or reschedule reviews
-- USING clause ensures users can only update their own reviews
create policy reviews_update_own_authenticated on reviews
  for update
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from UPDATE on reviews
-- Rationale: Anonymous users should not be able to modify any review data
create policy reviews_update_block_anon on reviews
  for update
  to anon
  using (false);

-- Policy: Allow authenticated users to DELETE their own reviews
-- Rationale: Users should be able to delete review history if needed
-- USING clause ensures users can only delete their own reviews
-- WARNING: This is a destructive operation. Consider soft deletes via deleted_at column instead.
create policy reviews_delete_own_authenticated on reviews
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from DELETE on reviews
-- Rationale: Anonymous users should not be able to delete any review data
create policy reviews_delete_block_anon on reviews
  for delete
  to anon
  using (false);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- You can run these queries to verify that RLS policies are properly configured:
--
-- Check if RLS is enabled on all tables:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('ai_generation_sessions', 'flashcards', 'reviews');
--
-- List all policies for these tables:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename IN ('ai_generation_sessions', 'flashcards', 'reviews')
-- ORDER BY tablename, cmd, roles;
--
-- Test policy enforcement (as authenticated user):
-- SELECT count(*) FROM flashcards; -- Should only return current user's flashcards
-- SELECT count(*) FROM ai_generation_sessions; -- Should only return current user's sessions
-- SELECT count(*) FROM reviews; -- Should only return current user's reviews
-- ============================================================================


