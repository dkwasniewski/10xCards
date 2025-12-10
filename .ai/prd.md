# Product Requirements Document (PRD) – 10xCards

## 1. Product Overview

10xCards is a web application for quickly generating and managing educational flashcards. With AI integration (Openrouter.ai) and a simple user interface, it enables creating flashcards from pasted text or manually, organizing them, and leveraging a pre-built spaced-repetition algorithm.

## 2. User Problem

Manually creating high-quality flashcards is time-consuming and discourages use of the effective spaced-repetition learning method. Users need a tool that automates part of the work while retaining control over content.

## 3. Functional Requirements

- Email/password authentication and password reset via one-time links (Supabase Auth)
- Form for pasting text and generating a list of AI-generated flashcard candidates
- Manual creation of single flashcards (front/back)
- Review list with bulk accept/edit/reject operations
- Persistent storage of accepted flashcards in the database
- CRUD view (browse, search, edit, delete) for saved flashcards
- Event logging (creation, edit, AI/manual source, sessions, timestamps)
- Integration with an existing spaced-repetition algorithm (external package)

## 4. Product Scope

### In Scope for MVP

- Secure sign-up, login, and password reset
- AI generation of **multiple flashcard candidates** from pasted text (see US-004 for details)
- Manual creation and editing of flashcards
- Simple CRUD interface for flashcards
- Text search on front/back fields
- Event logging
- "Study Session" view using an external spaced-repetition algorithm (see US-010)

### Out of Scope for MVP

- Custom spaced-repetition algorithms (Anki, SuperMemo)
- Importing file formats (PDF, DOCX)
- Sharing decks between users
- Integrations with external platforms
- Mobile applications

## 5. User Stories

- **ID: US-001**
  **Title:** Registration, Login & Security
  **Description:** A new user registers using email and password, confirms their email, and logs in. No one else can access the UI.
  **Acceptance Criteria:**
  - User can sign up with a valid email and strong password.
  - They receive an email confirmation link (separate feature from password-reset).
  - After email confirmation and logging in, the user is directed to the flashcard generation view.
  - Only authenticated users can view, edit, or delete their own flashcards.
  - Users cannot access or share other users' flashcards.
  - Users not authenticated cannot enter pages other than login/registration pages
  - **UPDATED**: Landing page `/` displays product overview with features, visual examples, and CTAs for unauthenticated users. Authenticated users are redirected from `/` to `/generate`.

- **ID: US-002**  
  **Title:** Password Reset  
  **Description:** A user who forgot their password requests a one-time reset link and sets a new password.  
  **Acceptance Criteria:**
  - User enters their email and receives a reset link.
  - The link allows them to set a new password.
  - After resetting, the user can log in with the new password.

- **ID: US-003**  
  **Title:** Manual Flashcard Creation  
  **Description:** An authenticated user creates a new flashcard by providing a front (≤200 characters) and back (≤500 characters).  
  **Acceptance Criteria:**
  - Form validates front/back length.
  - New flashcard is saved in the database with `source = manual`.
  - User sees it in their “My Flashcards” list.

- **ID: US-004**  
  **Title:** AI-Generated Flashcards  
  **Description:** An authenticated user pastes text into a field, clicks “Generate,” and receives several AI-generated flashcard suggestions.  
  **Acceptance Criteria:**
  - Text field accepts 1,000–10,000 characters.
  - Text is sent to the LLM API.
  - Multiple front/back suggestions appear.
  - User can accept, edit, or reject each suggestion.

- **ID: US-005**  
  **Title:** Bulk Review of Candidates  
  **Description:** An authenticated user sees a list of AI-generated flashcards and can select multiple items to perform bulk accept/edit/reject actions.  
  **Acceptance Criteria:**
  - List shows front, back, and generation timestamp.
  - User can select multiple items and apply bulk operations.
  - Accepted cards go to the CRUD database, rejected ones are deleted, and edited ones return to the review list.

- **ID: US-006**  
  **Title:** Browsing & Searching Flashcards  
  **Description:** An authenticated user browses saved flashcards and filters by front/back text.  
  **Acceptance Criteria:**
  - User enters a text fragment and sees only matching flashcards.

- **ID: US-007**  
  **Title:** Editing & Deleting Flashcards  
  **Description:** An authenticated user edits the front/back of an existing flashcard or deletes it.  
  **Acceptance Criteria:**
  - Editing updates front/back and the `updated_at` timestamp.
  - Deletion removes the entry from the database and logs the action.

- **ID: US-008**  
  **Title:** Secure Access  
  **Description:** Only authenticated users can access the UI and API.  
  **Acceptance Criteria:**
  - All endpoints require a valid session token.
  - Unauthorized requests return HTTP 401.

- **ID: US-009**  
  **Title:** Display & Layout  
  **Description:** AI-generated and manual flashcards display below the generation form. Accepted cards appear in the “My Flashcards” view.

- **ID: US-010**  
  **Title:** Study Session View  
  **Description:** As an authenticated user, I want my added flashcards available in a “Study Session” view that uses an external algorithm so I can effectively learn via spaced repetition.  
  **Acceptance Criteria:**
  - “Study Session” view prepares cards for me according to the algorithm.
  - Initially shows the front of a card; user reveals the back on interaction.
  - User rates recall quality per the algorithm’s requirements.
  - Next card is displayed according to the session flow.

## 6. Success Metrics

- 75% of AI-generated flashcards are accepted by users (tracked in logs).
- 75% of all created flashcards originate from AI generation.
- Analysis and logging of count of generations vs. acceptances vs. manual creations.

## 7. Technical Constraints & Architecture

- **Hosting:** The application frontend and server-side logic (Astro SSR/Edge) must be hosted on **Cloudflare Pages**.
- **Backend:** Supabase is used for Authentication, Database, and real-time events.
- **AI Service:** OpenRouter.ai is used for LLM interactions.
- **Edge Compatibility:** All server-side code must be compatible with Cloudflare Workers runtime (Edge) limitations.
