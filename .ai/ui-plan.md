# UI Architecture for 10xCards

## 1. UI Structure Overview

10xCards provides a protected single-page application (SPA) where all routes—except authentication flows (`/login`, `/register`, `/forgot-password`, `/reset-password`)—require a valid Supabase session. While the session is verified, a branded full-screen spinner is shown. After successful verification, users land directly in the **Generate & Review** view, rendered inside a persistent Application Shell that contains:

1. Top bar navigation (desktop & tablet) that collapses to a hamburger drawer on mobile (<640 px).
2. Global React ErrorBoundary wrapping the entire tree with shadcn/ui toast notifications for unhandled errors.
3. Central Fetch Provider that injects `Authorization` (JWT) and optional `X-Client-Version` headers into every request.
4. React Context for lightweight state (auth/user info, global UI states). No client-side caching layer for MVP.
5. Shared shadcn/ui primitives (Button, Input, Modal, Dialog, Spinner, Toast) providing consistent styling.

All views use Tailwind 4 responsive utilities and shadcn/ui accessibility defaults. Dark mode and extensive a11y tweaks are out-of-scope for MVP.

## 2. View List

| #   | View                | Path                     | Main Purpose                                                                   | Key Information / Components                                                                                                                                                                                                                                                                                                         | UX · A11y · Security Notes                                                                                              |
| --- | ------------------- | ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | Landing / Marketing | `/`                      | Provide product overview & CTA to sign up / log in.                            | Hero section with headline and subheadline, visual example with mock flashcards, 3 feature cards (AI Generation, Smart Review, Organized Library), 3-step "How It Works" flow, dual CTAs (Get Started Free / Sign In). Authenticated users redirect to `/generate`.                                                                 | Public page; responsive design; uses existing shadcn/ui Button components and Tailwind styling.                         |
| 2   | Login               | `/login`                 | Authenticate returning users.                                                  | Email & password fields, submit button, link to register & forgot-password, inline validation errors, global toast on generic errors.                                                                                                                                                                                                | Map 400 errors to fields; rate-limit feedback.                                                                          |
| 3   | Register            | `/register`              | Account creation flow.                                                         | Email, password, confirm password, terms checkbox.                                                                                                                                                                                                                                                                                   | Password strength meter; map validation errors.                                                                         |
| 4   | Forgot Password     | `/forgot-password`       | Request reset link.                                                            | Email field, success state notice.                                                                                                                                                                                                                                                                                                   | Don’t reveal if email exists.                                                                                           |
| 5   | Reset Password      | `/reset-password?token=` | Set new password via emailed link.                                             | New password fields, submit.                                                                                                                                                                                                                                                                                                         | Validate token; redirect expired link.                                                                                  |
| 6   | Application Shell   | `/*`                     | Persistent layout for protected routes.                                        | TopBar/Hamburger, Outlet, ErrorBoundary, Spinner while lazy-loading.                                                                                                                                                                                                                                                                 | RouteGuard redirects 401 to `/login`.                                                                                   |
| 7   | Generate & Review   | `/generate`              | Generate AI candidates and review all pending ones (current + prior sessions). | Section 1: Pending candidates from prior sessions (if any) with CandidateList. Section 2: Textarea (1 000–10 000 chars), model select, Generate button, inline errors. Section 3: Newly generated candidates. All use CandidateList w/ checkboxes, select-all, badges, pagination (10), Accept/Edit/Reject buttons, batch API calls. | Disable Generate while loading; show submission spinner; confirm destructive reject; optimistic UI rollback on failure. |
| 8   | My Flashcards       | `/flashcards`            | CRUD list of user's saved cards, with manual creation.                         | "New Flashcard" button (opens modal), search input (debounced 300 ms), FlashcardList rows w/ badges, Edit/Delete icon buttons, pagination (10). Modal: FlashcardEditor with front/back fields (≤200/500 chars), Save & Cancel buttons, inline length validation.                                                                     | Confirm deletion; map validation errors in modal editor; new card appears in list after successful creation.            |
| 9   | Study Session       | `/study`                 | Sequential study of cards via spaced-repetition.                               | Card viewer (front/back flip), rating buttons (1-5), progress bar.                                                                                                                                                                                                                                                                   | Disable rating until back shown; keyboard shortcuts; handle empty queue.                                                |
| 10  | Account             | `/account`               | Manage account & trigger password reset.                                       | Email display (read-only), Reset Password button (POST `/auth/forgot-password`).                                                                                                                                                                                                                                                     | Show success toast; protect against CSRF via JWT.                                                                       |
| 11  | 404 Not Found       | `*`                      | Fallback for unknown routes.                                                   | Message & link to login.                                                                                                                                                                                                                                                                                                             | None.                                                                                                                   |

## 3. User Journey Map

1. Visitor lands on `/` → clicks "Sign up" → registers (US-001).
2. Post-registration redirect to `/login` → user authenticates (US-001).
3. RouteGuard mounts, displays full-screen spinner while verifying Supabase session. On success, redirect to `/generate`.
4. User opens **My Flashcards** and clicks **New Flashcard** button → modal opens with FlashcardEditor → fills in front/back, saves (US-003). New card appears immediately in the list below.
5. From top bar, user selects **Generate & Review** → sees any pending candidates from previous sessions at the top (US-005).
6. User pastes text → clicks **Generate**. Inline length validation errors (US-004).
7. After successful POST `/ai-sessions`, newly generated candidates render below the form with badges and checkboxes (US-004).
8. User selects multiple candidates (from pending or newly generated), clicks **Accept** (US-005) → backend persists via bulk actions. Accepted cards disappear from list; toast confirms.
9. User navigates back to **My Flashcards** to view all saved cards (US-006). Uses search to filter (US-006).
10. User clicks Edit icon on a flashcard row → modal opens with FlashcardEditor pre-filled → edits and saves (US-007). Updated card reflects changes immediately.
11. User clicks **Study Session** to start spaced-repetition flow (US-010). Rates recall quality; next card shown until complete.
12. At any time, user opens Account page to send reset link (US-002).
13. User logs out; session cleared; redirect to `/login` (US-008).

## 4. Layout and Navigation Structure

```
<App>
  <RouteGuard>
    {isAuthPending ? <FullScreenSpinner /> :
      <ApplicationShell>
        <TopBar />   // drawer on mobile
        <Outlet />   // nested routes
        <ToastProvider />
      </ApplicationShell>
    }
  </RouteGuard>
</App>
```

TopBar items (desktop/tablet): Generate & Review | My Flashcards | Study Session | Account ▼ (avatar).  
Mobile: Hamburger opens Drawer with same links.  
Active route highlighted; aria-current attributes set for accessibility.

Pagination controls: « Prev | 1 2 3 … n | Next » – disabled states & screen-reader labels.

## 5. Key Components

1. **RouteGuard** – Checks Supabase JWT; handles loading spinner & redirection on 401.
2. **TopBar / DrawerNav** – Responsive navigation, highlights current route.
3. **FullScreenSpinner** – Centered logo + spinner during auth & heavy loads.
4. **FlashcardEditor** – Reusable plain-text front/back editor with validation; used in modals for Create (My Flashcards), Edit (My Flashcards), and inline Edit (Generate & Review candidates).
5. **CandidateList** – Table-like list of AI candidates with checkboxes, badges, and bulk action bar; used in Generate & Review view for both pending and newly generated candidates.
6. **FlashcardList** – Paginated table of saved flashcards with search, badges, Edit/Delete; includes "New Flashcard" button triggering creation modal.
7. **Pagination** – Numbered controls accepting `page`, `total`, `onChange`.
8. **Badge** – Displays "AI" or "Manual".
9. **Modal / Dialog** – Confirmation for destructive actions; also wraps FlashcardEditor for Create/Edit flows.
10. **ToastProvider / useToast** – Trigger success/error toasts; integrated with ErrorBoundary.
11. **ErrorBoundary** – Catches runtime errors; shows fallback UI + toast; logs error.
12. **SearchInput** – Debounced input emitting value after 300 ms.
13. **CardViewer** – Flippable flashcard with rating buttons for Study Session.
14. **FetchProvider** – Central wrapper adding auth headers & handling 401 globally.

## 6. Mapping Requirements & User Stories to UI

| PRD Story                             | UI Element(s)                                                     | Notes                                                             |
| ------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| US-001 Registration, Login & Security | Login/Register/ForgotPassword views; RouteGuard; JWT headers      | Auth flows secure all app routes.                                 |
| US-002 Password Reset                 | ForgotPassword + Account Reset button                             | Backend endpoint pending.                                         |
| US-003 Manual Flashcard Creation      | My Flashcards view, "New Flashcard" button, FlashcardEditor modal | Validates lengths; modal keeps context.                           |
| US-004 AI-Generated Flashcards        | Generate & Review view, CandidateList, POST `/ai-sessions`        | Inline errors, badges.                                            |
| US-005 Bulk Review of Candidates      | Generate & Review view, CandidateList w/ bulk actions             | Accept/Edit/Reject flows; shows pending + new.                    |
| US-006 Browsing & Searching           | My Flashcards, SearchInput, Pagination                            | Debounced search; sort options future work.                       |
| US-007 Editing & Deleting             | My Flashcards, FlashcardList row Edit/Delete with Modal + Editor  | Validation + confirmation dialog; consistent pattern with Create. |
| US-008 Secure Access                  | RouteGuard; fetch wrapper auto-injecting JWT                      | Redirect unauthorized to `/login`.                                |
| US-009 Display & Layout               | Application Shell, TopBar, lists displaying badges                | Consistent display across views.                                  |
| US-010 Study Session View             | Study Session view, CardViewer, rating buttons                    | Sequential flow & progress bar.                                   |

## 7. Edge Cases & Error States

- API 400 validation errors → mapped to specific form fields; unknown keys → toast fallback.
- API 401/403 → global handler triggers logout & redirect to `/login`.
- Network failure → retry hint & toast.
- Empty lists (no candidates/cards) → friendly empty-state illustrations & CTA.
- Study Session with zero due cards → message “You’re all caught up!” with link back.
- Token expiration during active session → silent refresh attempt, else logout.
- Exceeding rate limits (429) on `/ai-sessions` → inline error near Generate button.

---

This architecture aligns with the API plan and satisfies all functional requirements for the MVP while maintaining a clear, accessible, and secure user experience.
