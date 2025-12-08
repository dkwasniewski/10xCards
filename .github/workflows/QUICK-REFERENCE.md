# Pull Request Workflow - Quick Reference

## 🚀 Quick Start

### 1. Setup (One-time)

```bash
# Go to GitHub Settings → Environments → New environment
# Name: integration
# Add these 6 secrets:
```

| Secret               | Example Value             |
| -------------------- | ------------------------- |
| `SUPABASE_URL`       | `https://xxx.supabase.co` |
| `SUPABASE_KEY`       | `eyJhbGc...`              |
| `OPENROUTER_API_KEY` | `sk-or-v1-...`            |
| `PUBLIC_SITE_URL`    | `http://localhost:3000`   |
| `E2E_EMAIL`          | `test@test.com`           |
| `E2E_PASSWORD`       | `10xCardsE2E`             |

### 2. Usage

```bash
# Create a PR to master → Workflow runs automatically
```

---

## 📊 Workflow Overview

```
Lint (30s) → Unit Tests (2m) ∥ E2E Tests (5m) → Comment (10s)
Total: ~5-7 minutes
```

### Jobs

| Job            | Duration | Runs When  | Uploads         |
| -------------- | -------- | ---------- | --------------- |
| **Lint**       | 30s      | Always     | -               |
| **Unit Tests** | 1-2m     | After lint | Coverage        |
| **E2E Tests**  | 3-5m     | After lint | Reports, traces |
| **Comment**    | 10s      | All pass   | -               |

---

## 🎯 Key Features

- ✅ **Parallel Testing** - Unit & E2E run simultaneously
- ✅ **Coverage Tracking** - Displayed in PR comment
- ✅ **Smart Concurrency** - Cancels old runs
- ✅ **Secure Secrets** - GitHub Environment
- ✅ **Auto Comments** - Success summary posted to PR

---

## 📦 Artifacts (7-day retention)

| Artifact             | Content         | When       |
| -------------------- | --------------- | ---------- |
| `unit-test-coverage` | Vitest coverage | Always     |
| `playwright-report`  | E2E HTML report | Always     |
| `playwright-traces`  | Debug traces    | On failure |

---

## 🔧 Troubleshooting

### E2E Tests Fail

```bash
# 1. Download playwright-traces artifact
# 2. Open trace viewer
npx playwright show-trace trace.zip
```

### Coverage Not Showing

```bash
# Check coverage-summary.json exists
cat coverage/coverage-summary.json
```

### Environment Not Found

```bash
# Verify environment exists in GitHub Settings → Environments
# Verify all 6 secrets are configured
```

---

## 📝 Files

| File                       | Purpose            |
| -------------------------- | ------------------ |
| `pull-request.yml`         | Main workflow      |
| `PULL-REQUEST-WORKFLOW.md` | Full documentation |
| `PULL-REQUEST-DIAGRAM.md`  | Visual diagrams    |
| `PULL-REQUEST-SETUP.md`    | Setup guide        |
| `QUICK-REFERENCE.md`       | This file          |

---

## 🎓 Common Commands

```bash
# Run tests locally
npm run lint
npm run test:coverage -- --run
npm run test:e2e

# Check workflow syntax (optional)
# Install actionlint: brew install actionlint
actionlint .github/workflows/pull-request.yml

# View workflow runs
# Go to: https://github.com/YOUR_REPO/actions
```

---

## 📈 Performance

| Metric        | Value                     |
| ------------- | ------------------------- |
| Total Time    | 5-7 minutes               |
| Time Saved    | 2-3 minutes vs sequential |
| Parallel Jobs | 2 (unit + e2e)            |
| Artifact Size | ~10-50 MB                 |

---

## 🔒 Security

- ✅ Secrets in GitHub Environment (not in code)
- ✅ Minimal permissions (`pull-requests: write`)
- ✅ No write access to code
- ✅ Audit logs available

---

## 📞 Need Help?

1. Check **PULL-REQUEST-WORKFLOW.md** for detailed docs
2. Check **PULL-REQUEST-DIAGRAM.md** for visual guides
3. Check **PULL-REQUEST-SETUP.md** for setup instructions
4. Check GitHub Actions logs for error details

---

**Last Updated:** December 8, 2025  
**Workflow Version:** 1.0
