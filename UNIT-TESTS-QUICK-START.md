# Unit Tests Quick Start Guide

## 🚀 Quick Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in UI mode (visual interface)
npm run test:ui

# Run specific test file
npm test GenerationForm.test.tsx

# Run tests matching a pattern
npm test -- -t "Character count"
```

## 📁 Test Files Created

### Priority 1: Critical Business Logic 🔴

1. **GenerationForm Component**
   - File: `src/components/generate/__tests__/GenerationForm.test.tsx`
   - Tests: 40+ test cases
   - Coverage: Form validation, character counting, accessibility, user interactions

2. **AI Service**
   - File: `src/lib/services/__tests__/ai.service.test.ts`
   - Tests: 35+ test cases
   - Coverage: Model validation, API integration, response parsing, error handling

3. **OpenRouter Service**
   - File: `src/lib/services/__tests__/openrouter.service.test.ts`
   - Tests: 45+ test cases
   - Coverage: HTTP client, retry logic, error classification, caching

### Priority 2: Utilities & Components 🟡

4. **cn() Utility**
   - File: `src/lib/__tests__/utils.test.ts`
   - Tests: 35+ test cases
   - Coverage: Class merging, Tailwind conflicts, edge cases

5. **Button Component**
   - File: `src/components/ui/__tests__/button.test.tsx`
   - Tests: 30+ test cases
   - Coverage: Variants, sizes, accessibility, events

### Supporting Files

6. **Mock Factories**
   - File: `test/helpers/mock-factories.ts`
   - Updated with helpers for all test scenarios

7. **Documentation**
   - File: `docs/unit-tests-implementation.md`
   - Comprehensive guide with patterns and best practices

## 🎯 Test Coverage Summary

| Component/Module | Test Cases | Key Areas |
|-----------------|------------|-----------|
| GenerationForm | 40+ | Validation, UX, A11y |
| AI Service | 35+ | Business logic, Integration |
| OpenRouter Service | 45+ | HTTP, Retry, Errors |
| cn() Utility | 35+ | Class merging, Conflicts |
| Button Component | 30+ | Variants, Events, A11y |
| **TOTAL** | **185+** | **Comprehensive coverage** |

## 🧪 Key Test Scenarios

### GenerationForm
```typescript
✓ Character count: < 1000 → Warning
✓ Character count: 1000-10000 → Success
✓ Character count: > 10000 → Error
✓ Empty submission → Error
✓ Valid submission → Calls onSubmit
✓ ARIA attributes → Properly linked
✓ Loading state → Disables controls
```

### AI Service
```typescript
✓ Allowed models → Accept
✓ Disallowed models → Reject
✓ Valid response → Parse candidates
✓ Invalid JSON → Throw error
✓ Missing fields → Filter/default
✓ All invalid → Throw error
```

### OpenRouter Service
```typescript
✓ 400 error → BadRequestError (no retry)
✓ 401/403 error → AuthError (no retry)
✓ 429 error → RateLimitError (retry)
✓ 5xx error → ServerError (retry)
✓ Network error → NetworkError
✓ Model list → Cache for 5 min
```

## 🔧 Testing Patterns Used

### 1. Arrange-Act-Assert (AAA)
```typescript
it('should do something', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<Component />);
  
  // Act
  await user.click(button);
  
  // Assert
  expect(mockFn).toHaveBeenCalled();
});
```

### 2. Mock Factories
```typescript
import { createMockCandidate } from '@/test/helpers/mock-factories';

const candidate = createMockCandidate({
  front: 'Custom question'
});
```

### 3. User Events
```typescript
const user = userEvent.setup();
await user.type(input, 'text');
await user.click(button);
await user.keyboard('{Enter}');
```

### 4. Accessibility Testing
```typescript
// Labels
expect(screen.getByLabelText(/source text/i)).toBeInTheDocument();

// ARIA
expect(input).toHaveAttribute('aria-invalid', 'true');
expect(input).toHaveAttribute('aria-describedby', 'error-id');

// Keyboard
button.focus();
await user.keyboard('{Enter}');
```

## 🐛 Debugging Tests

```typescript
// Print DOM
screen.debug();

// Print specific element
screen.debug(element);

// Testing Playground URL
screen.logTestingPlaygroundURL();

// Run only one test
it.only('should test this', () => {});

// Skip a test
it.skip('should skip this', () => {});
```

## 📊 Coverage Thresholds

Current thresholds (configured in `vitest.config.ts`):
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

## ✅ What's Tested

### Business Rules
- ✅ Character limits (1000-10000)
- ✅ Model validation (allowed list)
- ✅ Candidate validation (required fields)
- ✅ Default prompt injection
- ✅ Whitespace handling

### Edge Cases
- ✅ Boundary values (999, 1000, 10000, 10001)
- ✅ Empty/null/undefined inputs
- ✅ Whitespace-only strings
- ✅ Special characters
- ✅ Invalid JSON responses
- ✅ Network failures

### User Experience
- ✅ Loading states
- ✅ Error messages
- ✅ Success feedback
- ✅ Character counter colors
- ✅ Button disabled states

### Accessibility
- ✅ ARIA labels
- ✅ ARIA descriptions
- ✅ ARIA invalid states
- ✅ Keyboard navigation
- ✅ Focus management

### Error Handling
- ✅ API errors (400, 401, 403, 429, 5xx)
- ✅ Network errors
- ✅ Validation errors
- ✅ Parse errors
- ✅ Retry logic

## 🔄 CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run unit tests
  run: npm test

- name: Generate coverage report
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
```

## 📚 Next Steps

1. **Run the tests:**
   ```bash
   npm test
   ```

2. **Check coverage:**
   ```bash
   npm run test:coverage
   ```

3. **Add tests for new features** as you build them

4. **Keep tests updated** when refactoring code

5. **Review test failures** carefully - they catch bugs!

## 💡 Tips

- Use **watch mode** during development for instant feedback
- Write tests **before fixing bugs** (TDD approach)
- Keep tests **simple and focused** (one concept per test)
- Use **descriptive test names** (should/when/then pattern)
- Mock **external dependencies** (APIs, databases)
- Test **user behavior**, not implementation details

## 🎓 Learning Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Project Docs](./docs/unit-tests-implementation.md)

---

**Ready to test?** Run `npm test` and watch your code quality soar! 🚀


