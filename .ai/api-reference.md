# 10xCards API Reference

## Overview

This document provides a comprehensive reference for all API endpoints in the 10xCards application.

## Authentication Endpoints

### POST /api/register
Register a new user account.

**Request Body:**
```typescript
{
  email: string;      // Valid email address
  password: string;   // Minimum 8 characters
}
```

**Response:** 201 Created
```typescript
{
  user: {
    id: string;
    email: string;
  }
}
```

**Errors:**
- 400: Email already registered or invalid input
- 500: Server error

---

### POST /api/login
Authenticate a user and create a session.

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:** 200 OK
```typescript
{
  user: {
    id: string;
    email: string;
  }
}
```

**Errors:**
- 400: Invalid credentials
- 500: Server error

---

### POST /api/logout
End the current user session.

**Response:** 200 OK
```typescript
{
  success: true
}
```

---

### GET /api/auth/session
Get the current authenticated user session.

**Response:** 200 OK
```typescript
{
  user: {
    id: string;
    email: string;
    // ... other user fields
  }
}
```

**Errors:**
- 401: Not authenticated

---

### POST /api/auth/exchange-code
Exchange a PKCE code for session (used in email verification flow).

**Request Body:**
```typescript
{
  code: string;  // PKCE code from email link
}
```

**Response:** 200 OK
- Sets session cookie
- Redirects to /generate

**Errors:**
- 400: Invalid or expired code
- 500: Server error

---

### POST /api/forgot-password
Request a password reset email.

**Request Body:**
```typescript
{
  email: string;
}
```

**Response:** 200 OK
```typescript
{
  message: "Password reset email sent"
}
```

**Note:** Always returns 200 even if email doesn't exist (security best practice)

---

### POST /api/reset-password
Reset password using a reset token.

**Request Body:**
```typescript
{
  token: string;      // Reset token from email
  password: string;   // New password (min 8 chars)
}
```

**Response:** 200 OK
```typescript
{
  message: "Password reset successful"
}
```

**Errors:**
- 400: Invalid or expired token, or invalid password
- 500: Server error

---

## Flashcard Endpoints

### GET /api/flashcards
Retrieve all flashcards for the authenticated user.

**Query Parameters:**
- `search` (optional): Filter by front/back text

**Response:** 200 OK
```typescript
FlashcardDto[] = [{
  id: string;
  front: string;
  back: string;
  source: "manual" | "ai";
  ai_session_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}]
```

**Errors:**
- 401: Not authenticated
- 500: Server error

---

### POST /api/flashcards
Create a new flashcard.

**Request Body:**
```typescript
{
  front: string;     // Max 200 characters
  back: string;      // Max 500 characters
  source: "manual" | "ai";
  ai_session_id?: string | null;
}
```

**Response:** 201 Created
```typescript
FlashcardDto
```

**Errors:**
- 400: Validation error (length limits, required fields)
- 401: Not authenticated
- 500: Server error

---

### PUT /api/flashcards/[id]
Update an existing flashcard.

**Request Body:**
```typescript
{
  front?: string;    // Max 200 characters
  back?: string;     // Max 500 characters
}
```

**Response:** 200 OK
```typescript
FlashcardDto
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 404: Flashcard not found
- 500: Server error

---

### DELETE /api/flashcards/[id]
Soft-delete a flashcard (sets deleted_at timestamp).

**Response:** 204 No Content

**Errors:**
- 401: Not authenticated
- 404: Flashcard not found
- 500: Server error

---

## AI Session Endpoints

### POST /api/ai-sessions
Create a new AI generation session and generate flashcard candidates.

**Request Body:**
```typescript
{
  input_text: string;    // 1,000-10,000 characters
  model_id?: string;     // Default: "openai/gpt-4o-mini"
  prompt?: string;       // Optional custom prompt
}
```

**Response:** 201 Created
```typescript
{
  id: string;                    // AI session ID
  candidates: CandidateCreateDto[];
  input_text: string;
  model_id: string;
  user_id: string;
  created_at: string;
  generation_duration_ms: number | null;
}
```

**Errors:**
- 400: Validation error (text length, invalid model)
- 401: Not authenticated
- 500: Server error or AI generation failure

---

### GET /api/ai-sessions/[sessionId]/candidates
Retrieve all candidates for a specific AI session.

**Response:** 200 OK
```typescript
CandidateDto[] = [{
  id: string;
  front: string;
  back: string;
  prompt: string | null;
  ai_session_id: string;
  user_id: string;
  created_at: string;
  deleted_at: string | null;
}]
```

**Errors:**
- 401: Not authenticated
- 404: Session not found or doesn't belong to user
- 500: Server error

---

### POST /api/ai-sessions/[sessionId]/candidates/actions
Process bulk actions on candidates (accept/edit/reject).

**Request Body:**
```typescript
{
  accept?: string[];           // Candidate IDs to accept as-is
  edit?: Array<{              // Candidates to edit then accept
    id: string;
    front: string;
    back: string;
  }>;
  reject?: string[];          // Candidate IDs to reject (soft delete)
}
```

**Response:** 200 OK
```typescript
{
  accepted: number;     // Count of accepted candidates
  edited: number;       // Count of edited candidates
  rejected: number;     // Count of rejected candidates
  errors: Array<{      // Any errors that occurred
    candidateId: string;
    error: string;
  }>;
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated
- 404: Session or candidates not found
- 500: Server error

---

## Candidate Management Endpoints

### GET /api/candidates/other-pending
Retrieve pending candidates from previous sessions (excluding current session).

**Query Parameters:**
- `excludeSessionId` (optional): Session ID to exclude (typically current session)

**Response:** 200 OK
```typescript
CandidateDto[]  // Candidates from other sessions
```

**Use Case:** Part of hybrid candidate management - prevents losing candidates when creating new sessions.

**Errors:**
- 401: Not authenticated
- 500: Server error

---

### GET /api/candidates/orphaned
Retrieve orphaned candidates (older than 7 days with ai_session_id set).

**Response:** 200 OK
```typescript
{
  count: number;
  candidates: CandidateDto[];
}
```

**Use Case:** Identify and clean up old candidates that weren't processed.

**Errors:**
- 401: Not authenticated
- 500: Server error

---

## Data Types

### FlashcardDto
```typescript
{
  id: string;
  front: string;              // Max 200 chars
  back: string;               // Max 500 chars
  source: "manual" | "ai";
  ai_session_id: string | null;
  user_id: string;
  created_at: string;         // ISO 8601 timestamp
  updated_at: string;         // ISO 8601 timestamp
  deleted_at: string | null;  // ISO 8601 timestamp (soft delete)
}
```

### CandidateDto
```typescript
{
  id: string;
  front: string;
  back: string;
  prompt: string | null;      // LLM reasoning for this candidate
  ai_session_id: string;
  user_id: string;
  created_at: string;
  deleted_at: string | null;
}
```

### CandidateCreateDto
```typescript
{
  front: string;
  back: string;
  prompt: string | null;
}
```

---

## Authentication

All endpoints except the following require authentication:
- POST /api/register
- POST /api/login
- POST /api/forgot-password
- POST /api/reset-password

Authentication is managed via HTTP-only session cookies set by Supabase Auth.

**Unauthorized Response:**
```typescript
{
  error: "Unauthorized"
}
```
Status: 401

---

## Error Responses

All error responses follow this format:
```typescript
{
  error: string;  // Human-readable error message
}
```

Common status codes:
- 400: Bad Request (validation error)
- 401: Unauthorized (not authenticated)
- 404: Not Found
- 500: Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for:
- POST /api/ai-sessions (expensive AI operations)
- POST /api/register (prevent spam)
- POST /api/forgot-password (prevent abuse)

---

## Allowed Models

AI generation supports the following models:
- `openai/gpt-4o-mini` (default)
- `openai/gpt-4o`
- `anthropic/claude-3-5-sonnet`

Configured in: `src/lib/services/ai.service.ts`
