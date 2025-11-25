# GET /api/flashcards - Test Plan

## Overview

This document outlines the test scenarios for the GET /api/flashcards endpoint implementation.

## Test Scenarios

### 1. Basic Functionality Tests

#### 1.1 Default Parameters (Happy Path)

**Request:**

```bash
GET /api/flashcards
```

**Expected Response:**

- Status: 200 OK
- Body:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": <count>
  }
}
```

#### 1.2 Custom Pagination

**Request:**

```bash
GET /api/flashcards?page=2&limit=10
```

**Expected Response:**

- Status: 200 OK
- Returns 10 items (or fewer if less available)
- Pagination reflects page=2, limit=10

#### 1.3 Maximum Limit

**Request:**

```bash
GET /api/flashcards?limit=100
```

**Expected Response:**

- Status: 200 OK
- Returns up to 100 items

### 2. Search Functionality Tests

#### 2.1 Basic Search

**Request:**

```bash
GET /api/flashcards?search=test
```

**Expected Response:**

- Status: 200 OK
- Returns only flashcards where front or back contains "test"
- Uses full-text search on tsv column

#### 2.2 Empty Search Results

**Request:**

```bash
GET /api/flashcards?search=nonexistentterm12345
```

**Expected Response:**

- Status: 200 OK
- Body:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

#### 2.3 Search with Special Characters

**Request:**

```bash
GET /api/flashcards?search=test%20query
```

**Expected Response:**

- Status: 200 OK
- Properly handles URL-encoded search terms

### 3. Sorting Tests

#### 3.1 Sort by Created Date (Default)

**Request:**

```bash
GET /api/flashcards?sort=created_at
```

**Expected Response:**

- Status: 200 OK
- Results sorted by created_at DESC (newest first)

#### 3.2 Sort by Front Text

**Request:**

```bash
GET /api/flashcards?sort=front
```

**Expected Response:**

- Status: 200 OK
- Results sorted by front ASC (alphabetically)

### 4. Validation Error Tests

#### 4.1 Invalid Page Number

**Request:**

```bash
GET /api/flashcards?page=0
```

**Expected Response:**

- Status: 400 Bad Request
- Body:

```json
{
  "error": "Validation error",
  "details": [...]
}
```

#### 4.2 Invalid Limit (Too High)

**Request:**

```bash
GET /api/flashcards?limit=200
```

**Expected Response:**

- Status: 400 Bad Request
- Validation error for limit exceeding max (100)

#### 4.3 Invalid Limit (Too Low)

**Request:**

```bash
GET /api/flashcards?limit=0
```

**Expected Response:**

- Status: 400 Bad Request
- Validation error for limit below min (1)

#### 4.4 Invalid Sort Field

**Request:**

```bash
GET /api/flashcards?sort=invalid_field
```

**Expected Response:**

- Status: 400 Bad Request
- Validation error for invalid sort enum value

#### 4.5 Search String Too Long

**Request:**

```bash
GET /api/flashcards?search=<string with 101+ characters>
```

**Expected Response:**

- Status: 400 Bad Request
- Validation error for search exceeding max length (100)

### 5. Combined Parameters Tests

#### 5.1 Search + Pagination

**Request:**

```bash
GET /api/flashcards?search=test&page=2&limit=5
```

**Expected Response:**

- Status: 200 OK
- Returns page 2 of search results with 5 items per page

#### 5.2 Search + Sort

**Request:**

```bash
GET /api/flashcards?search=test&sort=front
```

**Expected Response:**

- Status: 200 OK
- Filtered results sorted alphabetically by front

#### 5.3 All Parameters

**Request:**

```bash
GET /api/flashcards?search=test&page=1&limit=10&sort=created_at
```

**Expected Response:**

- Status: 200 OK
- All parameters applied correctly

### 6. Edge Cases

#### 6.1 Empty Database

**Scenario:** User has no flashcards

**Expected Response:**

- Status: 200 OK
- Body:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

#### 6.2 Page Beyond Available Data

**Request:**

```bash
GET /api/flashcards?page=999
```

**Expected Response:**

- Status: 200 OK
- Empty data array, but valid pagination object

#### 6.3 Soft-Deleted Flashcards

**Scenario:** User has flashcards with deleted_at != null

**Expected Behavior:**

- Soft-deleted flashcards should NOT appear in results
- Query filters with `is('deleted_at', null)`

### 7. Security Tests

#### 7.1 User Isolation

**Scenario:** Multiple users with flashcards

**Expected Behavior:**

- User A can only see their own flashcards
- User B's flashcards are not visible to User A
- Enforced by `eq('user_id', userId)` filter

#### 7.2 SQL Injection Attempt

**Request:**

```bash
GET /api/flashcards?search='; DROP TABLE flashcards; --
```

**Expected Behavior:**

- No SQL injection occurs
- Supabase query builder uses parameterized queries
- Search term is safely passed to plainto_tsquery

### 8. Performance Tests

#### 8.1 Large Dataset

**Scenario:** User has 10,000+ flashcards

**Expected Behavior:**

- Query completes in reasonable time (<500ms)
- Composite index (user_id, created_at DESC) is used
- Pagination prevents loading all records

#### 8.2 Complex Search

**Scenario:** Full-text search on large dataset

**Expected Behavior:**

- GIN index on tsv column is used
- Query completes efficiently

### 9. Error Handling Tests

#### 9.1 Database Connection Error

**Scenario:** Supabase client unavailable

**Expected Response:**

- Status: 500 Internal Server Error
- Error logged to event_logs table
- Body:

```json
{
  "error": "Supabase client not available"
}
```

#### 9.2 Database Query Error

**Scenario:** Unexpected database error during query

**Expected Response:**

- Status: 500 Internal Server Error
- Error logged to event_logs table with service name
- User-friendly error message returned

## Manual Testing Checklist

- [ ] Test with default parameters
- [ ] Test pagination (multiple pages)
- [ ] Test search functionality
- [ ] Test both sort options (created_at, front)
- [ ] Test validation errors (invalid page, limit, sort)
- [ ] Test combined parameters
- [ ] Verify soft-deleted flashcards are excluded
- [ ] Verify user isolation (if multiple users available)
- [ ] Check response format matches ListFlashcardsResponseDto
- [ ] Verify error responses include proper status codes
- [ ] Check that errors are logged to event_logs table

## Automated Testing (Future)

### Unit Tests (Vitest)

- [ ] Test listFlashcardsQuerySchema validation
- [ ] Test FlashcardsService.listFlashcards with mocked Supabase client
- [ ] Test pagination calculation logic
- [ ] Test error handling in service layer

### Integration Tests (Playwright/Supertest)

- [ ] Test full request/response cycle
- [ ] Test with real database (test environment)
- [ ] Test authentication flow (when implemented)
- [ ] Test rate limiting (when implemented)

## Notes

- Current implementation uses DEFAULT_USER_ID for development
- Authentication will be added later (TODO in code)
- Rate limiting is mentioned in plan but not yet implemented
- Consider adding request logging for monitoring

