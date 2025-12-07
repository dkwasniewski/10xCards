# Testing Quick Reference

## 🚀 Quick Start

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## 📋 Common Commands

### Unit Tests (Vitest)

| Command                       | Description                      |
| ----------------------------- | -------------------------------- |
| `npm test`                    | Run all unit tests               |
| `npm run test:watch`          | Watch mode (recommended for dev) |
| `npm run test:ui`             | Open visual UI                   |
| `npm run test:coverage`       | Generate coverage report         |
| `npm test -- button.test.tsx` | Run specific test file           |
| `npm test -- -t "renders"`    | Run tests matching pattern       |

### E2E Tests (Playwright)

| Command                             | Description               |
| ----------------------------------- | ------------------------- |
| `npm run test:e2e`                  | Run all E2E tests         |
| `npm run test:e2e:ui`               | Open Playwright UI        |
| `npm run test:e2e:debug`            | Debug mode (step through) |
| `npm run test:e2e:report`           | View last test report     |
| `npm run test:e2e -- login.spec.ts` | Run specific test file    |
| `npm run test:e2e -- --headed`      | Run with visible browser  |

**Note**: Database cleanup runs automatically after all E2E tests complete (see [Database Cleanup](#-database-cleanup))

## 📝 Test File Locations

```
Unit Tests:    src/**/__tests__/*.test.tsx
E2E Tests:     e2e/**/*.spec.ts
Test Helpers:  test/helpers/
Setup:         test/setup.ts
```

## 🔧 Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  it('should do something', async () => {
    // Arrange
    const mockFn = vi.fn();
    const user = userEvent.setup();
    render(<Component onClick={mockFn} />);

    // Act
    await user.click(screen.getByRole('button'));

    // Assert
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from "@playwright/test";

test("should do something", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /click me/i }).click();
  await expect(page).toHaveURL("/success");
});
```

## 🎯 Common Patterns

### Mocking Functions

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue("value");
mockFn.mockResolvedValue("async value");
```

### Querying Elements

```typescript
// Preferred (accessible)
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText(/email/i);

// Fallback
screen.getByTestId("submit-button");
```

### User Interactions

```typescript
const user = userEvent.setup();
await user.click(element);
await user.type(input, "text");
await user.keyboard("{Enter}");
```

### Playwright Locators

```typescript
page.getByRole("button", { name: /submit/i });
page.getByLabel(/email/i);
page.getByText(/welcome/i);
page.locator('[data-testid="custom"]');
```

## 🐛 Debugging

### Unit Tests

```bash
# Run with verbose output
npm test -- --reporter=verbose

# Debug specific test
npm test -- -t "test name" --no-coverage
```

### E2E Tests

```bash
# Debug mode (pause execution)
npm run test:e2e:debug

# Run with visible browser
npm run test:e2e -- --headed

# View traces
npm run test:e2e:report
```

## 📊 Coverage

```bash
# Generate coverage report
npm run test:coverage

# View in browser
open coverage/index.html
```

**Target**: 80% coverage for critical paths

## ⚡ Performance Tips

- Use `test:watch` during development
- Run specific tests with `-t` flag
- Use `test.only()` to focus on one test
- Skip slow tests with `test.skip()`
- Parallelize E2E tests (default enabled)

## 🔍 Useful Matchers

### Vitest/Jest-DOM

```typescript
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toHaveClass("active");
expect(element).toHaveTextContent("text");
```

### Playwright

```typescript
await expect(page).toHaveURL("/path");
await expect(page).toHaveTitle(/title/i);
await expect(element).toBeVisible();
await expect(element).toHaveText("text");
await expect(element).toBeDisabled();
```

## 📚 Resources

- [Full Testing Guide](./test/README.md)
- [Setup Documentation](./docs/testing-setup.md)
- [Database Cleanup Guide](./docs/e2e-database-cleanup.md)
- [Database Cleanup Quick Ref](./docs/e2e-database-cleanup-quick-ref.md)
- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)
- [Testing Library Docs](https://testing-library.com)

## 🧹 Database Cleanup

E2E tests automatically clean up test data after completion:

**What gets cleaned:**

- Reviews
- Event logs
- Flashcards
- AI generation sessions

**How it works:**

- Runs once after all tests finish
- Only deletes test user's data
- Respects foreign key constraints
- Shows summary in console

**Console output:**

```
🧹 Starting database cleanup...
🔍 Found test user: test@test.com
✅ Deleted 5 reviews
✅ Deleted 12 event logs
✅ Deleted 8 flashcards
✅ Deleted 2 AI generation sessions
✨ Database cleanup completed successfully!
```

For full details, see [Database Cleanup Guide](./docs/e2e-database-cleanup.md)

---

**Happy Testing! 🎉**
