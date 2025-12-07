# Unit Tests Implementation Guide

This document provides a comprehensive overview of the unit tests implemented for the 10xCards project, following Vitest best practices.

## Test Coverage Overview

### Priority 1: High-Value Tests (Must Have) 🔴

#### 1. GenerationForm Component
**Location:** `src/components/generate/__tests__/GenerationForm.test.tsx`

**Coverage:**
- ✅ Character count validation (min: 1000, max: 10000)
- ✅ Form submission validation
- ✅ User interactions and state management
- ✅ Character counter display with color coding
- ✅ Accessibility attributes (ARIA)
- ✅ Model selection
- ✅ Loading states
- ✅ Edge cases (boundary values, whitespace)

**Key Test Scenarios:**
```typescript
// Character count boundaries
- Below 1000 chars → Warning (amber)
- 1000-10000 chars → Success (green)
- Above 10000 chars → Error (red)
- Exactly 1000 chars → Valid
- Exactly 10000 chars → Valid
- 999 chars → Invalid
- 10001 chars → Invalid

// Form validation
- Empty text → Error
- Whitespace only → Error
- Valid text + valid model → Submit
- Invalid model → Error

// Accessibility
- aria-describedby links errors
- aria-invalid on error fields
- Proper labels for all inputs
```

#### 2. AI Service - generateFlashcards()
**Location:** `src/lib/services/__tests__/ai.service.test.ts`

**Coverage:**
- ✅ Model validation (allowed vs disallowed)
- ✅ API key validation
- ✅ Response parsing (JSON validation)
- ✅ Candidate validation and filtering
- ✅ Default prompt injection
- ✅ Whitespace trimming
- ✅ Duration tracking
- ✅ OpenRouterService integration
- ✅ Error handling and wrapping

**Key Test Scenarios:**
```typescript
// Model validation
- Allowed models → Accept
- Disallowed models → Reject with list

// Candidate validation
- Valid (front + back + prompt) → Include
- Missing front → Filter out
- Missing back → Filter out
- Missing prompt → Add default
- Invalid prompt type → Add default
- All invalid → Throw error

// Response parsing
- Valid JSON → Parse
- Invalid JSON → Error
- Missing flashcards array → Error
- Empty flashcards array → Error
- Non-array flashcards → Error
```

#### 3. OpenRouterService
**Location:** `src/lib/services/__tests__/openrouter.service.test.ts`

**Coverage:**
- ✅ Constructor validation (API key, baseURL)
- ✅ Message building (system, user, history)
- ✅ Request building (headers, body, metadata)
- ✅ Error classification (400, 401, 403, 429, 5xx)
- ✅ Retry logic (rate limits, server errors)
- ✅ Model list caching (5-minute TTL)
- ✅ Input validation (Zod schemas)
- ✅ Network error handling

**Key Test Scenarios:**
```typescript
// Error handling
- 400 → OpenRouterBadRequestError (no retry)
- 401/403 → OpenRouterAuthError (no retry)
- 429 → OpenRouterRateLimitError (retry with backoff)
- 5xx → OpenRouterServerError (retry with backoff)
- Network → OpenRouterNetworkError

// Retry logic
- Rate limits → Retry up to maxRetries
- Server errors → Retry up to maxRetries
- Auth errors → No retry
- Bad requests → No retry

// Caching
- First call → Fetch from API
- Second call < 5 min → Return cached
- After 5 min → Fetch again
```

### Priority 2: Medium-Value Tests (Should Have) 🟡

#### 4. cn() Utility Function
**Location:** `src/lib/__tests__/utils.test.ts`

**Coverage:**
- ✅ Basic class merging
- ✅ Tailwind conflict resolution
- ✅ Conditional classes
- ✅ Undefined/null handling
- ✅ Real-world component patterns
- ✅ Edge cases (special chars, arbitrary values)

**Key Test Scenarios:**
```typescript
// Conflict resolution
- 'p-4' + 'p-8' → 'p-8' (last wins)
- 'text-red-500' + 'text-blue-500' → 'text-blue-500'
- 'w-full' + 'w-1/2' → 'w-1/2'

// Conditional classes
- true && 'active' → Include
- false && 'active' → Exclude
- { active: true, disabled: false } → 'active'

// Edge cases
- undefined, null, '' → Ignored
- Duplicate classes → Deduplicated
- Whitespace → Trimmed
```

#### 5. Button Component
**Location:** `src/components/ui/__tests__/button.test.tsx`

**Coverage:**
- ✅ Variant rendering (default, destructive, outline, secondary, ghost, link)
- ✅ Size variants (default, sm, lg, icon)
- ✅ Disabled state
- ✅ AsChild prop (Radix Slot)
- ✅ Event handlers (onClick, onFocus, onBlur)
- ✅ Accessibility (keyboard, ARIA)
- ✅ Custom className merging

**Key Test Scenarios:**
```typescript
// Variants
- default → bg-primary
- destructive → bg-destructive
- outline → border + bg-background
- secondary → bg-secondary
- ghost → hover:bg-accent
- link → text-primary + underline

// Sizes
- default → h-9 px-4
- sm → h-8 px-3
- lg → h-10 px-6
- icon → size-9

// AsChild
- asChild={true} → Render as child element
- asChild={false} → Render as button
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test GenerationForm.test.tsx
```

### Run Tests Matching Pattern
```bash
npm test -- -t "Character count validation"
```

### Run Tests in UI Mode
```bash
npm run test:ui
```

## Test Structure

All tests follow the **Arrange-Act-Assert (AAA)** pattern:

```typescript
it('should do something', async () => {
  // Arrange - Set up test data and mocks
  const user = userEvent.setup();
  const mockFn = vi.fn();
  render(<Component prop={mockFn} />);
  
  // Act - Perform the action
  const button = screen.getByRole('button');
  await user.click(button);
  
  // Assert - Verify the result
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

## Mocking Best Practices

### 1. Use vi.mock() for Module Mocks
```typescript
// At top of file
vi.mock('../openrouter.service');

// In test
vi.mocked(OpenRouterService).mockImplementation(() => ({
  chat: mockChat,
  buildMessages: mockBuildMessages,
}));
```

### 2. Use Mock Factories
```typescript
import { createMockCandidate, createMockChatSuccess } from '@/test/helpers/mock-factories';

const candidate = createMockCandidate({ front: 'Custom question' });
const response = createMockChatSuccess({ model: 'gpt-4' });
```

### 3. Clear Mocks Between Tests
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 4. Use userEvent for User Interactions
```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.type(input, 'text');
await user.click(button);
```

## Accessibility Testing

All component tests include accessibility checks:

```typescript
// Check for proper labels
expect(screen.getByLabelText(/source text/i)).toBeInTheDocument();

// Check for ARIA attributes
expect(textarea).toHaveAttribute('aria-invalid', 'true');
expect(textarea).toHaveAttribute('aria-describedby', 'error-id');

// Check for keyboard accessibility
button.focus();
await user.keyboard('{Enter}');
expect(handleClick).toHaveBeenCalled();
```

## Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

## Test Files Organization

```
src/
├── components/
│   ├── generate/
│   │   ├── __tests__/
│   │   │   └── GenerationForm.test.tsx
│   │   └── GenerationForm.tsx
│   └── ui/
│       ├── __tests__/
│       │   └── button.test.tsx
│       └── button.tsx
├── lib/
│   ├── __tests__/
│   │   └── utils.test.ts
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── ai.service.test.ts
│   │   │   └── openrouter.service.test.ts
│   │   ├── ai.service.ts
│   │   └── openrouter.service.ts
│   └── utils.ts
test/
├── helpers/
│   ├── mock-factories.ts
│   └── test-utils.tsx
└── setup.ts
```

## Common Testing Patterns

### 1. Testing Forms
```typescript
// Test validation
await user.type(input, 'invalid');
await user.click(submitButton);
expect(screen.getByText(/error message/i)).toBeInTheDocument();

// Test successful submission
await user.type(input, 'valid input');
await user.click(submitButton);
expect(mockOnSubmit).toHaveBeenCalledWith('valid input');
```

### 2. Testing Async Operations
```typescript
// Use waitFor for async updates
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// Mock async functions
const asyncFn = vi.fn().mockResolvedValue(data);
```

### 3. Testing Error States
```typescript
// Mock error response
mockFetch.mockRejectedValue(new Error('API Error'));

// Assert error handling
await expect(service.chat(options)).rejects.toThrow(/API Error/);
```

### 4. Testing Loading States
```typescript
render(<Component isLoading={true} />);
expect(screen.getByText(/loading/i)).toBeInTheDocument();
expect(screen.getByRole('button')).toBeDisabled();
```

## Edge Cases to Always Test

1. **Boundary Values**
   - Minimum valid value
   - Maximum valid value
   - Just below minimum
   - Just above maximum

2. **Empty/Null/Undefined**
   - Empty strings
   - null values
   - undefined values
   - Empty arrays/objects

3. **Whitespace**
   - Leading/trailing whitespace
   - Whitespace-only strings
   - Multiple spaces

4. **Special Characters**
   - Unicode characters
   - HTML entities
   - Quotes and apostrophes
   - Newlines and tabs

## Debugging Tests

### 1. Use screen.debug()
```typescript
screen.debug(); // Print entire DOM
screen.debug(element); // Print specific element
```

### 2. Use screen.logTestingPlaygroundURL()
```typescript
screen.logTestingPlaygroundURL();
// Opens Testing Playground with current DOM
```

### 3. Use --reporter=verbose
```bash
npm test -- --reporter=verbose
```

### 4. Run Single Test
```typescript
it.only('should test specific case', () => {
  // Only this test will run
});
```

## Next Steps

### Additional Tests to Consider

1. **Select Component** - Similar to Button tests
2. **Textarea Component** - Input validation, resize
3. **Label Component** - Association with inputs
4. **Integration Tests** - Multiple components working together
5. **API Endpoint Tests** - Test Astro API routes

### Continuous Improvement

- Monitor coverage reports
- Add tests for new features
- Refactor tests as code evolves
- Keep mock factories updated
- Document complex test scenarios

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Library User Events](https://testing-library.com/docs/user-event/intro)
- [Vitest UI](https://vitest.dev/guide/ui.html)


