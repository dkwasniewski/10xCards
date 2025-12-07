-- ============================================================================
-- RLS Verification Script
-- ============================================================================
-- Run this with: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/verify-rls.sql

\echo '============================================================================'
\echo 'CHECKING RLS STATUS ON ALL TABLES'
\echo '============================================================================'

SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('ai_generation_sessions', 'flashcards', 'reviews', 'event_logs')
ORDER BY tablename;

\echo ''
\echo '============================================================================'
\echo 'COUNTING POLICIES PER TABLE'
\echo '============================================================================'

SELECT 
  tablename,
  count(*) as "Policy Count"
FROM pg_policies 
WHERE tablename IN ('ai_generation_sessions', 'flashcards', 'reviews', 'event_logs')
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo 'Expected: 8 policies per table (32 total)'
\echo ''

\echo '============================================================================'
\echo 'LISTING ALL POLICIES'
\echo '============================================================================'

SELECT 
  tablename,
  policyname,
  cmd as "Operation",
  roles as "Role",
  permissive as "Permissive"
FROM pg_policies 
WHERE tablename IN ('ai_generation_sessions', 'flashcards', 'reviews', 'event_logs')
ORDER BY tablename, cmd, roles;

\echo ''
\echo '============================================================================'
\echo 'CHECKING FOR BLOCKING POLICIES (anon role should all be false)'
\echo '============================================================================'

SELECT 
  tablename,
  policyname,
  cmd,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies 
WHERE tablename IN ('ai_generation_sessions', 'flashcards', 'reviews', 'event_logs')
  AND 'anon' = ANY(roles)
ORDER BY tablename, cmd;

\echo ''
\echo '============================================================================'
\echo 'DONE - Review the output above'
\echo '============================================================================'

