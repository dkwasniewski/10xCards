# Password Reset - Quick Start Guide

## What Was Implemented

Complete password reset functionality for 10xCards, following Supabase authentication patterns and maintaining consistency with the existing login implementation.

## Files Created/Modified

### New API Endpoints

1. **`src/pages/api/forgot-password.ts`** - Handles password reset requests
2. **`src/pages/api/reset-password.ts`** - Handles password updates with token

### Updated Components

3. **`src/components/auth/ForgotPasswordForm.tsx`** - Now calls `/api/forgot-password`
4. **`src/components/auth/ResetPasswordForm.tsx`** - Now calls `/api/reset-password` with token extraction

### Updated Configuration

5. **`src/middleware/index.ts`** - Added `/api/forgot-password` to public paths

### Documentation

6. **`docs/password-reset-implementation.md`** - Complete implementation guide
7. **`docs/password-reset-quick-start.md`** - This file

## How It Works

### User Flow

1. **Forgot Password**
   - User visits `/forgot-password`
   - Enters email address
   - Receives email with reset link
   - Link format: `{SITE_URL}/reset-password#access_token=...`

2. **Reset Password**
   - User clicks link in email
   - Token extracted from URL hash
   - User enters new password (with strength validation)
   - Password is updated
   - User is signed out
   - User redirected to login with success message
   - User logs in with new password

### Important Supabase Behavior

⚠️ **Key Point**: After the user submits their new password, Supabase updates the password but **requires the user to log in again with the new password**. This is a security feature.

The implementation handles this by:

1. Updating the password via `supabase.auth.updateUser()`
2. Signing out the user via `supabase.auth.signOut()`
3. Redirecting to login page with success message
4. User must log in with their new password

## Testing the Implementation

### Prerequisites

- Ensure `PUBLIC_SITE_URL` is set in your environment variables
- Supabase email templates should be configured to send to `/reset-password`

### Test Steps

1. **Test Forgot Password**

   ```bash
   # Navigate to forgot password page
   open http://localhost:4321/forgot-password

   # Enter a valid email and submit
   # Check email inbox for reset link
   ```

2. **Test Reset Password**

   ```bash
   # Click the reset link in email
   # Should navigate to: http://localhost:4321/reset-password#access_token=...

   # Enter new password (must meet strength requirements)
   # Submit form
   # Should redirect to login page

   # Log in with new password
   ```

3. **Test Error Cases**
   - Invalid email format
   - Weak password
   - Mismatched confirm password
   - Expired token
   - Invalid token

## Security Features

✅ **Email Enumeration Prevention**: Always returns success, even if email doesn't exist

✅ **Token Validation**: Token is validated by creating a temporary session

✅ **Password Strength**: Enforced by Zod schema (8-72 chars, uppercase, lowercase, number, special char)

✅ **Forced Re-authentication**: User must log in with new password after reset

✅ **Event Logging**: Password reset events are logged for audit trail

## API Endpoints

### POST /api/forgot-password

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "If an account exists with this email, you will receive password reset instructions"
}
```

### POST /api/reset-password

**Request:**

```json
{
  "token": "access_token_from_email_link",
  "new_password": "NewSecureP@ssw0rd"
}
```

**Response (Success):**

```json
{
  "message": "Password reset successful"
}
```

**Response (Error):**

```json
{
  "error": "Invalid or expired reset token"
}
```

## Common Issues & Solutions

### Issue: Token not found

**Solution**: Ensure the reset link contains `#access_token=...` in the URL. Check Supabase email template configuration.

### Issue: "Invalid or expired reset token"

**Solution**: Token may have expired (default: 1 hour). Request a new reset link.

### Issue: "New password must be different from your old password"

**Solution**: Supabase prevents reusing the same password. Choose a different password.

### Issue: Reset link redirects to wrong URL

**Solution**: Check that `PUBLIC_SITE_URL` environment variable is set correctly.

## Next Steps

1. Test the complete flow in development
2. Configure Supabase email templates if needed
3. Test with real email addresses
4. Deploy to staging/production
5. Monitor password reset events in logs

## Related Documentation

- `docs/password-reset-implementation.md` - Detailed implementation guide
- `.cursor/rules/supabase-auth.mdc` - Supabase auth integration rules
- `src/lib/services/auth.service.ts` - Auth service methods
- `src/lib/schemas/auth.schemas.ts` - Validation schemas


