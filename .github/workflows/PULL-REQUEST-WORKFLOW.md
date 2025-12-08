# Pull Request CI Workflow Documentation

## Overview

The `pull-request.yml` workflow is designed to automatically validate all pull requests to the `master` branch by running comprehensive checks including linting, unit tests, and E2E tests.

## Workflow Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Pull Request Opened                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  Code Linting │
                  └──────┬───────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
         ┌─────────────┐   ┌─────────────┐
         │ Unit Tests  │   │  E2E Tests  │
         │ (parallel)  │   │ (parallel)  │
         └──────┬──────┘   └──────┬──────┘
                │                 │
                └────────┬────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │Status Comment│
                  │(if success)  │
                  └──────────────┘
```

## Jobs

### 1. Code Linting

- **Purpose:** Ensures code quality and consistency
- **Runs:** First, before any tests
- **Actions:**
  - Checkout code
  - Setup Node.js (version from `.nvmrc`: 22.14.0)
  - Install dependencies with `npm ci`
  - Run ESLint

### 2. Unit Tests

- **Purpose:** Validates code functionality with unit tests
- **Runs:** In parallel with E2E tests after linting succeeds
- **Actions:**
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Run unit tests with coverage collection
  - Upload coverage artifacts (retained for 7 days)

### 3. E2E Tests

- **Purpose:** Validates end-to-end functionality
- **Runs:** In parallel with unit tests after linting succeeds
- **Environment:** `integration` (GitHub environment)
- **Actions:**
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Install Playwright Chromium browser (as per `playwright.config.ts`)
  - Run E2E tests with environment variables
  - Upload Playwright report (retained for 7 days)
  - Upload test traces on failure (retained for 7 days)

#### E2E Environment Variables

Based on the project's environment variable analysis, the following secrets must be configured in the `integration` GitHub environment:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous key
- `OPENROUTER_API_KEY` - OpenRouter API key for AI flashcard generation
- `PUBLIC_SITE_URL` - Application URL (e.g., `http://localhost:3000`)
- `E2E_EMAIL` - Test user email for E2E tests
- `E2E_PASSWORD` - Test user password for E2E tests

### 4. Status Comment

- **Purpose:** Posts a summary comment on the PR
- **Runs:** Only if all previous jobs succeed
- **Permissions:** Requires `pull-requests: write`
- **Actions:**
  - Download unit test coverage artifacts
  - Download Playwright report artifacts
  - Parse coverage summary from JSON
  - Post formatted comment with:
    - Test results summary
    - Coverage percentage
    - Links to artifacts

## GitHub Actions Used

All actions use the latest stable versions:

- `actions/checkout@v4` - Checkout repository code
- `actions/setup-node@v4` - Setup Node.js environment
- `actions/upload-artifact@v4` - Upload test artifacts
- `actions/download-artifact@v4` - Download test artifacts
- `actions/github-script@v7` - Post PR comments

## Configuration Requirements

### 1. GitHub Environment Setup

Create an `integration` environment in your GitHub repository:

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name it `integration`
4. Add the following secrets:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENROUTER_API_KEY`
   - `PUBLIC_SITE_URL`
   - `E2E_EMAIL`
   - `E2E_PASSWORD`

### 2. Repository Files

Required files:

- `.nvmrc` - Node.js version (currently: 22.14.0)
- `playwright.config.ts` - Playwright configuration
- `package.json` - NPM scripts for testing

### 3. NPM Scripts

The workflow uses the following scripts from `package.json`:

- `npm run lint` - Run ESLint
- `npm run test:coverage -- --run` - Run unit tests with coverage
- `npm run test:e2e` - Run Playwright E2E tests

## Concurrency Control

The workflow uses concurrency groups to cancel in-progress runs when new commits are pushed to the same PR:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

## Coverage Collection

### Unit Tests

- Coverage is collected using Vitest's built-in coverage tool (`@vitest/coverage-v8`)
- Results are stored in the `coverage/` directory
- Coverage summary is parsed from `coverage/coverage-summary.json`

### E2E Tests

- Playwright generates test reports in `playwright-report/`
- Test traces are captured on failure for debugging

## Artifacts

All artifacts are retained for 7 days:

1. **unit-test-coverage** - Unit test coverage reports
2. **playwright-report** - E2E test HTML report
3. **playwright-traces** - E2E test traces (only on failure)

## Status Comment Format

When all checks pass, the workflow posts a comment like this:

```markdown
## ✅ Pull Request CI - All Checks Passed

### 📊 Test Results

| Check           | Status    |
| --------------- | --------- |
| 🔍 Code Linting | ✅ Passed |
| 🧪 Unit Tests   | ✅ Passed |
| 🎭 E2E Tests    | ✅ Passed |

### 📈 Coverage

- **Unit Test Coverage:** 85.7%

### 📦 Artifacts

- [Unit Test Coverage Report](https://github.com/...)
- [Playwright Test Report](https://github.com/...)

---

_Workflow run: [123456](https://github.com/...)_
```

## Troubleshooting

### Common Issues

1. **E2E tests fail with "Environment not found"**
   - Ensure the `integration` environment is created in GitHub Settings
   - Verify all required secrets are configured

2. **Coverage parsing fails**
   - Check that Vitest is generating `coverage/coverage-summary.json`
   - Ensure `@vitest/coverage-v8` is installed

3. **Playwright browser installation fails**
   - The workflow uses `--with-deps` flag to install system dependencies
   - This should work on Ubuntu runners without issues

4. **Status comment not posted**
   - Verify the workflow has `pull-requests: write` permission
   - Check that all previous jobs succeeded (the comment only runs on success)

## Best Practices

1. **Keep secrets secure** - Never commit real credentials to the repository
2. **Use .env.test for local E2E testing** - Keep GitHub secrets separate from local development
3. **Review artifacts** - Check coverage reports and Playwright traces when tests fail
4. **Monitor workflow runs** - Use GitHub Actions dashboard to track performance

## Related Files

- `.github/workflows/ci.yml` - Main CI/CD pipeline for master branch
- `.github/workflows/test.yml` - Test workflow (if exists)
- `playwright.config.ts` - Playwright configuration
- `.env.example` - Template for environment variables
- `ENV_VARIABLES_ANALYSIS.md` - Detailed analysis of all environment variables

## Maintenance

### Updating Action Versions

To check for updates to GitHub Actions:

```bash
# Check latest version of actions/checkout
curl -s https://api.github.com/repos/actions/checkout/releases/latest | grep '"tag_name":'

# Check latest version of actions/setup-node
curl -s https://api.github.com/repos/actions/setup-node/releases/latest | grep '"tag_name":'

# Check latest version of actions/upload-artifact
curl -s https://api.github.com/repos/actions/upload-artifact/releases/latest | grep '"tag_name":'

# Check latest version of actions/github-script
curl -s https://api.github.com/repos/actions/github-script/releases/latest | grep '"tag_name":'
```

Always use major version tags (e.g., `v4`, `v7`) for stability.

## Testing the Workflow

To test the workflow:

1. Create a feature branch
2. Make a small change
3. Open a pull request to `master`
4. Watch the workflow run in the **Actions** tab
5. Verify the status comment is posted

## Performance

Expected execution times:

- **Linting:** ~30 seconds
- **Unit Tests:** ~1-2 minutes
- **E2E Tests:** ~3-5 minutes
- **Total:** ~5-7 minutes

The parallel execution of unit and E2E tests saves approximately 2-3 minutes compared to sequential execution.
