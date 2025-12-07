# Testing Guide for 10xCards

This project uses **Vitest** for unit testing and **Playwright** for E2E testing, following best practices outlined in the tech stack.

## Unit Testing (Vitest)

### Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with UI mode for visual inspection
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Writing Unit Tests

Unit tests are located alongside the components they test in `__tests__` directories or with `.test.ts(x)` suffix.

**Example test structure:**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

describe("ComponentName", () => {
  it("should render correctly", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Best Practices

- Use `vi.fn()` for function mocks
- Use `vi.spyOn()` to monitor existing functions
- Follow the Arrange-Act-Assert (AAA) pattern
- Use descriptive test names
- Test user interactions, not implementation details
- Leverage `@testing-library/react` for DOM queries

### Test Helpers

- **test-utils.tsx**: Custom render function with providers
- **mock-factories.ts**: Factory functions for creating test data
- **setup.ts**: Global test configuration and mocks

## E2E Testing (Playwright)

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Writing E2E Tests

E2E tests are located in the `e2e/` directory. Use the Page Object Model for maintainable tests.

**Example E2E test:**

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

### Best Practices

- Use Page Object Model for reusable page interactions
- Use role-based locators (getByRole, getByLabel) for resilience
- Implement visual regression testing with `toHaveScreenshot()`
- Use test hooks (beforeEach, afterEach) for setup/teardown
- Run tests in parallel for faster execution
- Use trace viewer for debugging failures

## Configuration

- **vitest.config.ts**: Vitest configuration with jsdom environment
- **playwright.config.ts**: Playwright configuration (Chromium only)
- **test/setup.ts**: Global test setup and mocks

## Coverage Goals

- **Target**: 80% code coverage for critical paths
- **Unit test runtime**: < 30 seconds
- **E2E test runtime**: < 5 minutes

## Continuous Integration

Tests run automatically in CI/CD pipeline via GitHub Actions:

- Unit tests run on every commit
- E2E tests run on pull requests
- Coverage reports are generated and tracked

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in config or use `test.setTimeout()`
2. **Flaky E2E tests**: Add proper wait conditions (`waitForLoadState`, `waitForSelector`)
3. **Mock not working**: Ensure mocks are defined at the top level of test files
4. **Coverage not accurate**: Check exclude patterns in vitest.config.ts

### Getting Help

- Vitest docs: https://vitest.dev
- Playwright docs: https://playwright.dev
- Testing Library docs: https://testing-library.com

