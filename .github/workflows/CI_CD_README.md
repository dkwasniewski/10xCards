# CI/CD Pipeline Documentation

## Overview

This CI/CD pipeline ensures code quality, testing coverage, and successful production builds for the 10xCards project. The workflow runs automatically on pushes to the `master` branch and can be triggered manually.

## Workflow: `ci.yml`

### Triggers

- **Manual**: Can be triggered via GitHub Actions UI using `workflow_dispatch`
- **Automatic**: Runs on every push to the `master` branch

### Jobs

The pipeline consists of 4 jobs that run in the following order:

```
lint
├── unit-tests (runs after lint)
└── e2e-tests (runs after lint)
    └── build (runs after both unit-tests and e2e-tests complete)
```

#### 1. Lint (`lint`)

- **Purpose**: Validates code quality and style
- **Runtime**: ~1-2 minutes
- **Command**: `npm run lint`
- **When it fails**: Fix ESLint errors in your code

#### 2. Unit Tests (`unit-tests`)

- **Purpose**: Runs Vitest unit tests with coverage
- **Runtime**: ~2-3 minutes
- **Dependencies**: Requires `lint` to pass
- **Commands**:
  - `npm test -- --run`
  - `npm run test:coverage -- --run`
- **Artifacts**: Coverage reports (retained for 14 days)
- **When it fails**: Check test failures in the GitHub Actions logs

#### 3. E2E Tests (`e2e-tests`)

- **Purpose**: Runs Playwright end-to-end tests
- **Runtime**: ~5-10 minutes
- **Dependencies**: Requires `lint` to pass
- **Browser**: Chromium only (as per project guidelines)
- **Command**: `npm run test:e2e`
- **Artifacts**:
  - Playwright HTML report (retained for 14 days, uploaded always)
  - Test traces (retained for 7 days, uploaded on failure only)
- **When it fails**: 
  - Download the Playwright report artifact
  - Download test traces if available
  - Review screenshots and videos of failures

#### 4. Build (`build`)

- **Purpose**: Validates production build
- **Runtime**: ~2-4 minutes
- **Dependencies**: Requires both `unit-tests` and `e2e-tests` to pass
- **Command**: `npm run build`
- **Artifacts**: Production build in `dist/` (retained for 7 days)
- **When it fails**: Check build errors in the logs (usually TypeScript errors or missing dependencies)

## Key Features

### 1. Node.js Version Management

- Uses `.nvmrc` file to ensure consistent Node.js version (22.14.0)
- Configured via `node-version-file: '.nvmrc'`

### 2. Dependency Caching

- npm dependencies are cached automatically
- Speeds up subsequent workflow runs
- Configured via `cache: 'npm'`

### 3. Concurrency Control

- Only one workflow run per branch at a time
- New pushes cancel in-progress runs
- Saves CI minutes and provides faster feedback

### 4. Artifact Retention

| Artifact | Retention | When Uploaded |
|----------|-----------|---------------|
| Coverage reports | 14 days | Always |
| Playwright report | 14 days | Always |
| Test traces | 7 days | On failure only |
| Production build | 7 days | Always |

### 5. Job Dependencies

Jobs run in parallel when possible:
- `lint` runs first
- `unit-tests` and `e2e-tests` run in parallel after `lint`
- `build` only runs if both test jobs pass

## Environment Variables

### Required for E2E Tests

The E2E tests require specific environment variables. These are loaded from `.env.test` file (not tracked in git):

- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for cleanup)
- `OPENROUTER_API_KEY` - OpenRouter API key for AI generation
- `BASE_URL` - Application base URL (defaults to http://localhost:3000)

**Note**: For CI/CD to run E2E tests, these need to be configured as GitHub Secrets.

## Manual Trigger

To run the workflow manually:

1. Go to GitHub → Actions tab
2. Select "CI/CD Pipeline" workflow
3. Click "Run workflow" button
4. Select the `master` branch
5. Click "Run workflow"

## Viewing Results

### Success ✅

All jobs will show green checkmarks. The production build artifact will be available for download.

### Failure ❌

1. Click on the failed job to see logs
2. For test failures:
   - Download the relevant artifact (coverage, playwright report, traces)
   - Review the HTML reports locally
3. Fix the issues and push again (or re-run if it's a flaky test)

## Best Practices

1. **Always run tests locally first**: `npm run lint && npm test -- --run && npm run test:e2e`
2. **Check coverage locally**: `npm run test:coverage`
3. **Don't skip linting**: Fix lint errors before pushing
4. **Review artifacts**: Download and review test reports when debugging failures
5. **Keep .nvmrc updated**: Ensure local Node.js version matches CI

## Troubleshooting

### Workflow doesn't trigger

- Ensure you're pushing to `master` branch
- Check if there are any branch protection rules
- Verify the workflow file is in `.github/workflows/` directory

### Tests pass locally but fail in CI

- Check Node.js version match (local vs. CI)
- Verify all environment variables are set
- Look for timing issues in E2E tests (CI may be slower)
- Check for missing dependencies in `package.json`

### Out of CI minutes

- GitHub Free tier: 2,000 minutes/month
- Optimize test runtime
- Consider reducing E2E test coverage
- Use concurrency control to cancel redundant runs

## Future Enhancements

Potential improvements for the CI/CD pipeline:

1. **Security scanning**: Add OWASP ZAP, CodeQL, npm audit
2. **Performance testing**: Add k6 load tests
3. **Accessibility testing**: Add axe-core and Lighthouse
4. **Deployment**: Auto-deploy to DigitalOcean on master
5. **Notifications**: Slack/Discord notifications on failure
6. **Code coverage badges**: Add coverage badge to README
7. **Dependabot**: Automated dependency updates
8. **Staging environment**: Deploy to staging before production

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Project Testing Guide](../../TESTING.md)

