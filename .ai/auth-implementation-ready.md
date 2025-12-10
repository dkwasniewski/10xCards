# Authentication Implementation - Ready to Start

**Date**: November 25, 2025  
**Status**: ✅ ALL CONFLICTS RESOLVED - Ready for Implementation  
**Stakeholder**: Daniel Kwasniewski

---

## ✅ All Critical Decisions Made

### 1. Landing Page Behavior
**Decision**: Smart router pattern
- Unauthenticated users → Redirect to `/auth/login`
- Authenticated users → Redirect to `/generate`
- No content rendered (pure router)

### 2. Reviews Table
**Decision**: Not needed at this time
- Removed from all documentation
- Study session (US-010) will be future iteration
- Database schema simplified

### 3. Manual Flashcard Creation
**Decision**: Modal on My Flashcards page
- Location: `/flashcards` page
- Trigger: "Create Flashcard" button in page header
- UI: Modal dialog with front/back form
- Validation: Front ≤200 chars, Back ≤500 chars

---

## 📋 Implementation Checklist

### Phase 1: Backend Foundation (High Priority)

#### Authentication Service & Schemas
- [ ] Create `/src/lib/schemas/auth.schemas.ts` with Zod validation
- [ ] Create `/src/lib/services/auth.service.ts` with AuthService class
- [ ] Update `/src/types.ts` with authentication DTOs
- [ ] Update `/src/env.d.ts` with Locals interface types

#### Middleware & Session Management
- [ ] **CRITICAL**: Implement request-scoped Supabase client with cookie adapter
- [ ] Update `/src/middleware/index.ts` to retrieve and inject session
- [ ] Test session persistence across requests

#### API Endpoints
- [ ] Create `/src/pages/api/auth/register.ts`
- [ ] Create `/src/pages/api/auth/login.ts`
- [ ] Create `/src/pages/api/auth/logout.ts`
- [ ] Create `/src/pages/api/auth/forgot-password.ts`
- [ ] Create `/src/pages/api/auth/reset-password.ts`

#### Update Existing APIs
- [ ] Update `/src/pages/api/flashcards.ts` (remove DEFAULT_USER_ID)
- [ ] Update `/src/pages/api/flashcards/[id].ts` (remove DEFAULT_USER_ID)
- [ ] Update `/src/pages/api/ai-sessions.ts` (remove DEFAULT_USER_ID)
- [ ] Update `/src/pages/api/ai-sessions/[sessionId]/candidates.ts`
- [ ] Update `/src/pages/api/ai-sessions/[sessionId]/candidates/actions.ts`

### Phase 2: Frontend Components (High Priority)

#### Authentication Forms
- [ ] Create `/src/components/auth/LoginForm.tsx`
- [ ] Create `/src/components/auth/RegisterForm.tsx`
- [ ] Create `/src/components/auth/ForgotPasswordForm.tsx`
- [ ] Create `/src/components/auth/ResetPasswordForm.tsx`
- [ ] Create `/src/components/auth/PasswordStrengthIndicator.tsx`

#### Layout & Navigation
- [ ] Create `/src/components/layout/Header.tsx` (with user menu & logout)
- [ ] Update `/src/layouts/Layout.astro` to include Header

#### Flashcard Components
- [ ] Create `/src/components/flashcards/CreateFlashcardModal.tsx`
- [ ] Update `/src/components/flashcards/PageHeader.tsx` to include "Create" button

### Phase 3: Pages & Routes (High Priority)

#### Authentication Pages
- [ ] Create `/src/pages/auth/login.astro`
- [ ] Create `/src/pages/auth/register.astro`
- [ ] Create `/src/pages/auth/forgot-password.astro`
- [ ] Create `/src/pages/auth/reset-password.astro`
- [ ] Create `/src/pages/auth/verify-email.astro`

#### Protected Pages
- [ ] Update `/src/pages/index.astro` (smart router: redirect to `/auth/login` or `/generate`)
- [ ] Update `/src/pages/generate/index.astro` (add auth guard)
- [ ] Update `/src/pages/flashcards/index.astro` (add auth guard + manual creation)

### Phase 4: Database & Supabase (Medium Priority)

#### Supabase Configuration
- [ ] Configure Supabase Auth settings (email confirmation enabled)
- [ ] Customize email templates (confirmation & password reset)
- [ ] Configure redirect URLs in Supabase dashboard
- [ ] Set up environment variables (SUPABASE_URL, SUPABASE_KEY, PUBLIC_APP_URL)

#### Row-Level Security
- [ ] Enable RLS on `flashcards` table
- [ ] Create RLS policies for `flashcards` table
- [ ] Enable RLS on `ai_generation_sessions` table
- [ ] Create RLS policies for `ai_generation_sessions` table
- [ ] Enable RLS on `event_logs` table
- [ ] Create RLS policies for `event_logs` table

### Phase 5: Testing & Validation (High Priority)

#### Authentication Flows
- [ ] Test registration flow (success & error cases)
- [ ] Test email confirmation flow
- [ ] Test login flow (success & error cases)
- [ ] Test logout flow
- [ ] Test forgot password flow
- [ ] Test reset password flow

#### Authorization & Security
- [ ] Test protected route access (authenticated & unauthenticated)
- [ ] Test landing page redirects
- [ ] Test session persistence across page reloads
- [ ] Test RLS policies (attempt unauthorized access)
- [ ] Test all existing features with authentication enabled

#### Manual Flashcard Creation
- [ ] Test modal opens from /flashcards page
- [ ] Test form validation (front/back length)
- [ ] Test flashcard creation with source=manual
- [ ] Test flashcard appears in list after creation

### Phase 6: Security Hardening (Medium Priority)

- [ ] Review all error messages (no sensitive info leaked)
- [ ] Verify HTTPS enforcement in production
- [ ] Verify secure cookie flags
- [ ] Test CSRF protection
- [ ] Test XSS protection
- [ ] Verify password complexity requirements
- [ ] Test logout (session invalidation)
- [ ] Verify email enumeration prevention

---

## 🔧 Technical Implementation Notes

### Critical: Supabase SSR Setup

The middleware MUST use a request-scoped Supabase client with cookie adapter:

```typescript
// src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from '@supabase/ssr'

export const onRequest = defineMiddleware(async (context, next) => {
  // Create request-scoped client with cookie access
  const supabase = createServerClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get: (key) => context.cookies.get(key)?.value,
        set: (key, value, options) => {
          context.cookies.set(key, value, options);
        },
        remove: (key, options) => {
          context.cookies.delete(key, options);
        },
      },
    }
  );
  
  // Inject into context
  context.locals.supabase = supabase;
  
  // Retrieve session
  const { data: { session } } = await supabase.auth.getSession();
  context.locals.session = session;
  context.locals.user = session?.user ?? null;
  
  return next();
});
```

### Landing Page Implementation

```typescript
// src/pages/index.astro
---
export const prerender = false;

const session = Astro.locals.session;

// Smart router - always redirect
if (session) {
  return Astro.redirect("/generate");
} else {
  return Astro.redirect("/auth/login");
}
---
```

### Manual Flashcard Creation Flow

1. User on `/flashcards` page
2. Clicks "Create Flashcard" button in PageHeader
3. CreateFlashcardModal opens
4. User fills form (front/back)
5. Form validates (front ≤200, back ≤500)
6. POST to `/api/flashcards` with `source: "manual"`
7. Modal closes, list refreshes
8. New flashcard appears in list

---

## 📦 Required Dependencies

Check if these are already installed:

```bash
npm install @supabase/ssr
npm install @supabase/supabase-js
npm install zod
```

---

## 🌍 Environment Variables

Required in `.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Application Configuration
PUBLIC_APP_URL=http://localhost:3000  # Development
# PUBLIC_APP_URL=https://yourdomain.com  # Production
```

---

## 🎯 Implementation Order Recommendation

### Week 1: Core Authentication
1. Set up Supabase SSR client (middleware)
2. Create auth service & schemas
3. Implement auth API endpoints
4. Create auth form components
5. Create auth pages

### Week 2: Integration & Protection
1. Update existing API endpoints (remove DEFAULT_USER_ID)
2. Add auth guards to protected pages
3. Implement landing page router
4. Create Header component
5. Test authentication flows

### Week 3: Manual Creation & RLS
1. Create CreateFlashcardModal component
2. Update /flashcards page with creation button
3. Configure Supabase RLS policies
4. Test manual flashcard creation
5. Test authorization & security

### Week 4: Testing & Hardening
1. Comprehensive testing of all flows
2. Security hardening
3. Email template customization
4. Production environment setup
5. Documentation updates

---

## ✅ Success Criteria

Implementation is complete when:

- [x] All 3 critical conflicts resolved
- [ ] All authentication flows work (register, login, logout, reset)
- [ ] All protected routes require authentication
- [ ] Landing page redirects correctly
- [ ] Manual flashcard creation works from /flashcards page
- [ ] RLS policies prevent unauthorized access
- [ ] All existing features work with authentication
- [ ] No DEFAULT_USER_ID in codebase
- [ ] Email confirmation works
- [ ] Password reset works
- [ ] Session persists across page reloads
- [ ] All tests pass

---

## 📚 Reference Documents

- **PRD**: `.ai/prd.md` - Product requirements and user stories
- **Auth Spec**: `.ai/auth-spec.md` - Complete authentication architecture
- **Conflict Resolution**: `.ai/prd-auth-spec-conflict-resolution.md` - Detailed analysis

---

## 🚀 Ready to Start!

All planning is complete. All conflicts resolved. All decisions documented.

**Next Step**: Begin Phase 1 - Backend Foundation

Good luck with the implementation! 🎉





