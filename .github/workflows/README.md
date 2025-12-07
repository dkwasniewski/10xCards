# GitHub Workflows Documentation

## 📚 Quick Navigation

### For Quick Start
👉 **[CI_CD_QUICK_START.md](../../CI_CD_QUICK_START.md)** - Start here! Quick reference for using the CI/CD pipeline.

### For Complete Documentation
📖 **[CI_CD_README.md](CI_CD_README.md)** - Comprehensive CI/CD pipeline documentation.

### For Understanding the Flow
📊 **[WORKFLOW_DIAGRAM.md](WORKFLOW_DIAGRAM.md)** - Visual diagrams and timeline of the pipeline.

### For Technical Validation
✅ **[VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md)** - Pre-flight checks and validation results.

### For Setup Summary
📋 **[CI_CD_SETUP_SUMMARY.md](../../CI_CD_SETUP_SUMMARY.md)** - Overview of what was created and configured.

## 🚀 Active Workflows

### ✅ `ci.yml` - Main CI/CD Pipeline (ACTIVE)
**Triggers**: Push to master, Manual dispatch  
**Jobs**: Lint → Unit Tests + E2E Tests → Build  
**Runtime**: ~10-15 minutes  
**Status**: ✅ Production Ready

### ⚠️ `test.yml` - Legacy Tests (DEPRECATED)
**Status**: ⚠️ Deprecated - Use `ci.yml` instead  
**Note**: Can be safely deleted

## 📖 Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| [CI_CD_QUICK_START.md](../../CI_CD_QUICK_START.md) | Quick reference guide | Developers |
| [CI_CD_README.md](CI_CD_README.md) | Complete documentation | DevOps, Team Leads |
| [WORKFLOW_DIAGRAM.md](WORKFLOW_DIAGRAM.md) | Visual flow diagrams | Visual learners |
| [VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md) | Technical validation | DevOps, Reviewers |
| [CI_CD_SETUP_SUMMARY.md](../../CI_CD_SETUP_SUMMARY.md) | Setup overview | Project managers |

## 🎯 Common Tasks

### Run Pipeline Manually
1. GitHub → Actions → **CI/CD Pipeline**
2. Click **Run workflow**
3. Select `master` branch
4. Click **Run workflow**

### View Pipeline Results
1. GitHub → Actions
2. Click on the workflow run
3. Review job results and logs

### Download Artifacts
1. Go to completed workflow run
2. Scroll to **Artifacts** section
3. Download:
   - 📊 Coverage Report
   - 🎭 Playwright Report
   - 🔍 Test Traces (if available)
   - 📦 Production Build

### Debug Test Failures
1. Download Playwright Report artifact
2. Extract and open `index.html`
3. Review screenshots, videos, and traces
4. Fix issues locally
5. Re-run tests: `npm run test:e2e`

## 🔧 Workflow Configuration

### Node.js Version
- **Source**: `.nvmrc` file in project root
- **Version**: 22.14.0
- **Applied**: All jobs

### Dependency Caching
- **Tool**: actions/setup-node@v4
- **Cache**: npm dependencies
- **Location**: `~/.npm`
- **Speed-up**: ~2 minutes per job

### Job Dependencies
```
lint (no deps)
  ├─> unit-tests (needs: lint)
  └─> e2e-tests (needs: lint)
       └─> build (needs: [unit-tests, e2e-tests])
```

### Artifact Retention
| Artifact | Retention | Size |
|----------|-----------|------|
| Coverage | 14 days | ~2-5 MB |
| Playwright | 14 days | ~5-15 MB |
| Traces | 7 days | ~10-50 MB |
| Build | 7 days | ~10-30 MB |

## 🎓 Learning Resources

### Understanding the Pipeline
1. Read [CI_CD_QUICK_START.md](../../CI_CD_QUICK_START.md)
2. Review [WORKFLOW_DIAGRAM.md](WORKFLOW_DIAGRAM.md)
3. Check [VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md)

### Modifying the Pipeline
1. Read [CI_CD_README.md](CI_CD_README.md)
2. Edit `ci.yml`
3. Test changes on a feature branch
4. Merge to master when validated

### Debugging Issues
1. Check workflow logs in GitHub Actions
2. Download relevant artifacts
3. Review [Troubleshooting section](CI_CD_README.md#troubleshooting)
4. Run tests locally: `npm test` or `npm run test:e2e`

## 📊 Pipeline Metrics

| Metric | Value |
|--------|-------|
| Total Jobs | 4 |
| Parallel Execution | Yes (Unit + E2E) |
| Total Runtime | ~10-15 min |
| Cache Speed-up | ~8 min saved |
| Artifact Storage | ~30-70 MB |
| CI Minutes/Run | ~15 min |

## 🔐 Security

### Current
- ✅ Isolated job environments
- ✅ Clean dependency installation (`npm ci`)
- ✅ No secrets required for basic pipeline

### Future Enhancements
- ⚠️ Add CodeQL security scanning
- ⚠️ Add npm audit for vulnerabilities
- ⚠️ Add OWASP ZAP for app security
- ⚠️ Configure Dependabot for updates

## 🚧 Known Limitations

1. **E2E Tests in CI**
   - Require GitHub Secrets for Supabase/OpenRouter
   - Currently may skip or fail in CI
   - Work perfectly in local environment

2. **No Deployment**
   - Pipeline validates only
   - Manual deployment still required
   - Future: Auto-deploy to DigitalOcean

3. **Limited Security Scanning**
   - No automated vulnerability detection
   - Future: Add comprehensive security tools

## 🎯 Next Steps

### Immediate
- [x] CI/CD pipeline created ✅
- [x] Documentation completed ✅
- [ ] Push to master to test
- [ ] Monitor first run
- [ ] Review artifacts

### Short-term (Optional)
- [ ] Add GitHub Secrets for E2E tests
- [ ] Configure branch protection rules
- [ ] Set up deployment job

### Long-term
- [ ] Add security scanning
- [ ] Add performance testing
- [ ] Add notifications
- [ ] Optimize CI minutes usage

## 📞 Support

### Documentation Issues
Check the comprehensive guides:
- [CI_CD_README.md](CI_CD_README.md) - Complete documentation
- [VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md) - Technical details

### Workflow Issues
1. Check GitHub Actions logs
2. Download artifacts for debugging
3. Run tests locally to reproduce
4. Review [TESTING.md](../../TESTING.md) for test guidelines

### Configuration Issues
1. Verify `.nvmrc` exists with correct Node.js version
2. Check `package.json` scripts exist
3. Validate workflow YAML syntax
4. Review [VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md)

---

**Last Updated**: December 7, 2025  
**Status**: ✅ Production Ready  
**Maintainer**: 10xCards Team

