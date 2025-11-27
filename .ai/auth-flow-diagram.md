# Authentication Flow Diagram

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Visits Any Page                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Middleware Intercepts                        │
│                  (src/middleware/index.ts)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │ Is path public?│
                   └────────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼ YES                       ▼ NO
    ┌─────────────────┐         ┌──────────────────┐
    │ Public paths:   │         │ Protected paths: │
    │ - /             │         │ - /flashcards    │
    │ - /auth/*       │         │ - /generate      │
    │ - /api/auth/*   │         │ - /api/*         │
    └────────┬────────┘         └────────┬─────────┘
             │                           │
             │                           ▼
             │                  ┌─────────────────┐
             │                  │ Validate session│
             │                  │  (getUser())    │
             │                  └────────┬────────┘
             │                           │
             │                  ┌────────┴────────┐
             │                  │                 │
             │                  ▼ Authenticated   ▼ Not Authenticated
             │            ┌──────────┐      ┌──────────────────┐
             │            │ Continue │      │ Redirect to      │
             │            │ to page  │      │ /auth/login      │
             │            └──────────┘      └──────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Continue to     │
    │ public page     │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────────────────────────┐
    │ Page-level redirect logic (if any)  │
    └─────────────────────────────────────┘
```

## Specific Page Behaviors

### 1. Root Path (`/`) - Smart Router

```
User visits /
     │
     ▼
Middleware: Protected path ⚠️
     │
     ▼
Validate session
     │
     ├─ Authenticated? ──YES──> Allow access to page
     │                           │
     │                           ▼
     │                    Page redirects to /generate
     │
     └─ Not authenticated? ──NO──> Middleware redirects to /auth/login
```

**Note**: The root path acts as a smart router, not a landing page.

### 2. Auth Pages (`/auth/login`, `/auth/register`, etc.)

```
User visits /auth/login
     │
     ▼
Middleware: Public path ✓
     │
     ▼
Page checks session
     │
     ├─ Authenticated? ──YES──> Redirect to /generate
     │
     └─ Not authenticated? ──NO──> Show login form
```

### 3. Protected Pages (`/flashcards`, `/generate`)

```
User visits /flashcards
     │
     ▼
Middleware: Protected path ⚠️
     │
     ▼
Validate session
     │
     ├─ Authenticated? ──YES──> Continue to page
     │
     └─ Not authenticated? ──NO──> Redirect to /auth/login
```

### 4. API Endpoints

#### Auth API Endpoints (`/api/auth/*`)

```
Request to /api/auth/login
     │
     ▼
Middleware: Public path ✓
     │
     ▼
Process request (no auth required)
```

#### Protected API Endpoints (`/api/flashcards`, `/api/ai-sessions`)

```
Request to /api/flashcards
     │
     ▼
Middleware: Protected path ⚠️
     │
     ▼
Validate session
     │
     ├─ Authenticated? ──YES──> Process request
     │                           (user available in locals)
     │
     └─ Not authenticated? ──NO──> Redirect to /auth/login
                                   (or return 401 for API)
```

## User Experience Scenarios

### Scenario 1: New User (Not Logged In)

```
1. Visit / → Redirected to /auth/login ⚠️
2. Click "Sign Up" → Go to /auth/register ✓
3. Register → Redirected to /generate ✓
4. Visit / → Redirected to /generate ✓
5. Visit /flashcards → Access granted ✓
```

### Scenario 2: Returning User (Not Logged In)

```
1. Visit /generate → Redirected to /auth/login ⚠️
2. Login → Redirected to /generate ✓
3. Visit / → Redirected to /generate ✓
4. Visit /flashcards → Access granted ✓
```

### Scenario 3: Logged In User

```
1. Visit / → Redirected to /generate ✓
2. Visit /auth/login → Redirected to /generate ✓
3. Visit /flashcards → Access granted ✓
4. Visit /generate → Access granted ✓
5. Logout → Session cleared
6. Visit /generate → Redirected to /auth/login ⚠️
```

### Scenario 4: Direct Link Access (Not Logged In)

```
1. Click link to /flashcards → Redirected to /auth/login ⚠️
2. Login → Redirected to /generate ✓
   (Note: Could be enhanced to redirect back to /flashcards)
```

## Security Checkpoints

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Middleware (Server-Side)                         │
│  ├─ Validates JWT token with getUser()                     │
│  ├─ Checks public paths list                               │
│  └─ Redirects unauthorized access                          │
│                                                             │
│  Layer 2: Page-Level (Server-Side)                         │
│  ├─ Checks session for authenticated users                 │
│  └─ Redirects to appropriate page                          │
│                                                             │
│  Layer 3: Cookie Security                                  │
│  ├─ httpOnly: true (no JS access)                          │
│  ├─ secure: true (HTTPS only in prod)                      │
│  ├─ sameSite: 'lax' (CSRF protection)                      │
│  └─ path: '/' (app-wide)                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

✅ **Default Deny**: All routes protected unless explicitly public  
✅ **Server-Side**: No client-side bypass possible  
✅ **JWT Validation**: Proper token validation with `getUser()`  
✅ **Seamless UX**: Smart redirects based on auth state  
✅ **Cookie Security**: Industry-standard cookie settings  
✅ **Session Refresh**: Automatic token refresh by Supabase  

## Configuration

### Public Paths (No Auth Required)

```typescript
const PUBLIC_PATHS = [
  "/auth/login",                    // Login page
  "/auth/register",                 // Register page
  "/auth/forgot-password",          // Forgot password page
  "/auth/reset-password",           // Reset password page
  "/auth/verify-email",             // Email verification page
  "/api/auth/login",                // Login API
  "/api/auth/register",             // Register API
  "/api/auth/logout",               // Logout API
  "/api/auth/reset-password",       // Reset password API
];
```

**Note**: Root path `/` is NOT public - it requires authentication and acts as a smart router.

### Protected Paths (Auth Required)

**All other paths** are automatically protected by default.

## Implementation Files

1. **Middleware**: `src/middleware/index.ts`
   - Main authentication enforcement
   - Session validation
   - Redirect logic

2. **Landing Page**: `src/pages/index.astro`
   - Redirects authenticated users to `/generate`

3. **Auth Pages**: `src/pages/auth/*.astro`
   - Redirect authenticated users to `/generate`

4. **Protected Pages**: `src/pages/flashcards/`, `src/pages/generate/`
   - Rely on middleware for protection

5. **Supabase Client**: `src/db/supabase.client.ts`
   - Cookie handling
   - Session management

## Testing the Flow

### Manual Testing Commands

```bash
# Test as unauthenticated user
curl -I http://localhost:3000/flashcards
# Expected: 302 redirect to /auth/login

# Test as authenticated user (with session cookie)
curl -I -b "session_cookie=..." http://localhost:3000/flashcards
# Expected: 200 OK

# Test landing page redirect
curl -I -b "session_cookie=..." http://localhost:3000/
# Expected: 302 redirect to /generate
```

### Browser Testing

1. Open incognito/private window
2. Visit `http://localhost:3000/flashcards`
3. Should redirect to `/auth/login`
4. Login with valid credentials
5. Should redirect to `/generate`
6. Visit `/` - should redirect to `/generate`
7. Visit `/auth/login` - should redirect to `/generate`
8. Logout
9. Visit `/` - should show landing page
10. Visit `/flashcards` - should redirect to `/auth/login`

## Future Enhancements

- [ ] Remember redirect URL after login (redirect back to intended page)
- [ ] Role-based access control (admin, user, etc.)
- [ ] Session timeout configuration
- [ ] Rate limiting for auth endpoints
- [ ] Multi-factor authentication (MFA)
- [ ] OAuth providers (Google, GitHub, etc.)

