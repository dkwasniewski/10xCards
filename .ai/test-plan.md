# Comprehensive Test Plan for 10xCards

## 1. Introduction and Testing Objectives

### 1.1 Purpose

This test plan defines the comprehensive testing strategy for 10xCards, a web application designed for AI-powered flashcard generation and management. The plan ensures that all critical functionalities, integrations, and user workflows are thoroughly validated before production deployment.

### 1.2 Testing Objectives

- **Functional Validation**: Verify that all features work according to specifications
- **Security Assurance**: Validate authentication, authorization, and data isolation mechanisms
- **Integration Reliability**: Ensure seamless integration with Supabase and OpenRouter AI
- **Performance Benchmarking**: Establish baseline performance metrics for key operations
- **User Experience**: Validate UI/UX workflows across different browsers and devices
- **Data Integrity**: Ensure correct handling of CRUD operations and database constraints
- **Error Handling**: Verify graceful degradation and appropriate error messages

### 1.3 Quality Goals

- **Code Coverage**: Minimum 80% for critical business logic
- **API Reliability**: 99.9% success rate for authenticated requests
- **Response Time**: < 500ms for CRUD operations, < 3s for AI generation
- **Zero Critical Security Vulnerabilities**: No RLS bypass, no authentication flaws
- **Cross-browser Compatibility**: Support for Chrome, Firefox, Safari, Edge (latest versions)

---

## 2. Test Scope

### 2.1 In Scope

#### Authentication & Authorization

- User registration with email validation
- Login/logout functionality
- Password reset flow (forgot password → email link → reset)
- Session management and cookie handling
- Middleware-based route protection
- Row-Level Security (RLS) policy enforcement

#### AI Flashcard Generation

- Generation session creation
- Text input validation (1,000-10,000 characters)
- OpenRouter AI integration
- Multiple AI model support (GPT-4o-mini, GPT-4, Claude, etc.)
- Candidate flashcard creation and storage
- Candidate actions (accept, edit, reject)
- Duplicate content detection via input text hashing
- Generation session analytics tracking

#### Flashcard Management (CRUD)

- List flashcards with pagination (10 items per page)
- Search functionality (front/back text search)
- Sort functionality (by created_at, front)
- Create individual flashcards (manual)
- Update flashcard content (front/back)
- Delete flashcard (soft delete)
- Bulk create flashcards
- Bulk delete flashcards (up to 100)
- Field validation (front ≤ 200 chars, back ≤ 500 chars)

#### Event Logging & Analytics

- User action tracking (login, logout, flashcard creation, etc.)
- AI session event logging
- Candidate action logging
- Event source tracking (manual vs. ai)

#### Database Operations

- Supabase client initialization
- Database constraints enforcement
- RLS policy validation
- Soft delete functionality
- Timestamp management (created_at, updated_at, deleted_at)
- Full-text search with PostgreSQL tsvector

#### Frontend Components

- React 19 components rendering
- Form validation and error handling
- Dialog/modal interactions
- Bulk selection functionality
- Loading states and error states
- Toast notifications

### 2.2 Out of Scope (for MVP)

- Spaced repetition review sessions (future milestone)
- Custom spaced-repetition algorithms
- PDF/DOCX import functionality
- Flashcard sharing and collaboration
- Mobile native applications
- Multi-language support
- Offline functionality
- Third-party authentication (Google, GitHub OAuth)

---

## 3. Types of Tests

### 3.1 Unit Tests

**Coverage Target**: 80% for business logic

#### Focus Areas:

- **Validation Schemas** (`src/lib/schemas/`)
  - Flashcard creation/update validation
  - Authentication input validation
  - AI session validation
  - Candidate action validation
  - Query parameter validation

- **Service Layer** (`src/lib/services/`)
  - `auth.service.ts`: Registration, login, password reset logic
  - `flashcards.service.ts`: CRUD operations, search, pagination
  - `ai.service.ts`: Flashcard generation, prompt construction, response parsing
  - `ai-sessions.service.ts`: Session management, candidate handling
  - `openrouter.service.ts`: API client, retry logic, error handling
  - `event-log.service.ts`: Event creation and logging

- **Utility Functions** (`src/lib/utils/`)
  - API error handling
  - Text hashing (duplicate detection)
  - Input sanitization

- **React Components** (`src/components/`)
  - Form submission logic
  - State management
  - Conditional rendering
  - Event handlers

**Testing Framework**: Vitest (recommended for Astro/React projects)

- **Component Harness**: `@testing-library/react` (with `@testing-library/user-event`) to drive DOM interactions the way users do

### 3.2 Integration Tests

**Coverage Target**: All critical user workflows

#### Focus Areas:

- **API Endpoints** (`src/pages/api/`)
  - Authentication flow (register → verify → login → logout)
  - Password reset flow (forgot → email → reset)
  - Flashcard CRUD operations
  - AI session creation and candidate generation
  - Candidate actions (accept/edit/reject)
  - Bulk operations

- **Database Integration**
  - Supabase client operations
  - RLS policy enforcement
  - Data isolation between users
  - Soft delete functionality
  - Full-text search queries

- **Middleware**
  - Route protection
  - Session validation
  - Cookie management
  - Public vs. protected path handling

- **External Services**
  - OpenRouter AI API calls (with mocking for CI/CD)
  - Email delivery (Supabase Auth emails)

**Testing Framework**: Supertest (preferred) running inside Vitest for API route coverage; Playwright reserved for browser-dependent API flows
**Service Virtualization**: `msw` (Mock Service Worker) shared mocks for Supabase/OpenRouter to keep integration tests hermetic

### 3.3 End-to-End (E2E) Tests

**Coverage Target**: Critical user journeys

#### Test Scenarios:

1. **Complete Registration to AI Generation Flow**
   - Register new account
   - Verify email (if applicable)
   - Login
   - Navigate to generation page
   - Paste text and generate flashcards
   - Review and accept candidates
   - View flashcards in "My Flashcards"

2. **Manual Flashcard Management**
   - Login
   - Create manual flashcard
   - Edit flashcard
   - Search for flashcard
   - Delete flashcard

3. **Bulk Operations**
   - Generate multiple candidates
   - Select multiple candidates
   - Bulk accept
   - Bulk delete flashcards

4. **Password Reset Flow**
   - Click "Forgot Password"
   - Enter email
   - Receive reset link (check test inbox)
   - Reset password
   - Login with new password

**Testing Framework**: Playwright or Cypress

### 3.4 Security Tests

#### Authentication & Authorization

- Attempt to access protected routes without authentication
- Verify session expiration handling
- Test RLS policies (user A cannot access user B's data)
- SQL injection attempts on search queries
- XSS prevention in user-generated content
- CSRF token validation (if applicable)
- Password strength enforcement
- Rate limiting on authentication endpoints

#### API Security

- Test unauthorized access to API endpoints
- Verify proper error messages (no information leakage)
- Test input validation bypass attempts
- Check for exposed environment variables in client code

**Tools**: OWASP ZAP (automated scanning), GitHub Advanced Security (CodeQL, secret scanning), Dependabot alerts, manual penetration testing

### 3.5 Performance Tests

#### Load Testing

- **Scenario 1**: 100 concurrent users creating flashcards
- **Scenario 2**: 50 concurrent AI generation requests
- **Scenario 3**: 200 concurrent flashcard list requests

#### Stress Testing

- Identify breaking point for AI generation
- Database connection pool saturation
- Maximum concurrent sessions

#### Benchmarks

- AI generation: < 3000ms (average)
- Flashcard CRUD: < 500ms (p95)
- Page load time: < 2000ms (p95)
- Search queries: < 300ms (p95)

**Tools**: k6 or Apache JMeter

### 3.6 Accessibility Tests

- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Focus management in dialogs
- ARIA labels and roles

**Tools**: axe DevTools, Lighthouse, manual testing

### 3.7 Cross-Browser & Responsive Tests

#### Browsers

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

#### Devices

- Desktop (1920x1080, 1366x768)
- Tablet (iPad, 768x1024)
- Mobile (iPhone 14, 390x844)

**Tools**: BrowserStack or manual testing

### 3.8 Regression Tests

- Automated test suite run on every commit (CI/CD)
- Critical path tests run before each deployment
- Database migration testing (rollback scenarios)

---

## 4. Test Scenarios for Key Functionalities

### 4.1 Authentication

#### TC-AUTH-001: User Registration

**Preconditions**: None
**Steps**:

1. Navigate to `/register`
2. Enter valid email (e.g., `test@example.com`)
3. Enter strong password (min 8 chars, complexity requirements)
4. Click "Register"

**Expected Results**:

- User account created in Supabase Auth
- Verification email sent (if enabled)
- User redirected to `/generate` or `/verify-email`
- Event log entry: `user_registered`

**Validation Points**:

- Duplicate email returns error: "Email already registered"
- Weak password returns validation error
- Invalid email format returns validation error

---

#### TC-AUTH-002: User Login

**Preconditions**: User account exists
**Steps**:

1. Navigate to `/login`
2. Enter valid email and password
3. Click "Login"

**Expected Results**:

- Session cookie created
- User redirected to `/generate`
- Event log entry: `user_logged_in`

**Validation Points**:

- Invalid credentials return error: "Invalid email or password"
- Session persists across page refreshes
- Authenticated user cannot access `/login` (redirects to `/generate`)

---

#### TC-AUTH-003: Password Reset Flow

**Preconditions**: User account exists
**Steps**:

1. Navigate to `/forgot-password`
2. Enter registered email
3. Click "Send Reset Link"
4. Check email for reset link
5. Click link (navigate to `/reset-password?token=...`)
6. Enter new password
7. Submit form

**Expected Results**:

- Reset email sent successfully
- Token is valid and single-use
- Password updated in database
- User can login with new password
- Old password no longer works

**Validation Points**:

- Invalid token returns error
- Expired token returns error
- Weak new password returns validation error

---

#### TC-AUTH-004: Session Protection

**Preconditions**: None (no authentication)
**Steps**:

1. Attempt to access `/generate` without login
2. Attempt to access `/flashcards` without login
3. Attempt to call `GET /api/flashcards` without authentication

**Expected Results**:

- Page redirects to `/login`
- API returns 401 Unauthorized

---

### 4.2 AI Flashcard Generation

#### TC-AI-001: Generate Flashcards with Valid Input

**Preconditions**: User logged in
**Steps**:

1. Navigate to `/generate`
2. Paste text (1,500 characters, valid content)
3. Select model: "openai/gpt-4o-mini"
4. Click "Generate"

**Expected Results**:

- AI generation session created
- 5-15 candidate flashcards returned
- Candidates stored in database with `source: 'ai'`
- Input text hash calculated
- Event log entry: `generation_session_created`
- Response time: < 5 seconds

**Validation Points**:

- Each candidate has `front`, `back`, `prompt`
- Front ≤ 200 chars, Back ≤ 500 chars
- Candidates have `ai_session_id` reference

---

#### TC-AI-002: Input Validation

**Preconditions**: User logged in
**Steps**:

1. Attempt to generate with 500 characters (too short)
2. Attempt to generate with 15,000 characters (too long)
3. Attempt to generate with empty input

**Expected Results**:

- Validation error returned
- No session created
- Error message displayed

---

#### TC-AI-003: Duplicate Content Detection

**Preconditions**: User logged in, previous session exists
**Steps**:

1. Generate flashcards with text A
2. Generate flashcards again with identical text A

**Expected Results**:

- Both sessions created
- Input text hash matches
- System can detect duplicates (for future feature)

---

#### TC-AI-004: Model Selection

**Preconditions**: User logged in
**Steps**:

1. Generate with model: "openai/gpt-4"
2. Generate with model: "anthropic/claude-3-haiku"

**Expected Results**:

- Both requests succeed
- Model stored in session record
- Different models may produce different results

**Validation Points**:

- Invalid model name returns error

---

#### TC-AI-005: AI Service Error Handling

**Preconditions**: User logged in
**Steps**:

1. Mock OpenRouter API failure (503 Service Unavailable)
2. Attempt to generate flashcards

**Expected Results**:

- User-friendly error message: "AI service temporarily unavailable"
- No session created
- Error logged for monitoring

---

### 4.3 Candidate Actions

#### TC-CAND-001: Accept Candidates (Unedited)

**Preconditions**: Generation session with candidates exists
**Steps**:

1. Navigate to generation review page
2. Select 3 candidates
3. Click "Accept" (no edits)

**Expected Results**:

- Candidates moved to flashcards table
- `source` remains `ai`
- Session counters updated: `accepted_unedited_count += 3`
- Event log: `candidates_accepted_unedited:3`

---

#### TC-CAND-002: Edit and Accept Candidates

**Preconditions**: Generation session with candidates exists
**Steps**:

1. Select 1 candidate
2. Edit front: "What is TypeScript?"
3. Edit back: "A typed superset of JavaScript"
4. Click "Save and Accept"

**Expected Results**:

- Candidate updated with edited content
- `source` remains `ai`
- Session counters updated: `accepted_edited_count += 1`
- Event log: `candidates_accepted_edited:1`

---

#### TC-CAND-003: Reject Candidates

**Preconditions**: Generation session with candidates exists
**Steps**:

1. Select 2 candidates
2. Click "Reject"

**Expected Results**:

- Candidates soft-deleted (`deleted_at` set)
- Not visible in flashcards list
- Session counters unchanged
- Event log: `candidates_rejected:2`

---

#### TC-CAND-004: Mixed Actions in Bulk

**Preconditions**: Generation session with 10 candidates
**Steps**:

1. Accept 4 candidates (unedited)
2. Edit and accept 3 candidates
3. Reject 3 candidates

**Expected Results**:

- All actions processed in single request
- Session counters: `accepted_unedited_count: 4`, `accepted_edited_count: 3`
- 7 flashcards created, 3 soft-deleted
- Event logs for each action type

---

### 4.4 Flashcard Management

#### TC-FLASH-001: List Flashcards with Pagination

**Preconditions**: User has 25 flashcards
**Steps**:

1. Navigate to `/flashcards`
2. Observe initial page (page 1)
3. Click "Next" to page 2
4. Click "Previous" to page 1

**Expected Results**:

- Page 1: 10 flashcards displayed
- Page 2: 10 flashcards displayed
- Page 3: 5 flashcards displayed
- Pagination controls show correct page numbers

---

#### TC-FLASH-002: Search Flashcards

**Preconditions**: User has flashcards with keyword "TypeScript"
**Steps**:

1. Navigate to `/flashcards`
2. Enter "TypeScript" in search box
3. Submit search

**Expected Results**:

- Only flashcards containing "TypeScript" in front or back are shown
- Search is case-insensitive
- Pagination resets to page 1

---

#### TC-FLASH-003: Sort Flashcards

**Preconditions**: User has multiple flashcards
**Steps**:

1. Navigate to `/flashcards`
2. Select sort: "Created (Newest First)"
3. Select sort: "Front (A-Z)"

**Expected Results**:

- Flashcards reorder according to sort criteria
- Pagination persists

---

#### TC-FLASH-004: Create Manual Flashcard

**Preconditions**: User logged in
**Steps**:

1. Navigate to `/flashcards`
2. Click "Create Flashcard"
3. Enter front: "What is React?"
4. Enter back: "A JavaScript library for building UIs"
5. Click "Save"

**Expected Results**:

- Flashcard created with `source: 'manual'`
- `ai_session_id` is NULL
- Event log: `flashcard_created`
- Flashcard appears in list

**Validation Points**:

- Front > 200 chars returns error
- Back > 500 chars returns error
- Empty front or back returns error

---

#### TC-FLASH-005: Edit Flashcard

**Preconditions**: User has existing flashcard
**Steps**:

1. Navigate to `/flashcards`
2. Click "Edit" on a flashcard
3. Modify front text
4. Click "Save"

**Expected Results**:

- Flashcard updated in database
- `updated_at` timestamp updated
- Event log: `flashcard_updated`
- Changes reflected immediately

---

#### TC-FLASH-006: Delete Flashcard (Soft Delete)

**Preconditions**: User has existing flashcard
**Steps**:

1. Navigate to `/flashcards`
2. Click "Delete" on a flashcard
3. Confirm deletion

**Expected Results**:

- `deleted_at` timestamp set
- Flashcard removed from visible list
- Database record still exists (soft delete)
- Event log: `flashcard_deleted`

---

#### TC-FLASH-007: Bulk Delete Flashcards

**Preconditions**: User has 15 flashcards
**Steps**:

1. Select 10 flashcards
2. Click "Bulk Delete"
3. Confirm action

**Expected Results**:

- All 10 flashcards soft-deleted
- Event log: `flashcards_bulk_deleted:10`
- Pagination updates accordingly

**Validation Points**:

- Maximum 100 flashcards can be deleted at once
- Attempting to delete > 100 returns error

---

### 4.5 Row-Level Security (RLS)

#### TC-RLS-001: Data Isolation Between Users

**Preconditions**: User A and User B both have flashcards
**Steps**:

1. Login as User A
2. Call `GET /api/flashcards`
3. Login as User B
4. Call `GET /api/flashcards`

**Expected Results**:

- User A sees only their flashcards
- User B sees only their flashcards
- No data leakage between users

---

#### TC-RLS-002: Unauthorized Access Attempt

**Preconditions**: User A has flashcard with ID `abc-123`, User B is logged in
**Steps**:

1. Login as User B
2. Call `DELETE /api/flashcards/abc-123` (User A's flashcard)

**Expected Results**:

- 404 Not Found or 403 Forbidden
- Flashcard not deleted
- RLS policy blocks the operation

---

#### TC-RLS-003: AI Session Isolation

**Preconditions**: User A has AI session, User B is logged in
**Steps**:

1. Login as User B
2. Attempt to access User A's session: `GET /api/ai-sessions/{user-a-session-id}/candidates`

**Expected Results**:

- 404 Not Found
- No session data returned

---

### 4.6 Event Logging

#### TC-LOG-001: Verify Event Creation

**Preconditions**: User logged in
**Steps**:

1. Perform action: Create flashcard
2. Query event_logs table

**Expected Results**:

- Event entry exists with:
  - `user_id`: Current user
  - `event_type`: "flashcard_created"
  - `event_source`: "manual"
  - `flashcard_id`: ID of created flashcard
  - `created_at`: Current timestamp

---

#### TC-LOG-002: AI Session Events

**Preconditions**: User generates flashcards
**Steps**:

1. Generate flashcards
2. Accept 3 candidates
3. Edit 2 candidates
4. Reject 1 candidate
5. Query event_logs table

**Expected Results**:

- Events logged:
  - `generation_session_created`
  - `candidates_accepted_unedited:3`
  - `candidates_accepted_edited:2`
  - `candidates_rejected:1`
  - `candidate_actions_processed:total=6`

---

### 4.7 Error Handling

#### TC-ERR-001: Network Failure During AI Generation

**Preconditions**: User initiates generation, network interrupted
**Steps**:

1. Start flashcard generation
2. Simulate network failure

**Expected Results**:

- User sees error message: "Network error. Please try again."
- No partial session created
- User can retry

---

#### TC-ERR-002: Database Connection Failure

**Preconditions**: Supabase unavailable
**Steps**:

1. Attempt any database operation

**Expected Results**:

- User sees error: "Service temporarily unavailable"
- Error logged for monitoring
- No data corruption

---

#### TC-ERR-003: Invalid API Response Format

**Preconditions**: OpenRouter returns malformed JSON
**Steps**:

1. Mock malformed AI response
2. Attempt generation

**Expected Results**:

- User sees error: "AI service returned invalid response"
- Session created but marked as failed
- Error logged with details

---

## 5. Test Environment

### 5.1 Development Environment

- **Purpose**: Local development and debugging
- **Setup**:
  - Node.js 22.14.0 (via nvm)
  - Local Supabase instance (optional) or development project
  - OpenRouter test API key
- **Database**: Supabase development project
- **URL**: `http://localhost:3000`

### 5.2 Staging Environment

- **Purpose**: Pre-production testing and QA validation
- **Setup**:
  - DigitalOcean Droplet or App Platform
  - Supabase staging project (separate from production)
  - OpenRouter staging API key
- **Database**: Supabase staging project with production-like data
- **URL**: `https://staging.10xcards.com` (example)

### 5.3 Production Environment

- **Purpose**: Live application
- **Setup**:
  - DigitalOcean App Platform
  - Supabase production project
  - OpenRouter production API key with rate limits
- **Database**: Supabase production project
- **URL**: `https://10xcards.com` (example)

### 5.4 Test Data Management

- **Test Users**: Create dedicated test accounts for each environment
- **Seed Data**: SQL scripts to populate test flashcards
- **Data Reset**: Automated scripts to reset test data between test runs
- **Sensitive Data**: Use anonymized data; never use real user data in non-production environments

---

## 6. Testing Tools

### 6.1 Unit Testing

- **Framework**: Vitest
  - Fast, Vite-native testing framework
  - Compatible with React and TypeScript
- **Mocking**: Vitest's built-in mocking utilities
- **Component Testing Utilities**: `@testing-library/react` and `@testing-library/user-event`
- **Service Mocking**: `msw` to stub Supabase/OpenRouter calls consistently across suites
- **Coverage**: c8 (integrated with Vitest)

### 6.2 Integration Testing

- **API Testing**: Supertest (default) with Vitest runner
  - Test API endpoints with request/response validation inside Node
- **Browser-backed APIs**: Playwright for scenarios requiring authenticated browser context
- **Database Testing**: Supabase client with test database
  - Test RLS policies, constraints, and queries
- **Service Virtualization**: Reuse `msw` handlers to avoid hitting real external services

### 6.3 E2E Testing

- **Framework**: Playwright
  - Cross-browser support
  - Visual regression testing
  - Network interception for mocking
- **Alternative**: Cypress (if team prefers)

### 6.4 Security Testing

- **SAST**: ESLint with security plugins
  - `eslint-plugin-security`
  - CodeQL (via GitHub Advanced Security)
- **DAST**: OWASP ZAP
  - Automated vulnerability scanning
- **Dependency Scanning**: npm audit, Snyk
- **Automated Alerts**: Dependabot & GitHub secret scanning

### 6.5 Performance Testing

- **Load Testing**: k6
  - Scriptable load testing
  - Integrates with CI/CD
- **Monitoring**: Supabase built-in monitoring
  - Query performance
  - API response times

### 6.6 Accessibility Testing

- **Automated**: axe-core (via Playwright)
- **Manual**: Screen reader testing (NVDA, VoiceOver)
- **Audit**: Lighthouse CI

### 6.7 Visual Regression Testing

- **Tool**: Percy or Chromatic (baseline management), Playwright screenshots as fallback
  - Capture screenshots of key pages
  - Compare against versioned baselines with reviewer workflow

### 6.8 CI/CD Integration

- **Platform**: GitHub Actions
- **Workflow**:
  - Run linters (ESLint, Prettier)
  - Run unit tests (Vitest)
  - Run integration tests (Playwright)
  - Run security scans (CodeQL, npm audit)
  - Build and deploy to staging
  - Run E2E tests on staging
  - Deploy to production (manual approval)

---

## 7. Test Schedule

### 7.1 Development Phase (Ongoing)

- **Daily**: Unit tests run on every commit (via pre-commit hooks)
- **Daily**: Linting and formatting checks
- **Weekly**: Integration tests for new features
- **Bi-weekly**: Manual exploratory testing

### 7.2 Pre-Release Phase

- **Week 1**: Complete unit and integration test suite
- **Week 2**: E2E testing of critical workflows
- **Week 3**: Security testing and penetration testing
- **Week 4**: Performance testing and load testing
- **Week 5**: Accessibility audit
- **Week 6**: Cross-browser and responsive testing
- **Week 7**: UAT (User Acceptance Testing) with beta users
- **Week 8**: Bug fixes and regression testing

### 7.3 Post-Release Phase

- **Daily**: Automated regression tests in CI/CD
- **Weekly**: Production smoke tests
- **Monthly**: Security scans and dependency updates
- **Quarterly**: Comprehensive regression suite

### 7.4 Milestone-Based Testing

- **MVP Release**: Critical path E2E tests only
- **V1.0 Release**: Full test suite including performance and accessibility
- **V1.1+**: Regression tests + new feature tests

---

## 8. Test Acceptance Criteria

### 8.1 Unit Tests

- ✅ Minimum 80% code coverage for services and schemas
- ✅ All critical business logic covered
- ✅ All edge cases and error paths tested
- ✅ Tests run in < 30 seconds

### 8.2 Integration Tests

- ✅ All API endpoints have at least 3 test cases (happy path, validation error, auth error)
- ✅ All RLS policies validated
- ✅ Database constraints tested
- ✅ Tests run in < 2 minutes

### 8.3 E2E Tests

- ✅ All critical user workflows covered
- ✅ Tests pass on Chrome, Firefox, Safari
- ✅ Tests pass on desktop and mobile viewports
- ✅ Tests run in < 5 minutes

### 8.4 Security Tests

- ✅ No critical or high severity vulnerabilities
- ✅ All authentication flows validated
- ✅ RLS policies prevent unauthorized access
- ✅ Input validation prevents injection attacks

### 8.5 Performance Tests

- ✅ AI generation: < 5000ms (p95)
- ✅ CRUD operations: < 500ms (p95)
- ✅ Page load: < 2000ms (p95)
- ✅ System handles 100 concurrent users without degradation

### 8.6 Accessibility Tests

- ✅ WCAG 2.1 Level AA compliance
- ✅ No critical accessibility issues
- ✅ Keyboard navigation functional
- ✅ Screen reader compatible

### 8.7 Release Criteria

- ✅ All automated tests passing
- ✅ No open critical bugs
- ✅ Code review completed
- ✅ Security scan passed
- ✅ Performance benchmarks met
- ✅ UAT sign-off received

---

## 9. Roles and Responsibilities

### 9.1 QA Engineer (Primary Tester)

- **Responsibilities**:
  - Create and maintain test plan
  - Write automated tests (unit, integration, E2E)
  - Execute manual tests
  - Report bugs and track resolution
  - Conduct regression testing
  - Perform accessibility and security testing
  - Validate releases before deployment

### 9.2 Backend Developer

- **Responsibilities**:
  - Write unit tests for services and schemas
  - Fix backend bugs
  - Ensure API documentation is accurate
  - Support integration test setup
  - Review RLS policies for security

### 9.3 Frontend Developer

- **Responsibilities**:
  - Write unit tests for React components
  - Fix frontend bugs
  - Ensure UI matches designs
  - Support E2E test setup
  - Validate accessibility compliance

### 9.4 DevOps Engineer

- **Responsibilities**:
  - Set up CI/CD pipelines
  - Configure test environments
  - Manage test data and database migrations
  - Monitor production metrics
  - Support performance testing setup

### 9.5 Product Owner

- **Responsibilities**:
  - Define acceptance criteria
  - Prioritize test scenarios
  - Participate in UAT
  - Approve releases

### 9.6 Security Specialist (if available)

- **Responsibilities**:
  - Conduct security audits
  - Review authentication and authorization logic
  - Perform penetration testing
  - Advise on security best practices

---

## 10. Bug Reporting Procedures

### 10.1 Bug Report Template

```markdown
## Bug Report

**ID**: BUG-XXXX
**Title**: [Brief description]
**Reported By**: [Name]
**Date**: [YYYY-MM-DD]
**Environment**: [Development / Staging / Production]

### Severity

- [ ] Critical: System crash, data loss, security vulnerability
- [ ] High: Major functionality broken, no workaround
- [ ] Medium: Functionality impaired, workaround exists
- [ ] Low: Minor issue, cosmetic, low impact

### Priority

- [ ] P0: Blocks release, fix immediately
- [ ] P1: Fix before next release
- [ ] P2: Fix in upcoming sprint
- [ ] P3: Fix when time permits

### Steps to Reproduce

1. Step one
2. Step two
3. Step three

### Expected Behavior

[What should happen]

### Actual Behavior

[What actually happens]

### Screenshots/Recordings

[Attach if applicable]

### Environment Details

- Browser: [Chrome 120, Firefox 121, etc.]
- OS: [macOS 14, Windows 11, etc.]
- Screen Size: [1920x1080, 375x667, etc.]
- User Account: [test@example.com]

### Additional Context

[Any other relevant information]

### Logs

[Console errors, network errors, server logs]
```

### 10.2 Bug Lifecycle

1. **New**: Bug reported and awaiting triage
2. **Triaged**: Severity and priority assigned
3. **Assigned**: Developer assigned to fix
4. **In Progress**: Developer working on fix
5. **Fixed**: Fix implemented, awaiting testing
6. **Testing**: QA validating the fix
7. **Verified**: Fix confirmed working
8. **Closed**: Bug resolved and documented
9. **Reopened**: Bug reoccurs or fix incomplete

### 10.3 Communication Channels

- **Bug Tracking**: GitHub Issues or Jira
- **Urgent Bugs**: Slack channel `#bugs` or `#qa`
- **Daily Standup**: Discuss critical bugs
- **Weekly Triage Meeting**: Review and prioritize bugs

### 10.4 Bug Priority Guidelines

#### P0 (Critical)

- Production down
- Data loss or corruption
- Security vulnerability (RLS bypass, auth failure)
- Payment processing failure
- **SLA**: Fix within 4 hours

#### P1 (High)

- Core feature broken (AI generation, login, flashcard CRUD)
- Significant user impact
- No workaround available
- **SLA**: Fix within 24 hours

#### P2 (Medium)

- Partial functionality impaired
- Workaround exists
- Edge case affecting small user subset
- **SLA**: Fix within 1 week

#### P3 (Low)

- Cosmetic issues
- Minor UX improvement
- Low user impact
- **SLA**: Fix when capacity allows

### 10.5 Regression Testing After Bug Fixes

- **All P0/P1 Bugs**: Require regression test suite run
- **Code Changes**: Trigger automated CI/CD tests
- **Manual Verification**: QA validates fix in staging before production
- **Test Case Addition**: Add new test case to prevent recurrence

---

## 11. Appendices

### 11.1 Test Data Sets

#### Sample Flashcards

```json
[
  {
    "front": "What is TypeScript?",
    "back": "A typed superset of JavaScript that compiles to plain JavaScript",
    "source": "manual"
  },
  {
    "front": "What is Row-Level Security (RLS)?",
    "back": "A PostgreSQL feature that restricts which rows users can access based on policies",
    "source": "ai"
  }
]
```

#### Sample AI Input Text (1000-1500 chars)

```
TypeScript is a strongly typed programming language that builds on JavaScript,
giving you better tooling at any scale. TypeScript adds additional syntax to
JavaScript to support a tighter integration with your editor. Catch errors
early in your editor. TypeScript code converts to JavaScript, which runs
anywhere JavaScript runs: In a browser, on Node.js or Deno and in your apps.
TypeScript understands JavaScript and uses type inference to give you great
tooling without additional code...
[continue to 1000+ characters]
```

### 11.2 Environment Variables for Testing

```env
# Development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
OPENROUTER_API_KEY=test_api_key
NODE_ENV=development

# Staging
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_KEY=staging_anon_key
OPENROUTER_API_KEY=staging_api_key
NODE_ENV=staging

# Production
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_KEY=prod_anon_key
OPENROUTER_API_KEY=prod_api_key
NODE_ENV=production
```

### 11.3 Key Metrics to Monitor

#### Application Metrics

- API response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- AI generation success rate
- Database query performance
- User session duration

#### Business Metrics

- User registrations per day
- AI generations per user
- Flashcards created (manual vs. AI)
- Candidate accept/edit/reject ratios
- User retention rate

### 11.4 Testing Checklist Template

```markdown
## Pre-Release Testing Checklist

### Functionality

- [ ] All API endpoints tested
- [ ] All user workflows validated
- [ ] All forms and validation working
- [ ] All edge cases handled

### Security

- [ ] Authentication flows tested
- [ ] RLS policies validated
- [ ] Input sanitization verified
- [ ] Dependency vulnerabilities checked

### Performance

- [ ] Load testing completed
- [ ] Response times within SLA
- [ ] Database queries optimized
- [ ] No memory leaks detected

### Accessibility

- [ ] WCAG 2.1 Level AA compliance
- [ ] Keyboard navigation working
- [ ] Screen reader compatible
- [ ] Color contrast verified

### Cross-Browser

- [ ] Chrome tested
- [ ] Firefox tested
- [ ] Safari tested
- [ ] Edge tested

### Responsive

- [ ] Desktop (1920x1080) tested
- [ ] Tablet (768x1024) tested
- [ ] Mobile (375x667) tested

### Release

- [ ] All automated tests passing
- [ ] No critical bugs open
- [ ] Documentation updated
- [ ] Changelog prepared
- [ ] UAT sign-off received
```

---

## 12. Conclusion

This comprehensive test plan provides a structured approach to ensuring the quality, security, and performance of the 10xCards application. By following this plan, the team can:

- **Deliver a high-quality product**: Comprehensive testing coverage ensures features work as expected
- **Maintain security**: Rigorous security testing protects user data and prevents unauthorized access
- **Ensure scalability**: Performance testing validates the application can handle growth
- **Improve user experience**: Accessibility and cross-browser testing ensure usability for all users
- **Reduce technical debt**: Automated testing and regression suites prevent regressions and enable confident refactoring

The test plan should be treated as a living document, updated as the application evolves and new features are added. Regular reviews and retrospectives should be conducted to improve testing processes and efficiency.

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-29  
**Maintained By**: QA Engineering Team  
**Next Review Date**: 2025-12-29
