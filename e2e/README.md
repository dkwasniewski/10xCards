# E2E Tests

End-to-end tests for 10xCards application using Playwright.

## Structure

```
e2e/
├── global-teardown.ts          # Database cleanup after all tests
├── landing-page.spec.ts        # Landing page tests (unauthenticated)
├── flashcards/                 # Flashcard feature tests
│   └── create-flashcard.spec.ts
├── generate/                   # AI generation feature tests
│   ├── generate-flashcards.spec.ts
│   └── TEST_SCENARIO_GUIDE.md
└── page-objects/               # Page Object Model classes
    ├── BasePage.ts
    ├── LandingPage.ts          # Public landing page
    ├── LoginPage.ts
    ├── MyFlashcardsPage.ts
    ├── GeneratePage.ts
    ├── components/             # Reusable component objects
    │   ├── Header.ts
    │   ├── FlashcardEditorDialog.ts
    │   ├── FlashcardsList.ts
    │   ├── FlashcardRow.ts
    │   ├── GenerationForm.ts
    │   ├── CandidatesList.ts
    │   └── CandidateRow.ts
    └── index.ts
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- e2e/flashcards/create-flashcard.spec.ts

# Run in UI mode (recommended for development)
npm run test:e2e:ui

# Debug mode (step through tests)
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Database Cleanup

**Automatic cleanup runs after all tests complete.**

The `global-teardown.ts` script:

- Authenticates as the test user
- Deletes all test data in correct order:
  1. reviews
  2. event_logs
  3. flashcards
  4. ai_generation_sessions
- Shows cleanup summary in console
- Only affects test user's data

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

**Full documentation**: See [docs/e2e-database-cleanup.md](../docs/e2e-database-cleanup.md)

## Environment Setup

Tests use `.env.test` for configuration (separate from development).

**Required variables:**

- `SUPABASE_URL` - Supabase project URL (remote instance)
- `SUPABASE_KEY` - Supabase anon key
- `E2E_EMAIL` - Test user email
- `E2E_PASSWORD` - Test user password
- `OPENROUTER_API_KEY` - OpenRouter API key (for AI tests)

**See**: [E2E-ENVIRONMENT-SETUP.md](../E2E-ENVIRONMENT-SETUP.md) for details.

## Page Object Model

Tests use the Page Object Model pattern for maintainability:

- **Pages** - High-level page interactions
- **Components** - Reusable UI component objects
- **Locators** - Data-testid attributes for resilience
- **Actions** - Business logic methods

**Documentation**: [page-objects/README.md](./page-objects/README.md)

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, MyFlashcardsPage } from "./page-objects";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.E2E_EMAIL!, process.env.E2E_PASSWORD!);
  });

  test("should do something", async ({ page }) => {
    const flashcardsPage = new MyFlashcardsPage(page);
    await flashcardsPage.goto();

    // Test actions...
    await flashcardsPage.clickNewFlashcard();

    // Assertions...
    await expect(flashcardsPage.editorDialog.dialog).toBeVisible();
  });
});
```

### Using Page Objects

```typescript
// Navigate to page
const flashcardsPage = new MyFlashcardsPage(page);
await flashcardsPage.goto();
await flashcardsPage.waitForPageLoad();

// Use components
await flashcardsPage.editorDialog.createFlashcard("Front", "Back");
await flashcardsPage.flashcardsList.waitForNewFlashcard("Front");

// Get data
const firstRow = flashcardsPage.flashcardsList.getFirstRow();
const data = await firstRow.getData();
```

## Test Categories

### Public Pages

- **Landing Page** (`landing-page.spec.ts`)
  - Hero section and CTAs
  - Feature cards display
  - How it works section
  - Navigation to register/login
  - Responsive layout (mobile/tablet/desktop)

### Functional Tests

- User flows (login, create, edit, delete)
- Feature interactions
- Navigation

### Validation Tests

- Form validation
- Error handling
- Edge cases

### Integration Tests

- AI generation
- Database operations
- Authentication

## Best Practices

### ✅ DO

- Use Page Object Model
- Use data-testid for locators
- Wait for elements properly
- Test user behavior, not implementation
- Clean descriptive test names
- Use beforeEach for common setup

### ❌ DON'T

- Access page directly in tests
- Use arbitrary timeouts
- Test implementation details
- Duplicate selectors
- Use brittle CSS selectors

## Configuration

**File**: `playwright.config.ts`

**Key settings:**

- Workers: 1 (sequential execution for Supabase)
- Retries: 0 in dev, 2 in CI
- Browser: Chromium only (Desktop Chrome)
- Base URL: http://localhost:3000
- Global Teardown: Database cleanup

## Debugging

### Visual Debugging

```bash
# UI mode - interactive test runner
npm run test:e2e:ui

# Debug mode - step through tests
npm run test:e2e:debug

# Headed mode - see browser
npm run test:e2e -- --headed
```

### Traces and Screenshots

- Screenshots: On failure (automatic)
- Videos: On failure (automatic)
- Traces: On retry (automatic)

View with:

```bash
npm run test:e2e:report
```

## CI/CD

Tests run on CI with:

- 2 retries for flaky tests
- Sequential execution (workers: 1)
- Automatic cleanup after tests
- Test reports as artifacts

## Troubleshooting

### Tests hanging

- Check if server is running
- Verify environment variables in `.env.test`
- Check Supabase connection

### Authentication failures

- Verify test user exists in Supabase
- Check E2E_EMAIL and E2E_PASSWORD
- Ensure remote Supabase is accessible

### Database errors

- Verify cleanup ran successfully
- Check RLS policies allow user operations
- Ensure foreign key constraints are respected

### Cleanup not running

- Tests must complete normally (not killed)
- Check globalTeardown in playwright.config.ts
- Verify .env.test has correct credentials

## Resources

- [Testing Quick Reference](../TESTING-QUICK-REFERENCE.md)
- [Database Cleanup Guide](../docs/e2e-database-cleanup.md)
- [Page Objects Documentation](./page-objects/README.md)
- [Environment Setup](../E2E-ENVIRONMENT-SETUP.md)
- [Playwright Docs](https://playwright.dev)

---

**Happy Testing! 🎉**

