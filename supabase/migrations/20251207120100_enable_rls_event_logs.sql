-- ============================================================================
-- Migration: Enable Row Level Security Policies for Event Logs
-- ============================================================================
-- Purpose: Add comprehensive RLS policies for event_logs table
-- Affected Tables: event_logs
-- Created: 2025-12-07
-- 
-- Security Considerations:
--   - All policies enforce user_id = auth.uid() to ensure data isolation between users
--   - Granular policies created for each operation type (SELECT, INSERT, UPDATE, DELETE)
--   - Separate policies for 'authenticated' and 'anon' roles
--   - Anonymous users have no access (all operations blocked)
--   - Only authenticated users can perform CRUD operations on their own event logs
--
-- RLS Strategy:
--   - Event logs are audit/analytics data tied to users
--   - INSERT policies use WITH CHECK to validate new data
--   - SELECT/UPDATE/DELETE policies use USING to filter existing data
--   - This completes RLS coverage for all core application tables
-- ============================================================================

-- ============================================================================
-- EVENT LOGS TABLE - RLS POLICIES
-- ============================================================================
-- This table stores audit trail and analytics events for user interactions.
-- Only authenticated users can access their own event logs.

-- Enable Row Level Security on event_logs table
-- IMPORTANT: This ensures that policies are enforced before any data access
alter table event_logs enable row level security;

-- Policy: Allow authenticated users to SELECT their own event logs
-- Rationale: Users should be able to view their own activity history and analytics
create policy event_logs_select_own_authenticated on event_logs
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from SELECT on event logs
-- Rationale: Event logs contain user activity data and should not be accessible to unauthenticated users
create policy event_logs_select_block_anon on event_logs
  for select
  to anon
  using (false);

-- Policy: Allow authenticated users to INSERT their own event logs
-- Rationale: Users need to create event log entries when performing actions (login, create flashcard, etc.)
-- WITH CHECK ensures the user_id matches the authenticated user
create policy event_logs_insert_own_authenticated on event_logs
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Block anonymous users from INSERT on event logs
-- Rationale: Only authenticated users should be able to create event log entries
create policy event_logs_insert_block_anon on event_logs
  for insert
  to anon
  with check (false);

-- Policy: Allow authenticated users to UPDATE their own event logs
-- Rationale: Users may need to update event log metadata (though this is rare for audit logs)
-- USING clause ensures users can only update their own event logs
-- NOTE: In most cases, event logs should be immutable. Consider removing this policy if updates are not needed.
create policy event_logs_update_own_authenticated on event_logs
  for update
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from UPDATE on event logs
-- Rationale: Anonymous users should not be able to modify any event logs
create policy event_logs_update_block_anon on event_logs
  for update
  to anon
  using (false);

-- Policy: Allow authenticated users to DELETE their own event logs
-- Rationale: Users should be able to delete their activity history if desired (GDPR compliance)
-- USING clause ensures users can only delete their own event logs
-- WARNING: This is a destructive operation. Consider soft deletes or retention policies instead.
create policy event_logs_delete_own_authenticated on event_logs
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Policy: Block anonymous users from DELETE on event logs
-- Rationale: Anonymous users should not be able to delete any event logs
create policy event_logs_delete_block_anon on event_logs
  for delete
  to anon
  using (false);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- You can run these queries to verify that RLS policies are properly configured:
--
-- Check if RLS is enabled on event_logs:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'event_logs';
--
-- List all policies for event_logs:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'event_logs'
-- ORDER BY cmd, roles;
--
-- Test policy enforcement (as authenticated user):
-- SELECT count(*) FROM event_logs; -- Should only return current user's event logs
-- ============================================================================

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- This migration completes RLS coverage for all core application tables:
--   ✅ ai_generation_sessions (20251207120000_enable_rls_policies.sql)
--   ✅ flashcards (20251207120000_enable_rls_policies.sql)
--   ✅ reviews (20251207120000_enable_rls_policies.sql)
--   ✅ event_logs (this migration)
--
-- All tables now have comprehensive RLS policies enforcing user data isolation.
-- Authentication flows (login, register, logout) should now work correctly.
-- ============================================================================

