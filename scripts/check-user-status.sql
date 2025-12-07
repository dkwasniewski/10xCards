-- Check user status in the database
-- Run with Supabase Studio SQL Editor or via supabase db query

\echo 'Checking user status for dakwasniewski@gmail.com...'
\echo ''

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmed_at,
  banned_until,
  deleted_at
FROM auth.users 
WHERE email = 'dakwasniewski@gmail.com';

\echo ''
\echo 'If email_confirmed_at is NULL, the user needs to confirm their email.'

