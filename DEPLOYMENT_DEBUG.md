# Deployment Debugging Guide

## Current Issue: Project Not Found

The GitHub Actions workflow is failing with:
```
Project not found. The specified project name does not match any of your existing projects. [code: 8000007]
```

## Steps to Debug

### 1. Verify Your Cloudflare Project Name

Run this command locally to list all your Cloudflare Pages projects:

```bash
# Set your API token (use the one from GitHub secrets)
export CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"

# List all projects
npx wrangler pages project list
```

**Expected output:**
```
📋 Listing your Cloudflare Pages projects...

cards
  Production: https://cards.pages.dev
  Created: 2025-12-08
```

### 2. Check GitHub Secret

1. Go to GitHub → Settings → Secrets and variables → Actions
2. Click Environments → production
3. Verify `CLOUDFLARE_PROJECT_NAME` is set to the **exact** name from step 1

### 3. Common Issues

| Issue | Solution |
|-------|----------|
| Project name has typo | Update GitHub secret with correct name |
| Project doesn't exist | Create project in Cloudflare Dashboard |
| Wrong account | Verify `CLOUDFLARE_ACCOUNT_ID` matches the account where project exists |
| API token wrong account | Regenerate token for the correct account |

### 4. Test Deployment Locally

```bash
# Set environment variables
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Build the project
npm run build

# Test deployment
npx wrangler pages deploy dist --project-name=cards
```

If this works locally but fails in GitHub Actions, the issue is with your GitHub secrets.

### 5. Verify Account ID

Make sure your `CLOUDFLARE_ACCOUNT_ID` is correct:

1. Go to Cloudflare Dashboard
2. Click Workers & Pages
3. Look for "Account ID" in the right sidebar
4. Copy and verify it matches your GitHub secret

### 6. Create Project if Missing

If the project doesn't exist:

```bash
# Create a new Pages project
npx wrangler pages project create cards
```

Or via Cloudflare Dashboard:
1. Workers & Pages → Create application → Pages
2. Choose Direct Upload
3. Name: `cards`
4. Create project

---

## Current Temporary Fix

The workflow has been temporarily updated to hardcode `project-name=cards` to test if the issue is with the secret or the project itself.

If this works, the issue was with the GitHub secret value.
If this fails, the issue is with the project name or it doesn't exist.

---

## Checklist

- [ ] Verified project exists in Cloudflare Dashboard
- [ ] Verified project name is exactly `cards`
- [ ] Updated `CLOUDFLARE_PROJECT_NAME` secret in GitHub
- [ ] Verified `CLOUDFLARE_ACCOUNT_ID` is correct
- [ ] Verified `CLOUDFLARE_API_TOKEN` has Pages permissions
- [ ] Tested deployment with hardcoded project name
- [ ] Reverted to using secret after successful test

