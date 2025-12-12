# Authentication Architecture Diagram - 10xCards

This diagram visualizes the complete authentication system architecture for 10xCards, including user flows, components, services, and database interactions.

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Browser]

        subgraph "Public Pages"
            Login["/auth/login<br/>LoginForm"]
            Register["/auth/register<br/>RegisterForm"]
            ForgotPwd["/auth/forgot-password<br/>ForgotPasswordForm"]
            ResetPwd["/auth/reset-password<br/>ResetPasswordForm"]
            VerifyEmail["/auth/verify-email"]
        end

        subgraph "Protected Pages"
            Landing["/index.astro<br/>(Smart Router)"]
            Generate["/generate<br/>GenerateReview"]
            Flashcards["/flashcards<br/>MyFlashcards"]
            Study["/study<br/>(Optional/Future)"]
        end

        subgraph "Layout Components"
            Header["Header<br/>(User Menu & Logout)"]
        end
    end

    subgraph "Middleware Layer"
        Middleware["middleware/index.ts<br/>- Create request-scoped Supabase client<br/>- Retrieve session from cookies<br/>- Inject session & user to context.locals"]
    end

    subgraph "API Layer"
        subgraph "Auth Endpoints (Public)"
            RegAPI["/api/auth/register<br/>POST"]
            LoginAPI["/api/auth/login<br/>POST"]
            LogoutAPI["/api/auth/logout<br/>POST"]
            ForgotAPI["/api/auth/forgot-password<br/>POST"]
            ResetAPI["/api/auth/reset-password<br/>POST"]
        end

        subgraph "Protected Endpoints"
            FlashcardsAPI["/api/flashcards<br/>GET, POST, DELETE"]
            FlashcardAPI["/api/flashcards/[id]<br/>GET, PUT, DELETE"]
            AISessionsAPI["/api/ai-sessions<br/>POST, GET"]
            CandidatesAPI["/api/ai-sessions/[id]/candidates<br/>GET"]
            ActionsAPI["/api/ai-sessions/[id]/candidates/actions<br/>POST"]
        end
    end

    subgraph "Service Layer"
        AuthService["auth.service.ts<br/>- register()<br/>- login()<br/>- logout()<br/>- requestPasswordReset()<br/>- resetPassword()<br/>- getSession()<br/>- refreshSession()"]

        FlashcardService["flashcards.service.ts<br/>(Existing)"]
        AIService["ai.service.ts<br/>(Existing)"]
        EventLogService["event-log.service.ts<br/>(Existing)"]

        AuthSchemas["auth.schemas.ts<br/>Zod Validation<br/>- registerSchema<br/>- loginSchema<br/>- forgotPasswordSchema<br/>- resetPasswordSchema"]
    end

    subgraph "External Services"
        SupabaseAuth["Supabase Auth<br/>- User Management<br/>- Email Sending<br/>- Token Generation<br/>- Session Management"]
        OpenRouter["OpenRouter API<br/>(AI Generation)"]
    end

    subgraph "Database Layer (Supabase)"
        AuthUsers["auth.users<br/>(Managed by Supabase)"]

        subgraph "Application Tables (RLS Enabled)"
            FlashcardsTable["flashcards<br/>RLS: user_id = auth.uid()"]
            AISessionsTable["ai_generation_sessions<br/>RLS: user_id = auth.uid()"]
            EventLogsTable["event_logs<br/>RLS: user_id = auth.uid()"]
        end
    end

    %% User Flow Connections
    Browser --> Login
    Browser --> Register
    Browser --> ForgotPwd
    Browser --> ResetPwd
    Browser --> Landing
    Browser --> Generate
    Browser --> Flashcards

    %% Middleware Connections
    Browser -.HTTP Request.-> Middleware
    Middleware -.Session Check.-> SupabaseAuth
    Middleware --> Landing
    Middleware --> Generate
    Middleware --> Flashcards

    %% Auth API Connections
    Login --> LoginAPI
    Register --> RegAPI
    ForgotPwd --> ForgotAPI
    ResetPwd --> ResetAPI
    Header --> LogoutAPI

    %% Protected API Connections
    Generate --> AISessionsAPI
    Generate --> CandidatesAPI
    Generate --> ActionsAPI
    Flashcards --> FlashcardsAPI
    Flashcards --> FlashcardAPI

    %% Service Layer Connections
    RegAPI --> AuthSchemas
    LoginAPI --> AuthSchemas
    ForgotAPI --> AuthSchemas
    ResetAPI --> AuthSchemas

    RegAPI --> AuthService
    LoginAPI --> AuthService
    LogoutAPI --> AuthService
    ForgotAPI --> AuthService
    ResetAPI --> AuthService

    FlashcardsAPI --> FlashcardService
    FlashcardAPI --> FlashcardService
    AISessionsAPI --> AIService
    CandidatesAPI --> AIService
    ActionsAPI --> AIService

    RegAPI --> EventLogService
    LoginAPI --> EventLogService
    LogoutAPI --> EventLogService

    %% External Service Connections
    AuthService --> SupabaseAuth
    AIService --> OpenRouter

    %% Database Connections
    SupabaseAuth --> AuthUsers
    FlashcardService --> FlashcardsTable
    AIService --> AISessionsTable
    EventLogService --> EventLogsTable

    %% Styling
    classDef publicPage fill:#e1f5ff,stroke:#0288d1,stroke-width:2px
    classDef protectedPage fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef authAPI fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef protectedAPI fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef service fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef external fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    classDef database fill:#e0f2f1,stroke:#00796b,stroke-width:2px

    class Login,Register,ForgotPwd,ResetPwd,VerifyEmail publicPage
    class Landing,Generate,Flashcards,Study protectedPage
    class RegAPI,LoginAPI,LogoutAPI,ForgotAPI,ResetAPI authAPI
    class FlashcardsAPI,FlashcardAPI,AISessionsAPI,CandidatesAPI,ActionsAPI protectedAPI
    class AuthService,FlashcardService,AIService,EventLogService,AuthSchemas service
    class SupabaseAuth,OpenRouter external
    class AuthUsers,FlashcardsTable,AISessionsTable,EventLogsTable database
```

## User Registration Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant RegisterPage as /auth/register
    participant RegisterAPI as POST /api/auth/register
    participant AuthService as auth.service.ts
    participant Supabase as Supabase Auth
    participant EventLog as event-log.service.ts
    participant Email as Email Service
    participant VerifyPage as /auth/verify-email
    participant LoginPage as /auth/login

    User->>Browser: Navigate to app
    Browser->>RegisterPage: Load registration page
    RegisterPage-->>Browser: Show RegisterForm

    User->>Browser: Enter email & password
    User->>Browser: Submit form

    Browser->>Browser: Client-side validation (Zod)

    Browser->>RegisterAPI: POST {email, password}
    RegisterAPI->>RegisterAPI: Validate with Zod schema
    RegisterAPI->>AuthService: register(email, password)
    AuthService->>Supabase: signUp({email, password})

    alt Registration Successful
        Supabase-->>AuthService: {user: {id, email, created_at}}
        Supabase->>Email: Send confirmation email
        AuthService-->>RegisterAPI: User data
        RegisterAPI->>EventLog: Log "user_registered" event
        RegisterAPI-->>Browser: 201 Created {id, email, created_at}
        Browser-->>User: Show success message<br/>"Check your email to confirm"

        User->>Email: Click confirmation link
        Email->>Supabase: Verify email token
        Supabase->>VerifyPage: Redirect with success
        VerifyPage-->>User: Show "Email confirmed" message

        User->>LoginPage: Click "Go to Login"
        LoginPage-->>User: Show login form
    else Email Already Exists
        Supabase-->>AuthService: Error: already registered
        AuthService-->>RegisterAPI: Throw error
        RegisterAPI-->>Browser: 409 Conflict
        Browser-->>User: Show error message
    else Validation Error
        RegisterAPI-->>Browser: 400 Bad Request
        Browser-->>User: Show validation errors
    end
```

## User Login Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant LoginPage as /auth/login
    participant LoginAPI as POST /api/auth/login
    participant AuthService as auth.service.ts
    participant Supabase as Supabase Auth
    participant EventLog as event-log.service.ts
    participant Middleware as middleware/index.ts
    participant GeneratePage as /generate

    User->>Browser: Navigate to /auth/login
    Browser->>LoginPage: Load login page
    LoginPage-->>Browser: Show LoginForm

    User->>Browser: Enter email & password
    User->>Browser: Submit form

    Browser->>Browser: Client-side validation
    Browser->>LoginAPI: POST {email, password}

    LoginAPI->>LoginAPI: Validate with Zod schema
    LoginAPI->>AuthService: login(email, password)
    AuthService->>Supabase: signInWithPassword({email, password})

    alt Login Successful
        Supabase-->>Supabase: Set session cookies<br/>(sb-<project>-auth-token)
        Supabase-->>AuthService: {session: {access_token, expires_in}}
        AuthService-->>LoginAPI: Session data
        LoginAPI->>EventLog: Log "user_logged_in" event
        LoginAPI-->>Browser: 200 OK {access_token, expires_in}
        Browser->>Browser: Redirect to /generate

        Browser->>Middleware: Request /generate
        Middleware->>Supabase: getSession() from cookies
        Supabase-->>Middleware: {session, user}
        Middleware->>Middleware: Set context.locals.session & user
        Middleware->>GeneratePage: Continue with session
        GeneratePage-->>Browser: Render protected page
        Browser-->>User: Show Generate & Review page
    else Invalid Credentials
        Supabase-->>AuthService: Error: Invalid credentials
        AuthService-->>LoginAPI: Throw error
        LoginAPI->>EventLog: Log "login_failed" event
        LoginAPI-->>Browser: 401 Unauthorized
        Browser-->>User: Show error message
    else Email Not Confirmed
        Supabase-->>AuthService: Error: Email not confirmed
        AuthService-->>LoginAPI: Throw error
        LoginAPI-->>Browser: 403 Forbidden
        Browser-->>User: Show "Please confirm your email" message
    end
```

## Password Reset Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant ForgotPage as /auth/forgot-password
    participant ForgotAPI as POST /api/auth/forgot-password
    participant AuthService as auth.service.ts
    participant Supabase as Supabase Auth
    participant Email as Email Service
    participant ResetPage as /auth/reset-password
    participant ResetAPI as POST /api/auth/reset-password
    participant LoginPage as /auth/login

    User->>Browser: Click "Forgot Password?"
    Browser->>ForgotPage: Load forgot password page
    ForgotPage-->>Browser: Show ForgotPasswordForm

    User->>Browser: Enter email address
    User->>Browser: Submit form

    Browser->>ForgotAPI: POST {email}
    ForgotAPI->>ForgotAPI: Validate with Zod schema
    ForgotAPI->>AuthService: requestPasswordReset(email, redirectUrl)
    AuthService->>Supabase: resetPasswordForEmail(email)

    Supabase->>Email: Send password reset email<br/>(if email exists)
    Supabase-->>AuthService: Success (always)
    AuthService-->>ForgotAPI: void
    ForgotAPI-->>Browser: 200 OK<br/>"Check your email for reset instructions"
    Browser-->>User: Show success message<br/>(even if email doesn't exist)

    User->>Email: Click reset link
    Email->>ResetPage: Redirect with token in URL hash<br/>#access_token=...
    ResetPage->>ResetPage: Extract token from URL
    ResetPage-->>Browser: Show ResetPasswordForm with token

    User->>Browser: Enter new password & confirm
    User->>Browser: Submit form

    Browser->>Browser: Client-side validation<br/>(password strength, match)
    Browser->>ResetAPI: POST {token, new_password}

    ResetAPI->>ResetAPI: Validate with Zod schema
    ResetAPI->>AuthService: resetPassword(token, newPassword)
    AuthService->>Supabase: getSession() to verify token

    alt Token Valid
        Supabase-->>AuthService: {session}
        AuthService->>Supabase: updateUser({password: newPassword})
        Supabase-->>AuthService: Success
        AuthService-->>ResetAPI: void
        ResetAPI-->>Browser: 200 OK "Password reset successfully"
        Browser-->>User: Show success message
        Browser->>Browser: Auto-redirect after 3 seconds
        Browser->>LoginPage: Redirect to login
        LoginPage-->>User: Show login form
    else Token Invalid/Expired
        Supabase-->>AuthService: Error: Invalid session
        AuthService-->>ResetAPI: Throw error
        ResetAPI-->>Browser: 401 Unauthorized<br/>"Reset link is invalid or expired"
        Browser-->>User: Show error message
    end
```

## Protected Route Access Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Middleware as middleware/index.ts
    participant Supabase as Supabase Auth
    participant ProtectedPage as /generate or /flashcards
    participant LoginPage as /auth/login

    User->>Browser: Navigate to /generate
    Browser->>Middleware: HTTP Request

    Middleware->>Middleware: Create request-scoped<br/>Supabase client with cookies
    Middleware->>Supabase: auth.getSession()

    alt User Authenticated
        Supabase-->>Middleware: {session: {...}, user: {...}}
        Middleware->>Middleware: Set context.locals.session<br/>Set context.locals.user
        Middleware->>ProtectedPage: Continue to page

        ProtectedPage->>ProtectedPage: Check Astro.locals.session
        ProtectedPage->>ProtectedPage: Extract user data
        ProtectedPage-->>Browser: Render page with user context
        Browser-->>User: Show protected content
    else User Not Authenticated
        Supabase-->>Middleware: {session: null, user: null}
        Middleware->>Middleware: Set context.locals.session = null<br/>Set context.locals.user = null
        Middleware->>ProtectedPage: Continue to page

        ProtectedPage->>ProtectedPage: Check Astro.locals.session
        ProtectedPage->>ProtectedPage: Session is null
        ProtectedPage->>Browser: Redirect to /auth/login?redirect=/generate
        Browser->>LoginPage: Load login page
        LoginPage-->>User: Show login form with redirect param

        Note over User,LoginPage: After successful login,<br/>user redirected to /generate
    end
```

## Landing Page Smart Router Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Middleware as middleware/index.ts
    participant Landing as / (index.astro)
    participant LoginPage as /auth/login
    participant GeneratePage as /generate
    participant Supabase as Supabase Auth

    User->>Browser: Navigate to /
    Browser->>Middleware: HTTP Request

    Middleware->>Supabase: auth.getSession()

    alt User Authenticated
        Supabase-->>Middleware: {session: {...}}
        Middleware->>Middleware: Set context.locals.session
        Middleware->>Landing: Continue to landing page
        Landing->>Landing: Check Astro.locals.session
        Landing->>Landing: Session exists
        Landing->>Browser: Redirect to /generate
        Browser->>GeneratePage: Load generate page
        GeneratePage-->>User: Show Generate & Review
    else User Not Authenticated
        Supabase-->>Middleware: {session: null}
        Middleware->>Middleware: Set context.locals.session = null
        Middleware->>Landing: Continue to landing page
        Landing->>Landing: Check Astro.locals.session
        Landing->>Landing: Session is null
        Landing->>Browser: Redirect to /auth/login
        Browser->>LoginPage: Load login page
        LoginPage-->>User: Show login form
    end

    Note over Landing: Landing page NEVER renders content<br/>It only acts as a smart router
```

## Logout Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Header as Header Component
    participant LogoutAPI as POST /api/auth/logout
    participant AuthService as auth.service.ts
    participant Supabase as Supabase Auth
    participant EventLog as event-log.service.ts
    participant Landing as / (Smart Router)
    participant LoginPage as /auth/login

    User->>Browser: Click "Logout" in header menu
    Browser->>Header: Handle logout click
    Header->>LogoutAPI: POST /api/auth/logout

    LogoutAPI->>LogoutAPI: Get session from context.locals
    LogoutAPI->>AuthService: logout(supabase)
    AuthService->>Supabase: auth.signOut()

    Supabase-->>Supabase: Invalidate session
    Supabase-->>Supabase: Clear session cookies
    Supabase-->>AuthService: Success

    AuthService-->>LogoutAPI: void
    LogoutAPI->>EventLog: Log "user_logged_out" event
    LogoutAPI-->>Browser: 200 OK {message: "Logged out successfully"}

    Browser->>Browser: Redirect to /
    Browser->>Landing: Request landing page
    Landing->>Landing: Check session (now null)
    Landing->>Browser: Redirect to /auth/login
    Browser->>LoginPage: Load login page
    LoginPage-->>User: Show login form
```

## API Endpoint Authentication Pattern

```mermaid
sequenceDiagram
    participant Client as React Component
    participant API as Protected API Endpoint
    participant Middleware as middleware/index.ts
    participant Service as Service Layer
    participant Database as Supabase Database (RLS)

    Client->>API: HTTP Request (with session cookie)
    Note over API: Session already in context.locals<br/>(set by middleware)

    API->>API: Check locals.session

    alt Session Exists
        API->>API: Extract userId from session.user.id
        API->>API: Validate request body (Zod)
        API->>Service: Call service method(userId, data)
        Service->>Database: Query with userId

        Note over Database: RLS Policy enforces<br/>WHERE user_id = auth.uid()

        Database-->>Service: Filtered results (only user's data)
        Service-->>API: Return data
        API-->>Client: 200 OK with data
    else Session Null
        API-->>Client: 401 Unauthorized<br/>"Authentication required"
    end

    Note over API,Database: Additional authorization check<br/>for resource ownership (if needed)

    alt Resource Ownership Check
        API->>Service: getResource(resourceId)
        Service->>Database: Query resource
        Database-->>Service: Resource data
        Service-->>API: Resource
        API->>API: Check resource.user_id === userId

        alt User Owns Resource
            API->>Service: Proceed with operation
        else User Does Not Own Resource
            API-->>Client: 403 Forbidden<br/>"Permission denied"
        end
    end
```

## Database Row-Level Security (RLS) Architecture

```mermaid
graph TB
    subgraph "Supabase Database"
        subgraph "auth schema (Managed by Supabase)"
            AuthUsers["auth.users<br/>- id (UUID)<br/>- email<br/>- encrypted_password<br/>- email_confirmed_at<br/>- created_at<br/>- last_sign_in_at"]
        end

        subgraph "public schema (Application Tables)"
            Flashcards["flashcards<br/>RLS ENABLED<br/>- id (UUID)<br/>- user_id (FK → auth.users.id)<br/>- front<br/>- back<br/>- source<br/>- created_at"]

            AISessions["ai_generation_sessions<br/>RLS ENABLED<br/>- id (UUID)<br/>- user_id (FK → auth.users.id)<br/>- input_text<br/>- model<br/>- status<br/>- created_at"]

            EventLogs["event_logs<br/>RLS ENABLED<br/>- id (UUID)<br/>- user_id (FK → auth.users.id)<br/>- event_type<br/>- event_source<br/>- created_at"]
        end

        subgraph "RLS Policies"
            FlashcardsRLS["flashcards policies:<br/>SELECT: auth.uid() = user_id<br/>INSERT: auth.uid() = user_id<br/>UPDATE: auth.uid() = user_id<br/>DELETE: auth.uid() = user_id"]

            AISessionsRLS["ai_generation_sessions policies:<br/>SELECT: auth.uid() = user_id<br/>INSERT: auth.uid() = user_id<br/>UPDATE: auth.uid() = user_id"]

            EventLogsRLS["event_logs policies:<br/>SELECT: auth.uid() = user_id<br/>INSERT: auth.uid() = user_id"]
        end
    end

    AuthUsers -.FK Reference.-> Flashcards
    AuthUsers -.FK Reference.-> AISessions
    AuthUsers -.FK Reference.-> EventLogs

    FlashcardsRLS -.Enforces.-> Flashcards
    AISessionsRLS -.Enforces.-> AISessions
    EventLogsRLS -.Enforces.-> EventLogs

    classDef authTable fill:#e1f5ff,stroke:#0288d1,stroke-width:2px
    classDef appTable fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef rlsPolicy fill:#fff3e0,stroke:#f57c00,stroke-width:2px

    class AuthUsers authTable
    class Flashcards,AISessions,EventLogs appTable
    class FlashcardsRLS,AISessionsRLS,EventLogsRLS rlsPolicy
```

## Session Management & Cookie Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Middleware as middleware/index.ts
    participant SupabaseClient as Supabase Client (SSR)
    participant SupabaseAuth as Supabase Auth Service
    participant Cookies as HTTP Cookies

    Note over Browser,Cookies: Login - Session Creation

    Browser->>SupabaseAuth: signInWithPassword(email, password)
    SupabaseAuth->>SupabaseAuth: Validate credentials
    SupabaseAuth->>SupabaseAuth: Generate JWT access token<br/>Generate refresh token
    SupabaseAuth-->>Browser: Set cookies:<br/>sb-<project>-auth-token (access)<br/>sb-<project>-auth-token-refresh
    SupabaseAuth-->>Browser: Return {session, user}

    Note over Browser,Cookies: Subsequent Requests - Session Validation

    Browser->>Middleware: HTTP Request (cookies included)
    Middleware->>Middleware: Create request-scoped client<br/>with cookie adapter
    Middleware->>SupabaseClient: auth.getSession()
    SupabaseClient->>Cookies: Read session cookies
    Cookies-->>SupabaseClient: sb-<project>-auth-token
    SupabaseClient->>SupabaseClient: Verify JWT signature
    SupabaseClient->>SupabaseClient: Check expiration

    alt Token Valid
        SupabaseClient-->>Middleware: {session, user}
        Middleware->>Middleware: Set context.locals.session<br/>Set context.locals.user
    else Token Expired (but refresh token valid)
        SupabaseClient->>SupabaseAuth: Refresh session using refresh token
        SupabaseAuth->>SupabaseAuth: Validate refresh token
        SupabaseAuth->>SupabaseAuth: Generate new access token<br/>Rotate refresh token
        SupabaseAuth-->>Cookies: Update cookies with new tokens
        SupabaseAuth-->>SupabaseClient: {new session, user}
        SupabaseClient-->>Middleware: {session, user}
        Middleware->>Middleware: Set context.locals.session<br/>Set context.locals.user
    else Both Tokens Invalid/Expired
        SupabaseClient-->>Middleware: {session: null, user: null}
        Middleware->>Middleware: Set context.locals.session = null<br/>Set context.locals.user = null
    end

    Note over Browser,Cookies: Logout - Session Destruction

    Browser->>SupabaseAuth: signOut()
    SupabaseAuth->>SupabaseAuth: Invalidate session in database
    SupabaseAuth-->>Cookies: Clear all session cookies
    SupabaseAuth-->>Browser: Success
```

## Component & Service Dependencies

```mermaid
graph LR
    subgraph "React Components"
        LoginForm[LoginForm.tsx]
        RegisterForm[RegisterForm.tsx]
        ForgotPasswordForm[ForgotPasswordForm.tsx]
        ResetPasswordForm[ResetPasswordForm.tsx]
        PasswordStrength[PasswordStrengthIndicator.tsx]
        Header[Header.tsx]
        CreateFlashcardModal[CreateFlashcardModal.tsx]
    end

    subgraph "Astro Pages"
        LoginPage[/auth/login.astro]
        RegisterPage[/auth/register.astro]
        ForgotPage[/auth/forgot-password.astro]
        ResetPage[/auth/reset-password.astro]
        VerifyPage[/auth/verify-email.astro]
        IndexPage[/index.astro]
        GeneratePage[/generate/index.astro]
        FlashcardsPage[/flashcards/index.astro]
    end

    subgraph "API Endpoints"
        RegisterAPI[/api/auth/register.ts]
        LoginAPI[/api/auth/login.ts]
        LogoutAPI[/api/auth/logout.ts]
        ForgotAPI[/api/auth/forgot-password.ts]
        ResetAPI[/api/auth/reset-password.ts]
    end

    subgraph "Services"
        AuthService[auth.service.ts]
        AuthSchemas[auth.schemas.ts]
        EventLogService[event-log.service.ts]
    end

    subgraph "Shared UI"
        Button[ui/button.tsx]
        Input[ui/input.tsx]
        Alert[ui/alert-dialog.tsx]
        Dialog[ui/dialog.tsx]
    end

    %% Component Dependencies
    LoginPage --> LoginForm
    RegisterPage --> RegisterForm
    ForgotPage --> ForgotPasswordForm
    ResetPage --> ResetPasswordForm

    RegisterForm --> PasswordStrength
    ResetPasswordForm --> PasswordStrength

    LoginForm --> Button
    LoginForm --> Input
    LoginForm --> Alert
    RegisterForm --> Button
    RegisterForm --> Input
    RegisterForm --> Alert
    ForgotPasswordForm --> Button
    ForgotPasswordForm --> Input
    ResetPasswordForm --> Button
    ResetPasswordForm --> Input
    Header --> Dialog
    CreateFlashcardModal --> Dialog

    %% API Dependencies
    LoginForm -.POST.-> LoginAPI
    RegisterForm -.POST.-> RegisterAPI
    ForgotPasswordForm -.POST.-> ForgotAPI
    ResetPasswordForm -.POST.-> ResetAPI
    Header -.POST.-> LogoutAPI

    RegisterAPI --> AuthSchemas
    LoginAPI --> AuthSchemas
    ForgotAPI --> AuthSchemas
    ResetAPI --> AuthSchemas

    RegisterAPI --> AuthService
    LoginAPI --> AuthService
    LogoutAPI --> AuthService
    ForgotAPI --> AuthService
    ResetAPI --> AuthService

    RegisterAPI --> EventLogService
    LoginAPI --> EventLogService
    LogoutAPI --> EventLogService

    %% Styling
    classDef component fill:#e1f5ff,stroke:#0288d1,stroke-width:2px
    classDef page fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef api fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef service fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef ui fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class LoginForm,RegisterForm,ForgotPasswordForm,ResetPasswordForm,PasswordStrength,Header,CreateFlashcardModal component
    class LoginPage,RegisterPage,ForgotPage,ResetPage,VerifyPage,IndexPage,GeneratePage,FlashcardsPage page
    class RegisterAPI,LoginAPI,LogoutAPI,ForgotAPI,ResetAPI api
    class AuthService,AuthSchemas,EventLogService service
    class Button,Input,Alert,Dialog ui
```

## Implementation Status

| Component                    | Status                        | File Path                                            |
| ---------------------------- | ----------------------------- | ---------------------------------------------------- |
| **Backend**                  |                               |                                                      |
| Auth Service                 | ❌ Not Implemented            | `/src/lib/services/auth.service.ts`                  |
| Auth Schemas                 | ❌ Not Implemented            | `/src/lib/schemas/auth.schemas.ts`                   |
| Middleware (SSR)             | ⚠️ Partial (needs SSR client) | `/src/middleware/index.ts`                           |
| Register API                 | ❌ Not Implemented            | `/src/pages/api/auth/register.ts`                    |
| Login API                    | ❌ Not Implemented            | `/src/pages/api/auth/login.ts`                       |
| Logout API                   | ❌ Not Implemented            | `/src/pages/api/auth/logout.ts`                      |
| Forgot Password API          | ❌ Not Implemented            | `/src/pages/api/auth/forgot-password.ts`             |
| Reset Password API           | ❌ Not Implemented            | `/src/pages/api/auth/reset-password.ts`              |
| **Frontend**                 |                               |                                                      |
| LoginForm                    | ❌ Not Implemented            | `/src/components/auth/LoginForm.tsx`                 |
| RegisterForm                 | ❌ Not Implemented            | `/src/components/auth/RegisterForm.tsx`              |
| ForgotPasswordForm           | ❌ Not Implemented            | `/src/components/auth/ForgotPasswordForm.tsx`        |
| ResetPasswordForm            | ❌ Not Implemented            | `/src/components/auth/ResetPasswordForm.tsx`         |
| PasswordStrengthIndicator    | ❌ Not Implemented            | `/src/components/auth/PasswordStrengthIndicator.tsx` |
| Header Component             | ❌ Not Implemented            | `/src/components/layout/Header.tsx`                  |
| Login Page                   | ❌ Not Implemented            | `/src/pages/auth/login.astro`                        |
| Register Page                | ❌ Not Implemented            | `/src/pages/auth/register.astro`                     |
| Forgot Password Page         | ❌ Not Implemented            | `/src/pages/auth/forgot-password.astro`              |
| Reset Password Page          | ❌ Not Implemented            | `/src/pages/auth/reset-password.astro`               |
| Verify Email Page            | ❌ Not Implemented            | `/src/pages/auth/verify-email.astro`                 |
| Landing Page (Smart Router)  | ⚠️ Needs Update               | `/src/pages/index.astro`                             |
| Generate Page (Auth Guard)   | ⚠️ Needs Update               | `/src/pages/generate/index.astro`                    |
| Flashcards Page (Auth Guard) | ⚠️ Needs Update               | `/src/pages/flashcards/index.astro`                  |
| **Database**                 |                               |                                                      |
| Supabase Auth Config         | ❌ Not Configured             | Supabase Dashboard                                   |
| RLS Policies                 | ❌ Not Implemented            | Database Migration                                   |
| Email Templates              | ❌ Not Configured             | Supabase Dashboard                                   |

## Key Design Decisions

### 1. **Smart Router Pattern for Landing Page**

- Landing page (`/`) acts purely as a router
- No content is rendered
- Redirects based on authentication state:
  - Authenticated → `/generate`
  - Unauthenticated → `/auth/login`

### 2. **Request-Scoped Supabase Client**

- Uses `@supabase/ssr` package
- Creates client per request with cookie adapter
- Enables proper SSR session handling
- Automatically manages session cookies

### 3. **Cookie-Based Session Management**

- Supabase manages cookies automatically
- HttpOnly cookies prevent XSS attacks
- Secure flag in production
- SameSite=Lax for CSRF protection
- Automatic token refresh

### 4. **Row-Level Security (RLS)**

- Defense in depth security
- Database-level access control
- Automatic filtering by `user_id`
- Protects against SQL injection

### 5. **Middleware-Based Authentication**

- Session retrieved once per request
- Injected into `context.locals`
- Available in all pages and API endpoints
- Consistent authentication state

### 6. **Zod Validation**

- Shared schemas between client and server
- Type-safe validation
- Detailed error messages
- Consistent with existing codebase

### 7. **Event Logging**

- All authentication events logged
- Supports analytics and auditing
- No sensitive data logged

### 8. **Manual Flashcard Creation**

- Modal dialog on `/flashcards` page
- Triggered by "Create Flashcard" button
- Same validation as AI-generated cards
- Source marked as "manual"

## Security Features

1. **Password Security**
   - Minimum 8 characters
   - Complexity requirements (uppercase, lowercase, number, special)
   - Hashed by Supabase (bcrypt)
   - Never logged or exposed

2. **Token Security**
   - Short-lived access tokens (1 hour)
   - Long-lived refresh tokens (30 days)
   - Automatic token rotation
   - Single-use reset tokens

3. **Email Security**
   - Email confirmation required
   - Anti-enumeration protection
   - SPF/DKIM/DMARC configured

4. **Transport Security**
   - HTTPS enforced in production
   - Secure cookies
   - Security headers (CSP, HSTS, etc.)

5. **Authorization**
   - Session-based authentication
   - Resource ownership checks
   - Row-level security policies
   - No shared data between users

## Next Steps for Implementation

1. **Phase 1: Backend Foundation**
   - Create auth service and schemas
   - Update middleware with SSR client
   - Implement auth API endpoints
   - Configure Supabase Auth settings

2. **Phase 2: Frontend Components**
   - Create auth form components
   - Create auth pages
   - Update layout with Header
   - Add auth guards to protected pages

3. **Phase 3: Database & Security**
   - Enable RLS on all tables
   - Create RLS policies
   - Configure email templates
   - Test security measures

4. **Phase 4: Integration & Testing**
   - Update existing API endpoints
   - Remove DEFAULT_USER_ID
   - Test all user flows
   - Verify session management

5. **Phase 5: Deployment**
   - Configure production environment
   - Set up monitoring
   - Deploy and verify
   - Document for users
