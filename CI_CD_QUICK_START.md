# CI/CD Quick Start Guide

## Overview

Your 10xCards project now has a complete CI/CD pipeline that automatically runs:

1. ✅ **Linting** - Code quality checks
2. ✅ **Unit Tests** - Vitest tests with coverage
3. ✅ **E2E Tests** - Playwright tests
4. ✅ **Production Build** - Validates build works

## How to Use

### Automatic Runs

The pipeline runs automatically on every push to `master`:

```bash
git add .
git commit -m "Your changes"
git push origin master
```

Then visit: **GitHub → Actions** to see the workflow running.

### Manual Runs

1. Go to **GitHub → Actions**
2. Click **CI/CD Pipeline** workflow
3. Click **Run workflow** button
4. Select `master` branch
5. Click **Run workflow**

## Workflow Structure

```
┌─────────────┐
│    LINT     │  (~1-2 min)
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│UNIT │ │ E2E │  (~2-3 min / ~5-10 min)
│TEST │ │TEST │
└──┬──┘ └──┬──┘
   │       │
   └───┬───┘
       │
   ┌───▼───┐
   │ BUILD │  (~2-4 min)
   └───────┘
```

**Total Runtime**: ~10-15 minutes

## What Runs

| Job | Command | When it Fails |
|-----|---------|---------------|
| **Lint** | `npm run lint` | Fix ESLint errors |
| **Unit Tests** | `npm test -- --run` | Fix test failures |
| **E2E Tests** | `npm run test:e2e` | Download playwright-report artifact |
| **Build** | `npm run build` | Fix TypeScript/build errors |

## Before Pushing

Always run locally first:

```bash
# Quick check
npm run lint && npm test -- --run

# Full CI simulation
npm run lint && \
npm test -- --run && \
npm run test:coverage -- --run && \
npm run test:e2e && \
npm run build
```

## Node.js Version

- **CI uses**: Node.js 22.14.0 (from `.nvmrc`)
- **Ensure local matches**: `nvm use` or check `node -v`

## Key Features

✅ **Runs in parallel** - Unit and E2E tests run simultaneously  
✅ **Artifact uploads** - Test reports and traces saved  
✅ **Smart caching** - npm dependencies cached  
✅ **Auto-cancel** - New runs cancel old ones  
✅ **Manual trigger** - Run anytime via GitHub UI  

## Artifacts Available

After each run, download these from GitHub Actions:

- 📊 **Coverage Report** - HTML coverage report (14 days)
- 🎭 **Playwright Report** - E2E test results (14 days)
- 🔍 **Test Traces** - Debugging info on failures (7 days)
- 📦 **Production Build** - Built `dist/` folder (7 days)

## Configuration Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Main CI/CD workflow |
| `.nvmrc` | Node.js version (22.14.0) |
| `vitest.config.ts` | Unit test configuration |
| `playwright.config.ts` | E2E test configuration |
| `package.json` | Scripts and dependencies |

## Environment Variables for E2E

E2E tests need these variables (from `.env.test`):

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `BASE_URL`

**Note**: For CI/CD to work, add these as **GitHub Secrets** if you want to run E2E tests in CI.

## Troubleshooting

### Pipeline doesn't start
- ✅ Pushed to `master` branch?
- ✅ Workflow file in `.github/workflows/`?

### Tests fail in CI but pass locally
- ✅ Same Node.js version? (`node -v` vs `.nvmrc`)
- ✅ All dependencies in `package.json`?
- ✅ Environment variables set?

### E2E tests timeout
- ✅ Check if Supabase credentials are valid
- ✅ Verify OpenRouter API key works
- ✅ Review test traces artifact

### Build fails
- ✅ Run `npm run build` locally first
- ✅ Check TypeScript errors
- ✅ Verify all imports exist

## Next Steps

1. **Push to master** - Workflow runs automatically
2. **Monitor GitHub Actions** - Watch the pipeline
3. **Fix any failures** - Download artifacts for debugging
4. **Celebrate** 🎉 - When all checks pass!

## Full Documentation

For detailed information, see [CI/CD README](.github/workflows/CI_CD_README.md)

## Deployment (Future)

Currently, the workflow only validates code. Future enhancements:

- ✨ Auto-deploy to DigitalOcean App Platform
- ✨ Staging environment deployment
- ✨ Security scanning (CodeQL, OWASP ZAP)
- ✨ Performance testing (k6)
- ✨ Slack/Discord notifications

---

**Need help?** Check [TESTING.md](TESTING.md) for testing guidelines.

