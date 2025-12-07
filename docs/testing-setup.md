# Testing Environment Setup - Complete

## Overview

The testing environment for 10xCards has been successfully configured with:

- **Vitest** for unit testing (with React Testing Library)
- **Playwright** for E2E testing (Chromium only)

## Installation Summary

### Dependencies Installed

**Unit Testing:**

- `vitest` - Fast Vite-native test runner
- `@vitest/ui` - Visual UI for test inspection
- `@vitest/coverage-v8` - Code coverage reporting
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM environment for tests
- `happy-dom` - Alternative lightweight DOM
- `@vitejs/plugin-react` - React support for Vitest

**E2E Testing:**

- `@playwright/test` - Modern E2E testing framework
- Chromium browser (installed via `npx playwright install chromium`)

## Configuration Files

### 1. vitest.config.ts

- Configured with jsdom environment for DOM testing
- Setup file for global mocks and matchers
- Coverage thresholds set to 80%
- Path aliases configured (`@/*` → `./src/*`)
- Excludes E2E tests and build artifacts

### 2. playwright.config.ts

- Chromium-only configuration (as per guidelines)
- Parallel test execution enabled
- Retry logic for CI environments
- Trace and screenshot capture on failure
- Dev server auto-start before tests
- HTML, list, and JSON reporters configured

### 3. test/setup.ts

Global test setup including:

- Automatic cleanup after each test
- Mock for `window.matchMedia`
- Mock for `IntersectionObserver`
- Mock for `ResizeObserver`
- Imports `@testing-library/jest-dom` matchers

### 4. tsconfig.json

Updated to include:

- `vitest/globals` types
- `@testing-library/jest-dom` types

## Project Structure

```
/Users/danielkwasniewski/Desktop/10xCards/
├── vitest.config.ts              # Vitest configuration
├── playwright.config.ts          # Playwright configuration
├── test/
│   ├── setup.ts                  # Global test setup
│   ├── helpers/
│   │   ├── test-utils.tsx        # Custom render utilities
│   │   └── mock-factories.ts     # Mock data factories
│   └── README.md                 # Testing documentation
├── e2e/
│   ├── example.spec.ts           # Example E2E test
│   └── page-objects/
│       ├── BasePage.ts           # Base page object
│       └── LoginPage.ts          # Login page object
└── src/
    └── components/
        └── ui/
            └── __tests__/
                └── button.test.tsx  # Example unit test
```

## NPM Scripts

```json
{
  "test": "vitest", // Run unit tests
  "test:ui": "vitest --ui", // Run with visual UI
  "test:watch": "vitest --watch", // Watch mode for development
  "test:coverage": "vitest --coverage", // Generate coverage report
  "test:e2e": "playwright test", // Run E2E tests
  "test:e2e:ui": "playwright test --ui", // E2E with UI mode
  "test:e2e:debug": "playwright test --debug", // Debug E2E tests
  "test:e2e:report": "playwright show-report" // View test report
}
```

## Usage Examples

### Running Unit Tests

```bash
# Run all tests once
npm test -- --run

# Watch mode (recommended during development)
npm run test:watch

# Run specific test file
npm test -- button.test.tsx

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode for debugging
npm run test:e2e:ui

# Run specific test file
npm run test:e2e -- login.spec.ts

# Debug mode (step through tests)
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<MyComponent onClick={handleClick} />);

    // Act
    await user.click(screen.getByRole('button'));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";

test("user can log in", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("user@example.com", "password");

  await expect(page).toHaveURL("/dashboard");
});
```

## Best Practices Implemented

### Vitest Guidelines

✅ Use `vi` object for test doubles  
✅ Master `vi.mock()` factory patterns  
✅ Setup files for reusable configuration  
✅ Inline snapshots for readable assertions  
✅ Coverage monitoring (80% threshold)  
✅ Watch mode workflow support  
✅ UI mode for complex test suites  
✅ jsdom environment for DOM testing  
✅ Structured tests with describe blocks  
✅ TypeScript type checking in tests

### Playwright Guidelines

✅ Chromium-only configuration  
✅ Browser contexts for isolation  
✅ Page Object Model implementation  
✅ Locators for resilient selection  
✅ Visual comparison support (`toHaveScreenshot`)  
✅ Trace viewer for debugging  
✅ Test hooks for setup/teardown  
✅ Specific expect matchers  
✅ Parallel execution enabled

## Verification

The setup has been verified with a sample test run:

```
✓ src/components/ui/__tests__/button.test.tsx > Button > renders with default variant
✓ src/components/ui/__tests__/button.test.tsx > Button > handles click events
✓ src/components/ui/__tests__/button.test.tsx > Button > can be disabled
✓ src/components/ui/__tests__/button.test.tsx > Button > applies variant classes correctly

Test Files  1 passed (1)
     Tests  4 passed (4)
  Duration  1.31s
```

## Next Steps

1. **Write unit tests** for existing components in `src/components/`
2. **Write E2E tests** for critical user flows (auth, flashcard generation)
3. **Set up CI/CD** integration in GitHub Actions
4. **Configure coverage reports** for pull requests
5. **Add visual regression tests** with Playwright screenshots
6. **Implement API testing** with MSW (Mock Service Worker)

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [Testing Library Documentation](https://testing-library.com)
- [Project Testing Guide](../test/README.md)

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module '@/...'"  
**Solution**: Path aliases are configured in both `vitest.config.ts` and `tsconfig.json`

**Issue**: DOM matchers not working (e.g., `toBeInTheDocument`)  
**Solution**: Ensure `test/setup.ts` imports `@testing-library/jest-dom`

**Issue**: Playwright can't find browser  
**Solution**: Run `npx playwright install chromium`

**Issue**: E2E tests timeout  
**Solution**: Ensure dev server is running or increase timeout in `playwright.config.ts`

---

**Setup completed successfully!** ✅

All tests are passing and the environment is ready for development.

