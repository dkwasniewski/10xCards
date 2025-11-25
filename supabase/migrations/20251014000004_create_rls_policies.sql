-- Migration: Create Row Level Security Policies
-- Purpose: Implement granular RLS policies to ensure users can only access their own data
-- Affected: ai_generation_sessions, flashcards, reviews, event_logs tables
-- Created: 2025-10-14
-- Security: All policies enforce user_id = auth.uid() to ensure data isolation between users

-- ============================================================================
-- AI GENERATION SESSIONS POLICIES
-- ============================================================================

-- Allow authenticated users to select their own AI generation sessions
create policy ai_sessions_select_own_authenticated on ai_generation_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to insert their own AI generation sessions
create policy ai_sessions_insert_own_authenticated on ai_generation_sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to update their own AI generation sessions
create policy ai_sessions_update_own_authenticated on ai_generation_sessions
  for update
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to delete their own AI generation sessions
create policy ai_sessions_delete_own_authenticated on ai_generation_sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- FLASHCARDS POLICIES
-- ============================================================================

-- Allow authenticated users to select their own flashcards
create policy flashcards_select_own_authenticated on flashcards
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to insert their own flashcards
create policy flashcards_insert_own_authenticated on flashcards
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to update their own flashcards
create policy flashcards_update_own_authenticated on flashcards
  for update
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to delete their own flashcards
create policy flashcards_delete_own_authenticated on flashcards
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- REVIEWS POLICIES
-- ============================================================================

-- Allow authenticated users to select their own reviews
create policy reviews_select_own_authenticated on reviews
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to insert their own reviews
create policy reviews_insert_own_authenticated on reviews
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to update their own reviews
create policy reviews_update_own_authenticated on reviews
  for update
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to delete their own reviews
create policy reviews_delete_own_authenticated on reviews
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- EVENT LOGS POLICIES
-- ============================================================================

-- Allow authenticated users to select their own event logs
create policy event_logs_select_own_authenticated on event_logs
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to insert their own event logs
create policy event_logs_insert_own_authenticated on event_logs
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to update their own event logs
create policy event_logs_update_own_authenticated on event_logs
  for update
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to delete their own event logs
create policy event_logs_delete_own_authenticated on event_logs
  for delete
  to authenticated
  using (user_id = auth.uid());


