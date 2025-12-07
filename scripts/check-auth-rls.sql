-- Check if RLS is enabled on auth tables (it shouldn't be!)
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- Check for any RLS policies on auth.users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'auth'
ORDER BY tablename, policyname;

