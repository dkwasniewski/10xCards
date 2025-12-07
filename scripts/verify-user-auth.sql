-- Comprehensive user verification
-- Run this in Supabase Studio SQL Editor

SELECT 
  id,
  email,
  encrypted_password IS NOT NULL as "Has Password Hash",
  email_confirmed_at IS NOT NULL as "Email Confirmed",
  confirmed_at IS NOT NULL as "Account Confirmed",
  banned_until,
  deleted_at,
  is_super_admin,
  created_at,
  updated_at,
  last_sign_in_at,
  aud as "Audience",
  role as "Role"
FROM auth.users 
WHERE email = 'dakwasniewski@gmail.com';

-- Also check if there are any duplicate users
SELECT email, COUNT(*) as count
FROM auth.users
WHERE email = 'dakwasniewski@gmail.com'
GROUP BY email;

