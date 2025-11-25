# Authentication Architecture Specification – 10xCards

## Document Overview

This specification defines the complete authentication system architecture for 10xCards, covering user registration, login, logout, and password recovery functionality. The design integrates Supabase Auth with Astro's server-side rendering capabilities while maintaining compatibility with existing application features.

**Target User Stories:** US-001 (Registration, Login & Security) and US-002 (Password Reset)

**Technology Stack:** Astro 5, React 19, TypeScript 5, Supabase Auth, Tailwind 4, shadcn/ui

---

## ⚠️ CONFLICTS & RESOLUTIONS (PRD vs Auth Spec Analysis)

### 🔴 CRITICAL CONFLICTS REQUIRING DECISION:

#### 1. Landing Page Access Control (US-001 Conflict) ✅ RESOLVED

- **PRD US-001 Line 53**: "Users not authenticated cannot enter pages other than login/registration pages"
- **Auth Spec Original**: Landing page `/` is public
- **STAKEHOLDER DECISION**: Landing page should redirect based on authentication status:
  - **If NOT authenticated**: Redirect to `/auth/login`
  - **If authenticated**: Redirect to `/generate`
- **RESOLUTION**: Landing page acts as smart router, not a public page

#### 2. AI Generation Scope (PRD Internal Conflict)

- **PRD Line 27**: "AI generation of a **single** flashcard from pasted text"
- **PRD US-004 Lines 72-78**: "receives **several** AI-generated flashcard suggestions"
- **RESOLUTION**: US-004 takes precedence - system generates **multiple** candidates
- **AUTH SPEC UPDATED**: Assumes multiple flashcard generation

#### 3. Study Session MVP Status (Scope Conflict)

- **PRD Line 32**: Study Session included in MVP scope
- **PRD US-010**: Detailed study session requirements
- **Auth Spec Original**: Marked `/study` route as "future"
- **RESOLUTION**: Study session IS part of MVP
- **AUTH SPEC UPDATED**: `/study` route marked as protected, MVP scope

### 🟡 TECHNICAL CONFLICTS RESOLVED:

#### 4. Session Cookie Management (Internal Auth Spec Conflict)

- **Section 2.1.2 (Lines 448-454)**: Defined custom cookie `sb-access-token` with manual `Astro.cookies.set()`
- **Section 3.3.1 (Lines 1220-1228)**: States Supabase manages cookies automatically as `sb-<project-ref>-auth-token`
- **RESOLUTION**: Supabase client manages cookies automatically - no manual cookie setting needed
- **AUTH SPEC UPDATED**: Removed manual cookie management, clarified Supabase handles this

#### 5. Middleware Session Retrieval (SSR Implementation Issue)

- **Original**: Used singleton `supabaseClient.auth.getSession()` in middleware
- **ISSUE**: Singleton client may not have access to request cookies in SSR context
- **RESOLUTION**: Need request-scoped Supabase client with cookie adapter
- **AUTH SPEC UPDATED**: Added critical note about SSR configuration requirements

### 🟢 CLARIFICATIONS & ADDITIONS:

#### 6. Reviews Table (Not in PRD) ✅ RESOLVED

- **Auth Spec**: Includes RLS policies for `reviews` table
- **PRD**: No mention of `reviews` table
- **STAKEHOLDER DECISION**: Reviews table NOT needed at this moment
- **RESOLUTION**: Removed from documentation and implementation checklist

#### 7. Email Confirmation Wording (PRD Ambiguity)

- **PRD Line 49**: "They receive an email confirmation **or** password-reset link"
- **CLARIFICATION**: Should be "email confirmation **and** password-reset link" (two separate features)
- **AUTH SPEC**: Already correctly implements both features separately

#### 8. Manual Flashcard Creation UI (Implementation Gap) ✅ RESOLVED

- **PRD US-003**: Requires manual flashcard creation form
- **Auth Spec**: Doesn't specify dedicated UI for manual creation
- **STAKEHOLDER DECISION**: Manual flashcard creation accessible from "My Flashcards" page
  - Button labeled "Create Flashcard" or "Add New"
  - Opens modal dialog with form (front/back fields)
  - Form validation per US-003 (front ≤200 chars, back ≤500 chars)
- **RESOLUTION**: Add to `/flashcards` page implementation, not `/generate` page

---

## 📋 IMPLEMENTATION PREREQUISITES:

Before implementing this specification, the following must be clarified:

1. ✅ **RESOLVED**: AI generates multiple candidates (not single)
2. ✅ **RESOLVED**: Study session is MVP (not future)
3. ✅ **RESOLVED**: Supabase manages cookies automatically
4. ✅ **RESOLVED**: Landing page `/` redirects to `/auth/login` (unauthenticated) or `/generate` (authenticated)
5. ✅ **RESOLVED**: Reviews table NOT needed - removed from documentation
6. ✅ **RESOLVED**: Manual flashcard creation via button on `/flashcards` page (opens modal)

---

## CRITICAL CLARIFICATIONS FROM PRD ANALYSIS:

1. **AI Generation**: Produces **multiple** flashcard candidates per session (US-004), not single flashcard
2. **Landing Page Access**: Per US-001 line 53, unauthenticated users should NOT access any pages except login/registration
3. **Study Session**: Included in MVP scope (US-010) - needs route protection
4. **Reviews Table**: Not mentioned in PRD - RLS policies for this table should be removed or clarified

---

## 1. USER INTERFACE ARCHITECTURE

### 1.1 Page Structure & Routing

#### 1.1.1 New Authentication Pages (Public Routes)

**Page: `/src/pages/auth/login.astro`**

- **Purpose:** User login interface
- **Access:** Public (unauthenticated users only)
- **Behavior:** Redirects authenticated users to `/generate`
- **SSR Configuration:** `export const prerender = false`
- **Layout:** Uses `Layout.astro` with `title="Login - 10xCards"`
- **Components:** Contains `LoginForm` React component with `client:load` directive
- **Server-side Logic:**
  - Check session via `Astro.locals.supabase.auth.getSession()`
  - If authenticated, redirect to `/generate`
  - Pass any error/success messages from URL query params to component

**Page: `/src/pages/auth/register.astro`**

- **Purpose:** New user registration interface
- **Access:** Public (unauthenticated users only)
- **Behavior:** Redirects authenticated users to `/generate`
- **SSR Configuration:** `export const prerender = false`
- **Layout:** Uses `Layout.astro` with `title="Register - 10xCards"`
- **Components:** Contains `RegisterForm` React component with `client:load` directive
- **Server-side Logic:**
  - Check session via `Astro.locals.supabase.auth.getSession()`
  - If authenticated, redirect to `/generate`

**Page: `/src/pages/auth/forgot-password.astro`**

- **Purpose:** Password reset request interface
- **Access:** Public (unauthenticated users only)
- **Behavior:** Redirects authenticated users to `/generate`
- **SSR Configuration:** `export const prerender = false`
- **Layout:** Uses `Layout.astro` with `title="Forgot Password - 10xCards"`
- **Components:** Contains `ForgotPasswordForm` React component with `client:load` directive

**Page: `/src/pages/auth/reset-password.astro`**

- **Purpose:** New password entry interface (accessed via email link)
- **Access:** Public with valid token
- **Behavior:** Validates token from URL hash, shows error if invalid/expired
- **SSR Configuration:** `export const prerender = false`
- **Layout:** Uses `Layout.astro` with `title="Reset Password - 10xCards"`
- **Components:** Contains `ResetPasswordForm` React component with `client:load` directive
- **Server-side Logic:**
  - Extract token from URL hash (Supabase sends it as `#access_token=...`)
  - Pass token to component for validation

**Page: `/src/pages/auth/verify-email.astro`**

- **Purpose:** Email verification confirmation page
- **Access:** Public
- **Behavior:** Shows success message after email confirmation
- **SSR Configuration:** `export const prerender = false`
- **Layout:** Uses `Layout.astro` with `title="Verify Email - 10xCards"`
- **Components:** Static Astro component with success message and link to login

#### 1.1.2 Modified Existing Pages (Protected Routes)

**Page: `/src/pages/index.astro`**

- **Current State:** Landing page with Welcome component
- **Modification:** Add authentication check and smart redirect
- **New Behavior (STAKEHOLDER CONFIRMED):**
  - If authenticated: redirect to `/generate`
  - If not authenticated: redirect to `/auth/login`
  - Landing page acts as entry point router only
- **Components:** `Welcome.astro` component not needed (page always redirects)

**Page: `/src/pages/generate/index.astro`**

- **Current State:** Has TODO comment for auth guard
- **Modification:** Implement authentication guard
- **New Behavior:**
  - Check session via `Astro.locals.supabase.auth.getSession()`
  - If not authenticated: redirect to `/auth/login`
  - If authenticated: render page normally
- **User Context:** Pass user object to React component via props

**Page: `/src/pages/flashcards/index.astro`**

- **Current State:** Has TODO comment for auth guard
- **Modification:** Implement authentication guard
- **New Behavior:**
  - Check session via `Astro.locals.supabase.auth.getSession()`
  - If not authenticated: redirect to `/auth/login`
  - If authenticated: render page normally
- **User Context:** Pass user object to React component via props

### 1.2 React Component Architecture

#### 1.2.1 Authentication Form Components

**Component: `/src/components/auth/LoginForm.tsx`**

- **Type:** Client-side React component
- **Responsibility:** Handle user login interactions
- **State Management:**
  - `email: string` - User email input
  - `password: string` - User password input
  - `isLoading: boolean` - Form submission state
  - `error: string | null` - Error message display
- **Validation:**
  - Email: Required, valid email format
  - Password: Required, minimum 8 characters
- **User Actions:**
  - Submit login form → POST to `/api/auth/login`
  - Navigate to register page
  - Navigate to forgot password page
- **Success Behavior:** Redirect to `/generate` via `window.location.href`
- **Error Handling:** Display error messages inline above form
- **UI Elements:**
  - Email input field (shadcn/ui Input)
  - Password input field with show/hide toggle
  - Submit button with loading state (shadcn/ui Button)
  - Links to register and forgot password
  - Error alert (shadcn/ui Alert)

**Component: `/src/components/auth/RegisterForm.tsx`**

- **Type:** Client-side React component
- **Responsibility:** Handle user registration interactions
- **State Management:**
  - `email: string` - User email input
  - `password: string` - User password input
  - `confirmPassword: string` - Password confirmation input
  - `isLoading: boolean` - Form submission state
  - `error: string | null` - Error message display
  - `success: boolean` - Registration success state
- **Validation:**
  - Email: Required, valid email format, max 255 characters
  - Password: Required, minimum 8 characters, max 72 characters
  - Password must contain: uppercase, lowercase, number, special character
  - Confirm Password: Must match password
- **User Actions:**
  - Submit registration form → POST to `/api/auth/register`
  - Navigate to login page
- **Success Behavior:** Show success message with email confirmation instructions
- **Error Handling:** Display validation errors inline per field and general errors above form
- **UI Elements:**
  - Email input field with validation feedback
  - Password input field with strength indicator
  - Confirm password input field
  - Submit button with loading state
  - Link to login page
  - Success/error alerts

**Component: `/src/components/auth/ForgotPasswordForm.tsx`**

- **Type:** Client-side React component
- **Responsibility:** Handle password reset request
- **State Management:**
  - `email: string` - User email input
  - `isLoading: boolean` - Form submission state
  - `error: string | null` - Error message display
  - `success: boolean` - Request success state
- **Validation:**
  - Email: Required, valid email format
- **User Actions:**
  - Submit forgot password form → POST to `/api/auth/forgot-password`
  - Navigate back to login page
- **Success Behavior:** Show success message with instructions to check email
- **Error Handling:** Display error messages inline above form
- **UI Elements:**
  - Email input field
  - Submit button with loading state
  - Link back to login
  - Success/error alerts

**Component: `/src/components/auth/ResetPasswordForm.tsx`**

- **Type:** Client-side React component
- **Responsibility:** Handle new password submission
- **Props:**
  - `token: string` - Reset token from URL
- **State Management:**
  - `newPassword: string` - New password input
  - `confirmPassword: string` - Password confirmation input
  - `isLoading: boolean` - Form submission state
  - `error: string | null` - Error message display
  - `success: boolean` - Reset success state
- **Validation:**
  - New Password: Required, minimum 8 characters, max 72 characters
  - Password must contain: uppercase, lowercase, number, special character
  - Confirm Password: Must match new password
- **User Actions:**
  - Submit reset password form → POST to `/api/auth/reset-password`
- **Success Behavior:** Show success message and redirect to login after 3 seconds
- **Error Handling:** Display validation errors inline per field and general errors above form
- **UI Elements:**
  - New password input field with strength indicator
  - Confirm password input field
  - Submit button with loading state
  - Success/error alerts

#### 1.2.2 Layout & Navigation Components

**Component: `/src/components/layout/Header.tsx`** (New)

- **Type:** Client-side React component
- **Responsibility:** Application header with navigation and user menu
- **Props:**
  - `user: { id: string; email: string } | null` - Current user data
- **Conditional Rendering:**
  - If authenticated: Show navigation links (Generate, My Flashcards) and user menu
  - If not authenticated: Show login/register links
- **User Actions:**
  - Navigate to different pages
  - Logout → POST to `/api/auth/logout`
- **UI Elements:**
  - Logo/brand link to home
  - Navigation links
  - User dropdown menu (shadcn/ui DropdownMenu)
  - Logout button

**Component Update: `/src/layouts/Layout.astro`**

- **Modification:** Add Header component
- **Props Addition:**
  - `user?: { id: string; email: string }` - Pass from page server-side
- **Integration:** Include Header above slot content
- **Behavior:** Header receives user prop and renders accordingly

#### 1.2.3 Shared UI Components

**Component: `/src/components/auth/PasswordStrengthIndicator.tsx`** (New)

- **Type:** Client-side React component
- **Responsibility:** Visual password strength feedback
- **Props:**
  - `password: string` - Current password value
- **Display:** Color-coded bar (weak/medium/strong) with text label
- **Criteria:**
  - Weak: < 8 characters
  - Medium: 8+ characters with 2 of 4 criteria
  - Strong: 8+ characters with all 4 criteria (uppercase, lowercase, number, special)

### 1.3 Validation Rules & Error Messages

#### 1.3.1 Client-Side Validation

**Email Validation:**

- Required: "Email is required"
- Format: "Please enter a valid email address"
- Max length: "Email must be less than 255 characters"

**Password Validation (Login):**

- Required: "Password is required"
- Min length: "Password must be at least 8 characters"

**Password Validation (Registration/Reset):**

- Required: "Password is required"
- Min length: "Password must be at least 8 characters"
- Max length: "Password must be less than 72 characters"
- Uppercase: "Password must contain at least one uppercase letter"
- Lowercase: "Password must contain at least one lowercase letter"
- Number: "Password must contain at least one number"
- Special character: "Password must contain at least one special character (!@#$%^&\*)"

**Confirm Password Validation:**

- Required: "Please confirm your password"
- Match: "Passwords do not match"

#### 1.3.2 Server-Side Error Messages

**Authentication Errors:**

- Invalid credentials: "Invalid email or password"
- Account not found: "No account found with this email address"
- Email already exists: "An account with this email already exists"
- Invalid token: "Password reset link is invalid or has expired"
- Token expired: "Password reset link has expired. Please request a new one"
- Email not confirmed: "Please confirm your email address before logging in"

**Rate Limiting Errors:**

- Too many attempts: "Too many login attempts. Please try again in 15 minutes"
- Too many password resets: "Too many password reset requests. Please try again later"

**Server Errors:**

- Generic: "An unexpected error occurred. Please try again"
- Supabase unavailable: "Authentication service is temporarily unavailable"

### 1.4 User Flow Scenarios

#### 1.4.1 New User Registration Flow

1. User visits landing page (`/`)
2. Clicks "Sign Up" or "Get Started"
3. Redirected to `/auth/register`
4. Fills out registration form (email, password, confirm password)
5. Client-side validation runs on blur and submit
6. Submits form → POST `/api/auth/register`
7. On success: Shows success message "Check your email to confirm your account"
8. User checks email and clicks confirmation link
9. Redirected to `/auth/verify-email` with success message
10. Clicks "Go to Login"
11. Redirected to `/auth/login`
12. Enters credentials and logs in
13. Redirected to `/generate`

#### 1.4.2 Existing User Login Flow

1. User visits landing page (`/`)
2. Clicks "Login"
3. Redirected to `/auth/login`
4. Enters email and password
5. Client-side validation runs
6. Submits form → POST `/api/auth/login`
7. On success: Session cookie set, redirected to `/generate`
8. On error: Error message displayed, form remains populated (except password)

#### 1.4.3 Password Reset Flow

1. User at `/auth/login` clicks "Forgot Password?"
2. Redirected to `/auth/forgot-password`
3. Enters email address
4. Submits form → POST `/api/auth/forgot-password`
5. On success: Shows message "Check your email for password reset instructions"
6. User checks email and clicks reset link
7. Redirected to `/auth/reset-password#access_token=...`
8. Token extracted from URL hash
9. Enters new password and confirmation
10. Submits form → POST `/api/auth/reset-password`
11. On success: Shows success message, auto-redirects to login after 3 seconds
12. User logs in with new password

#### 1.4.4 Protected Page Access (Unauthenticated)

1. User attempts to access `/generate` or `/flashcards` directly
2. Server-side check detects no session
3. User redirected to `/auth/login?redirect=/generate` (or original path)
4. After successful login, user redirected to original destination

#### 1.4.5 Logout Flow

1. Authenticated user clicks logout in header menu
2. POST request to `/api/auth/logout`
3. Session invalidated, cookies cleared
4. User redirected to `/` (landing page)

---

## 2. BACKEND LOGIC

### 2.1 API Endpoints Structure

#### 2.1.1 Registration Endpoint

**Endpoint:** `POST /api/auth/register`
**File:** `/src/pages/api/auth/register.ts`
**Access:** Public
**Request Body:**

```typescript
{
  email: string; // Valid email, max 255 chars
  password: string; // Min 8 chars, max 72 chars, meets complexity requirements
}
```

**Response (201 Created):**

```typescript
{
  id: string; // User UUID
  email: string; // Registered email
  created_at: string; // ISO 8601 timestamp
}
```

**Response (400 Bad Request):**

```typescript
{
  error: string;      // Error message
  details?: object;   // Validation error details (Zod errors)
}
```

**Response (409 Conflict):**

```typescript
{
  error: "An account with this email already exists";
}
```

**Response (500 Internal Server Error):**

```typescript
{
  error: string; // Generic error message
}
```

**Processing Flow:**

1. Parse request body
2. Validate with Zod schema (`registerSchema`)
3. Check rate limiting (optional, via Supabase)
4. Call `authService.register(supabase, email, password)`
5. Log registration event via `eventLogService`
6. Return user data (without password)

**Error Handling:**

- Invalid JSON → 400 with "Invalid JSON in request body"
- Validation failure → 400 with Zod error details
- Email already exists → 409 with specific message
- Supabase error → 500 with logged error, generic user message

#### 2.1.2 Login Endpoint

**Endpoint:** `POST /api/auth/login`
**File:** `/src/pages/api/auth/login.ts`
**Access:** Public
**Request Body:**

```typescript
{
  email: string;
  password: string;
}
```

**Response (200 OK):**

```typescript
{
  access_token: string; // JWT access token
  expires_in: number; // Token expiration in seconds
}
```

**Response (400 Bad Request):**

```typescript
{
  error: string;
  details?: object;
}
```

**Response (401 Unauthorized):**

```typescript
{
  error: "Invalid email or password";
}
```

**Response (403 Forbidden):**

```typescript
{
  error: "Please confirm your email address before logging in";
}
```

**Response (429 Too Many Requests):**

```typescript
{
  error: "Too many login attempts. Please try again in 15 minutes";
}
```

**Processing Flow:**

1. Parse request body
2. Validate with Zod schema (`loginSchema`)
3. Call `authService.login(supabase, email, password)`
4. **NOTE**: Session cookies are automatically set by Supabase client - no manual cookie setting needed
5. Log login event via `eventLogService`
6. Return access token and expiration

**Cookie Configuration:**

- **IMPORTANT**: Supabase manages cookies automatically with names like `sb-<project-ref>-auth-token`
- **DO NOT** manually set cookies in the login endpoint - Supabase client handles this
- HttpOnly: `true` (set by Supabase)
- Secure: `true` (production only, set by Supabase)
- SameSite: `Lax` (set by Supabase)
- Path: `/`
- Max-Age: Token expiration time (managed by Supabase)

**Error Handling:**

- Invalid JSON → 400
- Validation failure → 400
- Invalid credentials → 401
- Email not confirmed → 403
- Rate limit exceeded → 429
- Supabase error → 500

#### 2.1.3 Logout Endpoint

**Endpoint:** `POST /api/auth/logout`
**File:** `/src/pages/api/auth/logout.ts`
**Access:** Authenticated (optional - can logout even if session invalid)
**Request Body:** None
**Response (200 OK):**

```typescript
{
  message: "Logged out successfully";
}
```

**Processing Flow:**

1. Get session from `Astro.locals.session` (set by middleware)
2. If session exists, call `authService.logout(supabase)`
3. **NOTE**: Supabase client clears cookies automatically on signOut - no manual cookie deletion needed
4. Log logout event if user was authenticated
5. Return success message

**Error Handling:**

- Supabase error → Log but still clear cookie and return success

#### 2.1.4 Forgot Password Endpoint

**Endpoint:** `POST /api/auth/forgot-password`
**File:** `/src/pages/api/auth/forgot-password.ts`
**Access:** Public
**Request Body:**

```typescript
{
  email: string;
}
```

**Response (200 OK):**

```typescript
{
  message: "If an account exists with this email, you will receive password reset instructions";
}
```

**Note:** Always return success to prevent email enumeration attacks

**Processing Flow:**

1. Parse request body
2. Validate with Zod schema (`forgotPasswordSchema`)
3. Call `authService.requestPasswordReset(supabase, email, redirectUrl)`
4. Return generic success message (even if email doesn't exist)
5. Log password reset request event (if email exists)

**Redirect URL Configuration:**

- Development: `http://localhost:3000/auth/reset-password`
- Production: `https://yourdomain.com/auth/reset-password`
- Configured via environment variable `PUBLIC_APP_URL`

**Error Handling:**

- Invalid JSON → 400
- Validation failure → 400
- Supabase error → Log error, still return success message to user

#### 2.1.5 Reset Password Endpoint

**Endpoint:** `POST /api/auth/reset-password`
**File:** `/src/pages/api/auth/reset-password.ts`
**Access:** Public (with valid token)
**Request Body:**

```typescript
{
  token: string; // Reset token from email link
  new_password: string; // New password meeting requirements
}
```

**Response (200 OK):**

```typescript
{
  message: "Password reset successfully";
}
```

**Response (400 Bad Request):**

```typescript
{
  error: string;
  details?: object;
}
```

**Response (401 Unauthorized):**

```typescript
{
  error: "Password reset link is invalid or has expired";
}
```

**Processing Flow:**

1. Parse request body
2. Validate with Zod schema (`resetPasswordSchema`)
3. Call `authService.resetPassword(supabase, token, newPassword)`
4. Log password reset event
5. Return success message

**Error Handling:**

- Invalid JSON → 400
- Validation failure → 400
- Invalid/expired token → 401
- Supabase error → 500

### 2.2 Data Models & Types

#### 2.2.1 Authentication DTOs (Already defined in `/src/types.ts`)

**Existing Types (lines 6-42):**

- `RegisterCommand` - Registration request
- `RegisterResponseDto` - Registration response
- `LoginCommand` - Login request
- `LoginResponseDto` - Login response
- `ForgotPasswordCommand` - Password reset request
- `ForgotPasswordResponseDto` - Password reset response
- `ResetPasswordCommand` - Password reset submission
- `ResetPasswordResponseDto` - Password reset confirmation

**Additional Types Needed:**

```typescript
// Add to /src/types.ts

export interface LogoutResponseDto {
  message: string;
}

export interface UserDto {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
}

export interface SessionDto {
  user: UserDto;
  access_token: string;
  expires_at: number;
}
```

#### 2.2.2 Supabase User Schema

Supabase Auth manages users in the `auth.users` table (not directly accessible via API). Key fields:

- `id` (UUID) - Primary key
- `email` (string) - User email
- `encrypted_password` (string) - Hashed password
- `email_confirmed_at` (timestamp) - Email confirmation time
- `created_at` (timestamp) - Account creation time
- `updated_at` (timestamp) - Last update time
- `last_sign_in_at` (timestamp) - Last login time

**Note:** No custom user table needed for MVP. Supabase Auth handles all user data. The `user_id` in application tables references `auth.users.id`.

### 2.3 Input Validation Schemas

#### 2.3.1 Zod Schemas

**File:** `/src/lib/schemas/auth.schemas.ts` (New)

```typescript
import { z } from "zod";

// Email validation
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .max(255, "Email must be less than 255 characters")
  .toLowerCase()
  .trim();

// Password validation for login
const loginPasswordSchema = z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters");

// Password validation for registration/reset
const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be less than 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*]/, "Password must contain at least one special character (!@#$%^&*)");

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  new_password: strongPasswordSchema,
});

// Type exports
export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
```

#### 2.3.2 Validation Strategy

**Client-Side:**

- Real-time validation on blur for better UX
- Final validation on form submit
- Use same Zod schemas (shared via import)
- Display inline error messages per field

**Server-Side:**

- Always validate all inputs (never trust client)
- Use Zod `safeParse()` for error handling
- Return structured validation errors (400 status)
- Sanitize inputs (trim, lowercase email)

### 2.4 Exception Handling

#### 2.4.1 Error Response Format

**Standard Error Response:**

```typescript
{
  error: string;        // Human-readable error message
  details?: object;     // Optional validation details
  code?: string;        // Optional error code for client handling
}
```

#### 2.4.2 Error Handling Patterns

**API Endpoint Pattern:**

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, ErrorMessages.INVALID_JSON);
    }

    // 2. Validate input
    const parseResult = schema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(400, ErrorMessages.VALIDATION_ERROR, parseResult.error.errors);
    }

    // 3. Get Supabase client
    const supabase = locals.supabase;
    if (!supabase) {
      return errorResponse(500, ErrorMessages.SUPABASE_CLIENT_UNAVAILABLE);
    }

    // 4. Call service method
    const result = await authService.method(supabase, ...args);

    // 5. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Handle unexpected errors
    console.error("Error in endpoint:", error);
    return await handleApiError(500, "Operation failed", error, locals.supabase, "POST /api/auth/...");
  }
};
```

**Service Method Pattern:**

```typescript
async method(supabase: SupabaseClient, ...args): Promise<ResultType> {
  // Early return for invalid inputs
  if (!args.valid) {
    throw new Error("Invalid input");
  }

  // Call Supabase
  const { data, error } = await supabase.auth.method();

  // Handle Supabase errors
  if (error) {
    // Map Supabase error codes to user-friendly messages
    if (error.message.includes("already registered")) {
      throw new Error("An account with this email already exists");
    }
    throw error;
  }

  // Validate response data
  if (!data) {
    throw new Error("No data returned from authentication service");
  }

  // Return result
  return data;
}
```

#### 2.4.3 Error Logging

**Strategy:**

- Log all errors server-side via `console.error()`
- Include context: endpoint, user ID (if available), timestamp
- Use `eventLogService` for authentication events
- Never log sensitive data (passwords, tokens)

**Event Log Integration:**

```typescript
// Success events
await eventLogService.logEvent(supabase, {
  event_type: "user_registered",
  event_source: "manual",
  user_id: userId,
});

// Error events (non-sensitive)
await eventLogService.logEvent(supabase, {
  event_type: "login_failed",
  event_source: "manual",
  user_id: userId, // if known
});
```

### 2.5 Server-Side Rendering Updates

#### 2.5.1 Middleware Enhancement

**File:** `/src/middleware/index.ts`

**Current Functionality:**

- Adds Supabase client to `context.locals`

**Required Updates:**

- Add session retrieval to `context.locals`
- Add user object to `context.locals`
- Keep existing Supabase client injection

**Updated Implementation:**

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  // Inject Supabase client (existing)
  context.locals.supabase = supabaseClient;

  // IMPORTANT: Retrieve session from Supabase
  // Note: In server context, Supabase client should be configured to read from cookies
  // This requires proper initialization with cookie adapter for SSR
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();

  // Add session and user to context
  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  return next();
});
```

**CRITICAL NOTE**: The `supabaseClient` must be configured with cookie storage for SSR.
This may require creating a request-scoped client instead of a singleton.
See Supabase SSR documentation for proper implementation with Astro.

**Type Definitions Update:**

```typescript
// Add to src/env.d.ts
declare namespace App {
  interface Locals {
    supabase: import("./db/supabase.client").SupabaseClient;
    session: import("@supabase/supabase-js").Session | null;
    user: import("@supabase/supabase-js").User | null;
  }
}
```

#### 2.5.2 Protected Route Pattern

**Implementation in Astro Pages:**

```typescript
---
// Example: /src/pages/generate/index.astro
import Layout from "@/layouts/Layout.astro";
import GenerateReview from "@/components/generate/GenerateReview";

export const prerender = false;

// Authentication guard
const session = Astro.locals.session;
if (!session) {
  const currentPath = Astro.url.pathname;
  return Astro.redirect(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
}

// Extract user data for component
const user = {
  id: session.user.id,
  email: session.user.email,
};
---

<Layout title="Generate & Review - 10xCards" user={user}>
  <GenerateReview client:load />
</Layout>
```

#### 2.5.3 Public Route Pattern (Redirect if Authenticated)

**Implementation in Astro Pages:**

```typescript
---
// Example: /src/pages/auth/login.astro
import Layout from "@/layouts/Layout.astro";
import LoginForm from "@/components/auth/LoginForm";

export const prerender = false;

// Redirect authenticated users
const session = Astro.locals.session;
if (session) {
  return Astro.redirect("/generate");
}

// Extract redirect parameter
const url = new URL(Astro.request.url);
const redirectTo = url.searchParams.get("redirect") || "/generate";
---

<Layout title="Login - 10xCards">
  <LoginForm client:load redirectTo={redirectTo} />
</Layout>
```

#### 2.5.4 API Endpoint Authentication

**Pattern for Protected API Endpoints:**

```typescript
export const GET: APIRoute = async ({ locals }) => {
  // Get session from locals (set by middleware)
  const session = locals.session;
  if (!session) {
    return errorResponse(401, "Authentication required");
  }

  const userId = session.user.id;

  // Continue with authenticated logic
  // ...
};
```

**Update Existing API Endpoints:**

- Remove `DEFAULT_USER_ID` usage
- Add session check at beginning of each handler
- Extract `userId` from `locals.session.user.id`
- Return 401 if not authenticated

**Files to Update:**

- `/src/pages/api/flashcards.ts` (GET, POST, DELETE)
- `/src/pages/api/flashcards/[id].ts` (GET, PUT, DELETE)
- `/src/pages/api/ai-sessions.ts` (POST, GET)
- `/src/pages/api/ai-sessions/[sessionId]/candidates.ts` (GET)
- `/src/pages/api/ai-sessions/[sessionId]/candidates/actions.ts` (POST)

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Supabase Auth Integration

#### 3.1.1 Supabase Configuration

**Environment Variables Required:**

```bash
# .env (not committed)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

**Supabase Project Settings:**

- **Authentication Providers:** Email (enabled)
- **Email Templates:** Customize confirmation and password reset emails
- **Email Confirmation:** Required (enabled)
- **Password Requirements:** Minimum 8 characters (enforced by Supabase)
- **JWT Expiration:** 3600 seconds (1 hour) - configurable
- **Refresh Token Rotation:** Enabled
- **Site URL:** Set to `PUBLIC_APP_URL` value
- **Redirect URLs:** Whitelist:
  - `http://localhost:3000/auth/reset-password`
  - `http://localhost:3000/auth/verify-email`
  - `https://yourdomain.com/auth/reset-password` (production)
  - `https://yourdomain.com/auth/verify-email` (production)

#### 3.1.2 Email Templates Configuration

**Confirmation Email Template:**

- **Subject:** "Confirm your email for 10xCards"
- **Body:** Include confirmation link with token
- **Redirect:** `{{ .SiteURL }}/auth/verify-email`

**Password Reset Email Template:**

- **Subject:** "Reset your password for 10xCards"
- **Body:** Include reset link with token
- **Redirect:** `{{ .SiteURL }}/auth/reset-password`
- **Token Expiration:** 1 hour (default)

**Magic Link Template (Future):**

- Not used in MVP but available for future enhancement

### 3.2 Authentication Service

#### 3.2.1 Service Architecture

**File:** `/src/lib/services/auth.service.ts` (New)

**Class Structure:**

```typescript
export class AuthService {
  /**
   * Registers a new user with email and password
   */
  async register(supabase: SupabaseClient, email: string, password: string): Promise<RegisterResponseDto>;

  /**
   * Authenticates a user with email and password
   */
  async login(supabase: SupabaseClient, email: string, password: string): Promise<LoginResponseDto>;

  /**
   * Logs out the current user
   */
  async logout(supabase: SupabaseClient): Promise<void>;

  /**
   * Sends a password reset email
   */
  async requestPasswordReset(supabase: SupabaseClient, email: string, redirectUrl: string): Promise<void>;

  /**
   * Resets password with token
   */
  async resetPassword(supabase: SupabaseClient, token: string, newPassword: string): Promise<void>;

  /**
   * Retrieves current session
   */
  async getSession(supabase: SupabaseClient): Promise<SessionDto | null>;

  /**
   * Refreshes the current session
   */
  async refreshSession(supabase: SupabaseClient): Promise<SessionDto>;
}

export const authService = new AuthService();
```

#### 3.2.2 Method Implementations

**Register Method:**

```typescript
async register(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<RegisterResponseDto> {
  // Call Supabase Auth signup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${import.meta.env.PUBLIC_APP_URL}/auth/verify-email`,
    },
  });

  // Handle errors
  if (error) {
    // Map Supabase error codes
    if (error.message.includes("already registered")) {
      throw new Error("An account with this email already exists");
    }
    throw error;
  }

  // Validate response
  if (!data.user) {
    throw new Error("Failed to create user account");
  }

  // Return user data
  return {
    id: data.user.id,
    email: data.user.email!,
    created_at: data.user.created_at,
  };
}
```

**Login Method:**

```typescript
async login(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<LoginResponseDto> {
  // Call Supabase Auth signIn
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Handle errors
  if (error) {
    // Map Supabase error codes to user-friendly messages
    if (error.message.includes("Invalid login credentials")) {
      throw new Error("Invalid email or password");
    }
    if (error.message.includes("Email not confirmed")) {
      throw new Error("Please confirm your email address before logging in");
    }
    throw error;
  }

  // Validate response
  if (!data.session) {
    throw new Error("Failed to create session");
  }

  // Return session data
  return {
    access_token: data.session.access_token,
    expires_in: data.session.expires_in,
  };
}
```

**Logout Method:**

```typescript
async logout(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    // Log error but don't throw - logout should always succeed client-side
    console.error("Logout error:", error);
  }
}
```

**Request Password Reset Method:**

```typescript
async requestPasswordReset(
  supabase: SupabaseClient,
  email: string,
  redirectUrl: string
): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  // Don't throw error to prevent email enumeration
  // Just log it server-side
  if (error) {
    console.error("Password reset request error:", error);
  }
}
```

**Reset Password Method:**

```typescript
async resetPassword(
  supabase: SupabaseClient,
  token: string,
  newPassword: string
): Promise<void> {
  // First, verify the token by getting the session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    throw new Error("Password reset link is invalid or has expired");
  }

  // Update the password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    if (error.message.includes("same as the old password")) {
      throw new Error("New password must be different from your old password");
    }
    throw error;
  }
}
```

**Get Session Method:**

```typescript
async getSession(supabase: SupabaseClient): Promise<SessionDto | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Get session error:", error);
    return null;
  }

  if (!data.session) {
    return null;
  }

  return {
    user: {
      id: data.session.user.id,
      email: data.session.user.email!,
      created_at: data.session.user.created_at,
      email_confirmed_at: data.session.user.email_confirmed_at,
    },
    access_token: data.session.access_token,
    expires_at: data.session.expires_at!,
  };
}
```

### 3.3 Session Management

#### 3.3.1 Session Storage Strategy

**Approach:** Cookie-based sessions (Supabase default)

**Session Cookie:**

- **Name:** Managed by Supabase client (multiple cookies)
- **Storage:** `sb-<project-ref>-auth-token` (access token)
- **Refresh Token:** `sb-<project-ref>-auth-token-refresh` (refresh token)
- **HttpOnly:** Yes (secure)
- **Secure:** Yes (production)
- **SameSite:** Lax
- **Domain:** Auto-configured by Supabase
- **Path:** `/`

**Session Lifecycle:**

1. **Login:** Supabase sets session cookies automatically
2. **Request:** Middleware reads cookies and retrieves session
3. **Expiration:** Access token expires after 1 hour
4. **Refresh:** Supabase client auto-refreshes using refresh token
5. **Logout:** Cookies cleared by Supabase and manually by application

#### 3.3.2 Session Validation

**Middleware Validation:**

- Every request checks session via `supabase.auth.getSession()`
- Session added to `context.locals` for use in pages/endpoints
- No manual token validation needed (handled by Supabase)

**Client-Side Validation:**

- React components receive user prop from server
- No direct session access in client components
- Authentication state managed server-side

**Token Refresh:**

- Automatic via Supabase client
- Refresh token valid for 30 days (default)
- Silent refresh when access token expires
- No user interaction required

#### 3.3.3 Session Security

**Protection Mechanisms:**

- **CSRF Protection:** SameSite=Lax cookies
- **XSS Protection:** HttpOnly cookies (no JavaScript access)
- **Token Rotation:** Refresh tokens rotated on use
- **Secure Transport:** HTTPS only in production
- **Token Expiration:** Short-lived access tokens (1 hour)
- **Logout Everywhere:** Supabase supports revoking all sessions

**Security Headers (Add to Astro config):**

```typescript
// In astro.config.mjs
export default defineConfig({
  // ... existing config
  server: {
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  },
});
```

### 3.4 Authorization & Access Control

#### 3.4.1 Route Protection Levels

**Public Routes (No Authentication Required):**

- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset form
- `/auth/verify-email` - Email verification confirmation

**Smart Router (No Content, Always Redirects):**

- `/` - Landing page - **STAKEHOLDER CONFIRMED**: Acts as smart router
  - If unauthenticated: Redirect to `/auth/login`
  - If authenticated: Redirect to `/generate`

**Protected Routes (Authentication Required):**

- `/generate` - Flashcard generation (AI-powered)
- `/flashcards` - My flashcards CRUD (**includes button to open manual creation modal**)
- `/study` - Study session (**INCLUDED IN MVP per PRD US-010**, not future)
- All `/api/*` endpoints (except auth endpoints)

**Redirect Logic:**

- Unauthenticated access to protected route → `/auth/login?redirect=<original-path>`
- Authenticated access to public auth route → `/generate`
- After login → Redirect to original destination or `/generate`
- Landing page `/` always redirects (no content rendered)

#### 3.4.2 API Authorization

**Pattern:**

```typescript
export const GET: APIRoute = async ({ locals }) => {
  // 1. Check authentication
  const session = locals.session;
  if (!session) {
    return errorResponse(401, "Authentication required");
  }

  const userId = session.user.id;

  // 2. Resource ownership check (if applicable)
  const resource = await getResource(resourceId);
  if (resource.user_id !== userId) {
    return errorResponse(403, "You do not have permission to access this resource");
  }

  // 3. Proceed with authorized operation
  // ...
};
```

**Authorization Levels:**

- **Authenticated:** User must be logged in
- **Owner:** User must own the resource (checked via `user_id` column)
- **Admin:** Not implemented in MVP (all users have equal access)

#### 3.4.3 Row-Level Security (RLS)

**Supabase RLS Policies:**

**Table: `flashcards`**

```sql
-- Enable RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own flashcards
CREATE POLICY "Users can view own flashcards"
ON flashcards FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own flashcards
CREATE POLICY "Users can insert own flashcards"
ON flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own flashcards
CREATE POLICY "Users can update own flashcards"
ON flashcards FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own flashcards
CREATE POLICY "Users can delete own flashcards"
ON flashcards FOR DELETE
USING (auth.uid() = user_id);
```

**Table: `ai_generation_sessions`**

```sql
-- Enable RLS
ALTER TABLE ai_generation_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON ai_generation_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON ai_generation_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON ai_generation_sessions FOR UPDATE
USING (auth.uid() = user_id);
```

**Table: `reviews`** (**REMOVED - NOT NEEDED**)

**STAKEHOLDER DECISION**: The `reviews` table is not needed at this moment and has been removed from the implementation scope. Study session feature (US-010) will be implemented in a future iteration when requirements are clearer.

**Table: `event_logs`**

```sql
-- Enable RLS
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own event logs
CREATE POLICY "Users can view own event logs"
ON event_logs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own event logs
CREATE POLICY "Users can insert own event logs"
ON event_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Benefits:**

- Defense in depth (even if application logic fails, database enforces access control)
- Automatic filtering of queries by user
- Protection against SQL injection attacks
- Simplified application code (less manual authorization checks)

### 3.5 Security Considerations

#### 3.5.1 Password Security

**Hashing:**

- Handled by Supabase Auth (bcrypt)
- Never store or log plain-text passwords
- Minimum 8 characters enforced
- Complexity requirements enforced client and server-side

**Password Reset:**

- One-time use tokens
- 1-hour expiration
- Tokens invalidated after use
- No password hints or security questions

**Brute Force Protection:**

- Supabase provides built-in rate limiting
- Additional rate limiting can be added via middleware
- Account lockout after multiple failed attempts (Supabase feature)

#### 3.5.2 Email Security

**Verification:**

- Email confirmation required before login
- Confirmation link expires after 24 hours
- Resend confirmation available

**Anti-Enumeration:**

- Password reset always returns success (even if email doesn't exist)
- Registration error messages don't reveal if email exists
- Consistent response times for valid/invalid emails

**Email Spoofing Prevention:**

- SPF, DKIM, DMARC configured in Supabase
- Sender domain verified
- No user-generated content in emails

#### 3.5.3 Token Security

**Access Tokens:**

- Short-lived (1 hour)
- JWT format (signed by Supabase)
- Stored in HttpOnly cookies
- Not accessible via JavaScript

**Refresh Tokens:**

- Long-lived (30 days)
- Rotated on use
- Stored in HttpOnly cookies
- Revoked on logout

**Reset Tokens:**

- Single-use
- Short-lived (1 hour)
- Sent via email only
- Invalidated after password change

#### 3.5.4 HTTPS & Transport Security

**Requirements:**

- HTTPS enforced in production
- HTTP Strict Transport Security (HSTS) header
- Secure cookie flag enabled in production
- TLS 1.2+ only

**Configuration:**

```typescript
// In production environment check
if (import.meta.env.PROD) {
  // Enforce HTTPS
  if (request.url.protocol !== "https:") {
    return Response.redirect(request.url.href.replace("http:", "https:"), 301);
  }
}
```

#### 3.5.5 Input Sanitization

**Strategy:**

- Validate all inputs with Zod schemas
- Trim whitespace from strings
- Lowercase emails for consistency
- Escape HTML in user-generated content (not applicable for auth)
- Parameterized queries (Supabase handles this)

**XSS Prevention:**

- React automatically escapes content
- No `dangerouslySetInnerHTML` used
- Content Security Policy headers (future enhancement)

**SQL Injection Prevention:**

- Supabase client uses parameterized queries
- No raw SQL in application code
- RLS policies provide additional protection

---

## 4. IMPLEMENTATION CHECKLIST

### 4.1 Backend Implementation

- [ ] Create `/src/lib/schemas/auth.schemas.ts` with Zod validation schemas
- [ ] Create `/src/lib/services/auth.service.ts` with AuthService class
- [ ] Update `/src/types.ts` with additional authentication types
- [ ] Update `/src/env.d.ts` with Locals interface types
- [ ] Update `/src/middleware/index.ts` to retrieve and inject session
- [ ] Create `/src/pages/api/auth/register.ts` endpoint
- [ ] Create `/src/pages/api/auth/login.ts` endpoint
- [ ] Create `/src/pages/api/auth/logout.ts` endpoint
- [ ] Create `/src/pages/api/auth/forgot-password.ts` endpoint
- [ ] Create `/src/pages/api/auth/reset-password.ts` endpoint
- [ ] Update all existing API endpoints to use session-based authentication
- [ ] Remove `DEFAULT_USER_ID` from all API endpoints and services

### 4.2 Frontend Implementation

- [ ] Create `/src/components/auth/LoginForm.tsx`
- [ ] Create `/src/components/auth/RegisterForm.tsx`
- [ ] Create `/src/components/auth/ForgotPasswordForm.tsx`
- [ ] Create `/src/components/auth/ResetPasswordForm.tsx`
- [ ] Create `/src/components/auth/PasswordStrengthIndicator.tsx`
- [ ] Create `/src/components/layout/Header.tsx`
- [ ] Create `/src/components/flashcards/CreateFlashcardModal.tsx` - Modal dialog for manual flashcard creation (triggered from My Flashcards page)
- [ ] Create `/src/pages/auth/login.astro`
- [ ] Create `/src/pages/auth/register.astro`
- [ ] Create `/src/pages/auth/forgot-password.astro`
- [ ] Create `/src/pages/auth/reset-password.astro`
- [ ] Create `/src/pages/auth/verify-email.astro`
- [ ] Update `/src/pages/index.astro` with authentication redirect logic (redirect to `/auth/login` or `/generate` based on auth status)
- [ ] Update `/src/pages/generate/index.astro` with authentication guard
- [ ] Update `/src/pages/flashcards/index.astro` with authentication guard
- [ ] Update `/src/layouts/Layout.astro` to include Header component
- [x] ~~Update `/src/components/Welcome.astro` with login/register CTAs~~ **NOT NEEDED - Landing page always redirects**

### 4.3 Database & Supabase Configuration

- [ ] Configure Supabase Auth settings (email confirmation, password requirements)
- [ ] Customize email templates (confirmation, password reset)
- [ ] Configure redirect URLs in Supabase dashboard
- [ ] Enable RLS on all tables
- [ ] Create RLS policies for `flashcards` table
- [ ] Create RLS policies for `ai_generation_sessions` table
- [x] ~~Create RLS policies for `reviews` table~~ **REMOVED - Not needed per stakeholder decision**
- [ ] Create RLS policies for `event_logs` table
- [ ] Test RLS policies with different user scenarios
- [ ] Set up environment variables for development and production

### 4.4 Testing & Validation

- [ ] Test registration flow (success and error cases)
- [ ] Test email confirmation flow
- [ ] Test login flow (success and error cases)
- [ ] Test logout flow
- [ ] Test forgot password flow
- [ ] Test reset password flow
- [ ] Test protected route access (authenticated and unauthenticated)
- [ ] Test public route redirects (when authenticated)
- [ ] Test session persistence across page reloads
- [ ] Test session expiration and refresh
- [ ] Test RLS policies (attempt unauthorized access)
- [ ] Test all existing features with authentication enabled
- [ ] Test concurrent sessions (multiple devices)
- [ ] Test rate limiting (if implemented)

### 4.5 Security Hardening

- [ ] Review all error messages (no sensitive information leaked)
- [ ] Verify HTTPS enforcement in production
- [ ] Verify secure cookie flags in production
- [ ] Verify HttpOnly cookie flags
- [ ] Test CSRF protection
- [ ] Test XSS protection
- [ ] Review and test input validation
- [ ] Review and test authorization checks
- [ ] Verify password complexity requirements
- [ ] Verify token expiration times
- [ ] Test logout (session invalidation)
- [ ] Test password reset token single-use
- [ ] Verify email enumeration prevention

### 4.6 Documentation & Deployment

- [ ] Update README with authentication setup instructions
- [ ] Document environment variables
- [ ] Document Supabase configuration steps
- [ ] Create user guide for authentication features
- [ ] Update API documentation with authentication requirements
- [ ] Configure production environment variables
- [ ] Deploy and test in production environment
- [ ] Monitor authentication errors and logs
- [ ] Set up alerts for authentication failures

---

## 5. COMPATIBILITY NOTES

### 5.1 Existing Feature Compatibility

**Flashcard Generation:**

- No breaking changes
- User ID now from session instead of `DEFAULT_USER_ID`
- All existing functionality preserved
- Authentication required to access

**Flashcard CRUD:**

- No breaking changes
- User ID now from session instead of `DEFAULT_USER_ID`
- All existing functionality preserved
- Authentication required to access

**AI Sessions:**

- No breaking changes
- User ID now from session instead of `DEFAULT_USER_ID`
- All existing functionality preserved
- Authentication required to access

**Event Logging:**

- No breaking changes
- User ID now from session instead of `DEFAULT_USER_ID`
- All existing functionality preserved

### 5.2 Migration Strategy

**Development Environment:**

1. Implement authentication system
2. Keep `DEFAULT_USER_ID` temporarily for testing
3. Test all features with real authentication
4. Remove `DEFAULT_USER_ID` after verification

**Production Deployment:**

1. Deploy authentication system
2. Existing data remains intact (no schema changes)
3. Users must register/login to access application
4. No data migration required

**Data Considerations:**

- Existing flashcards/sessions have `user_id = DEFAULT_USER_ID`
- These will be inaccessible after authentication (by design)
- For production launch, database should be empty or seeded with test data
- If preserving test data, manually update `user_id` to real user IDs

### 5.3 Breaking Changes

**None for Application Logic:**

- All existing services and components work unchanged
- Only authentication layer added on top

**Breaking Changes for Development:**

- `DEFAULT_USER_ID` removed (requires real authentication)
- Direct API access requires authentication headers
- Testing requires user registration/login

---

## 6. FUTURE ENHANCEMENTS

### 6.1 Authentication Enhancements

**OAuth Providers:**

- Google Sign-In
- GitHub Sign-In
- Microsoft Sign-In

**Multi-Factor Authentication:**

- TOTP (Time-based One-Time Password)
- SMS verification
- Email verification codes

**Session Management:**

- View active sessions
- Logout from all devices
- Session activity log

**Account Management:**

- Change email address
- Change password (while logged in)
- Delete account
- Export user data

### 6.2 Security Enhancements

**Advanced Rate Limiting:**

- Per-user rate limits
- Per-IP rate limits
- Adaptive rate limiting

**Security Monitoring:**

- Failed login attempt tracking
- Suspicious activity detection
- Security event notifications

**Compliance:**

- GDPR compliance features
- Privacy policy acceptance
- Terms of service acceptance
- Cookie consent management

### 6.3 User Experience Enhancements

**Remember Me:**

- Extended session duration option
- Persistent login across browser sessions

**Social Features:**

- User profiles
- Deck sharing
- Collaborative flashcards

**Notifications:**

- Email notifications for security events
- Study reminders
- Achievement notifications

---

## 7. TECHNICAL DECISIONS & RATIONALE

### 7.1 Why Supabase Auth?

**Advantages:**

- Built-in authentication (no custom implementation needed)
- Email/password support out of the box
- Email templates and delivery handled
- JWT-based sessions (stateless)
- Row-Level Security integration
- OAuth providers available for future
- Automatic token refresh
- Security best practices built-in

**Alternatives Considered:**

- **Custom Auth:** More control but higher security risk and development time
- **Auth0:** More features but additional cost and complexity
- **Firebase Auth:** Good alternative but less integrated with Postgres

### 7.2 Why Cookie-Based Sessions?

**Advantages:**

- Automatic inclusion in requests (no manual header management)
- HttpOnly flag prevents XSS attacks
- Secure flag ensures HTTPS-only transmission
- SameSite flag prevents CSRF attacks
- Native browser support
- Works with SSR (server-side rendering)

**Alternatives Considered:**

- **LocalStorage:** Vulnerable to XSS attacks
- **SessionStorage:** Lost on tab close
- **In-Memory:** Lost on page reload

### 7.3 Why Server-Side Session Validation?

**Advantages:**

- Single source of truth (server)
- Consistent authentication state
- Immediate session invalidation on logout
- Works with SSR and protected routes
- No client-side token management

**Approach:**

- Middleware retrieves session on every request
- Session added to `context.locals`
- Pages and endpoints access session from locals
- No client-side session storage or validation

### 7.4 Why Zod for Validation?

**Advantages:**

- Type-safe validation
- Shared schemas between client and server
- Detailed error messages
- Composable schemas
- TypeScript integration
- Already used in project

**Consistency:**

- All existing API endpoints use Zod
- Authentication follows same pattern
- Reduces learning curve

---

## 8. APPENDIX

### 8.1 Environment Variables Reference

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Application Configuration
PUBLIC_APP_URL=http://localhost:3000  # Development
PUBLIC_APP_URL=https://yourdomain.com  # Production

# Optional: Custom Email Configuration (if not using Supabase default)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASS=your-password
```

### 8.2 Supabase CLI Commands Reference

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Pull database types
supabase gen types typescript --linked > src/db/database.types.ts

# Run migrations
supabase db push

# View logs
supabase functions logs

# Test RLS policies
supabase db test
```

### 8.3 Key File Locations

**New Files:**

- `/src/lib/schemas/auth.schemas.ts` - Zod validation schemas
- `/src/lib/services/auth.service.ts` - Authentication service
- `/src/components/auth/LoginForm.tsx` - Login form component
- `/src/components/auth/RegisterForm.tsx` - Registration form component
- `/src/components/auth/ForgotPasswordForm.tsx` - Forgot password form
- `/src/components/auth/ResetPasswordForm.tsx` - Reset password form
- `/src/components/auth/PasswordStrengthIndicator.tsx` - Password strength UI
- `/src/components/layout/Header.tsx` - Application header
- `/src/components/flashcards/CreateFlashcardModal.tsx` - Manual flashcard creation modal (US-003)
- `/src/pages/auth/login.astro` - Login page
- `/src/pages/auth/register.astro` - Registration page
- `/src/pages/auth/forgot-password.astro` - Forgot password page
- `/src/pages/auth/reset-password.astro` - Reset password page
- `/src/pages/auth/verify-email.astro` - Email verification page
- `/src/pages/api/auth/register.ts` - Registration endpoint
- `/src/pages/api/auth/login.ts` - Login endpoint
- `/src/pages/api/auth/logout.ts` - Logout endpoint
- `/src/pages/api/auth/forgot-password.ts` - Forgot password endpoint
- `/src/pages/api/auth/reset-password.ts` - Reset password endpoint

**Modified Files:**

- `/src/middleware/index.ts` - Add session retrieval
- `/src/env.d.ts` - Add Locals interface types
- `/src/types.ts` - Add authentication types
- `/src/layouts/Layout.astro` - Add Header component
- `/src/pages/index.astro` - Add authentication redirect (smart router to `/auth/login` or `/generate`)
- `/src/pages/generate/index.astro` - Add authentication guard
- `/src/pages/flashcards/index.astro` - Add authentication guard and manual creation button/modal
- ~~`/src/components/Welcome.astro`~~ - Not needed (landing page always redirects)
- All `/src/pages/api/**/*.ts` - Replace DEFAULT_USER_ID with session

### 8.4 API Endpoint Summary

| Endpoint                                   | Method | Access    | Purpose                   |
| ------------------------------------------ | ------ | --------- | ------------------------- |
| `/api/auth/register`                       | POST   | Public    | User registration         |
| `/api/auth/login`                          | POST   | Public    | User login                |
| `/api/auth/logout`                         | POST   | Public    | User logout               |
| `/api/auth/forgot-password`                | POST   | Public    | Request password reset    |
| `/api/auth/reset-password`                 | POST   | Public    | Reset password with token |
| `/api/flashcards`                          | GET    | Protected | List flashcards           |
| `/api/flashcards`                          | POST   | Protected | Create flashcards         |
| `/api/flashcards`                          | DELETE | Protected | Delete flashcards         |
| `/api/flashcards/[id]`                     | GET    | Protected | Get flashcard             |
| `/api/flashcards/[id]`                     | PUT    | Protected | Update flashcard          |
| `/api/flashcards/[id]`                     | DELETE | Protected | Delete flashcard          |
| `/api/ai-sessions`                         | POST   | Protected | Create AI session         |
| `/api/ai-sessions`                         | GET    | Protected | List AI sessions          |
| `/api/ai-sessions/[id]/candidates`         | GET    | Protected | Get candidates            |
| `/api/ai-sessions/[id]/candidates/actions` | POST   | Protected | Process candidates        |

### 8.5 Page Route Summary

| Route                   | Access                | Purpose                                                      |
| ----------------------- | --------------------- | ------------------------------------------------------------ |
| `/`                     | **Public (CONFLICT)** | Landing page - **PRD US-001 line 53 suggests auth required** |
| `/auth/login`           | Public                | Login page                                                   |
| `/auth/register`        | Public                | Registration page                                            |
| `/auth/forgot-password` | Public                | Forgot password page                                         |
| `/auth/reset-password`  | Public                | Reset password page                                          |
| `/auth/verify-email`    | Public                | Email verification confirmation                              |
| `/generate`             | Protected             | Flashcard generation                                         |
| `/flashcards`           | Protected             | My flashcards CRUD                                           |
| `/study`                | Protected             | **Study session (MVP per US-010, not future)**               |

---

**End of Specification**

This specification provides a complete blueprint for implementing authentication in the 10xCards application. All components, services, and patterns are designed to integrate seamlessly with the existing codebase while maintaining security best practices and user experience standards.
