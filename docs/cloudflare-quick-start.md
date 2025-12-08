# Cloudflare Pages - Quick Start Guide

A quick reference for setting up Cloudflare Pages deployment for 10xCards.

## Prerequisites Checklist

- [ ] Cloudflare account created
- [ ] Cloudflare Pages project created
- [ ] Cloudflare API token generated
- [ ] Cloudflare Account ID copied
- [ ] All environment variables ready

## Step-by-Step Setup

### 1. Create Cloudflare Pages Project (5 minutes)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Create application** → **Pages**
3. Choose **Direct Upload** (GitHub Actions will handle deployment)
4. Enter project name (e.g., `10xcards`) - **Remember this name!**
5. Click **Create project**
6. Skip the initial upload - GitHub Actions will deploy

**Important:** Write down the exact project name you chose. You'll need it in the next steps.

### 2. Generate API Token (2 minutes)

1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Edit Cloudflare Workers** template
4. Modify permissions:
   - Account → Cloudflare Pages → Edit
5. Click **Continue to summary** → **Create Token**
6. **Copy the token** (you won't see it again!)

### 3. Get Account ID (1 minute)

1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Look for **Account ID** in the right sidebar
3. Click to copy

### 4. Configure GitHub Secrets (5 minutes)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **Environments** (in left sidebar) → **production** → **Add secret**
4. Add each secret one by one:

| Secret Name               | Where to Find It                                 | Example Value                |
| ------------------------- | ------------------------------------------------ | ---------------------------- |
| `CLOUDFLARE_API_TOKEN`    | From step 2 (API token you generated)            | `abc123...`                  |
| `CLOUDFLARE_ACCOUNT_ID`   | From step 3 (in Cloudflare dashboard)            | `1234567890abcdef`           |
| `CLOUDFLARE_PROJECT_NAME` | **From step 1** (exact project name you created) | `10xcards`                   |
| `SUPABASE_URL`            | Your Supabase project settings                   | `https://xxx.supabase.co`    |
| `SUPABASE_KEY`            | Your Supabase project API settings               | `eyJhbGc...`                 |
| `OPENROUTER_API_KEY`      | Your OpenRouter dashboard                        | `sk-or-v1-...`               |
| `PUBLIC_SITE_URL`         | Your Pages URL (project-name.pages.dev)          | `https://10xcards.pages.dev` |

**⚠️ Important:** `CLOUDFLARE_PROJECT_NAME` must exactly match the project name from step 1!

### 5. Configure Cloudflare Environment Variables (3 minutes)

1. Go to your Pages project → **Settings** → **Environment variables**
2. Select **Production** tab
3. Add variables:

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-key>
OPENROUTER_API_KEY=<your-openrouter-key>
PUBLIC_SITE_URL=https://10xcards.pages.dev
```

### 6. Deploy! (1 minute)

Push to master branch:

```bash
git add .
git commit -m "Configure Cloudflare deployment"
git push origin master
```

Watch the deployment in GitHub Actions!

## Verification Steps

After deployment completes:

1. ✅ Check GitHub Actions workflow passed
2. ✅ Check Cloudflare Pages shows successful deployment
3. ✅ Visit your site URL
4. ✅ Test login/signup
5. ✅ Test flashcard creation
6. ✅ Test AI generation

## Quick Troubleshooting

### "Project not found" Error

**Error:** `Project not found. The specified project name does not match any of your existing projects.`

**Solution:**

1. Go to Cloudflare Dashboard → Workers & Pages
2. Find your actual project name (it might be different than you think!)
3. Update the `CLOUDFLARE_PROJECT_NAME` secret in GitHub with the **exact** name
4. Common issues:
   - Case sensitivity: `10xCards` vs `10xcards`
   - Hyphens: `10x-cards` vs `10xcards`
   - Typos in the secret value

**How to verify your project name:**

```bash
# If you have the API token set locally:
export CLOUDFLARE_API_TOKEN="your-token"
./scripts/list-cloudflare-projects.sh
```

### Build Failed

- Check GitHub Actions logs
- Verify all secrets are set
- Run `npm run build` locally

### Deployment Failed

- Verify `CLOUDFLARE_API_TOKEN` is correct
- Verify `CLOUDFLARE_ACCOUNT_ID` is correct
- Verify `CLOUDFLARE_PROJECT_NAME` matches your project

### Site Not Working

- Check Cloudflare Pages logs
- Verify environment variables in Cloudflare
- Check Supabase and OpenRouter keys are valid

## Common Commands

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
npm run test:coverage

# Lint code
npm run lint
```

## URLs to Bookmark

- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [GitHub Actions](https://github.com/your-org/10xCards/actions)
- [Supabase Dashboard](https://app.supabase.com)
- [OpenRouter Dashboard](https://openrouter.ai/dashboard)

## Support

For detailed information, see:

- `docs/cloudflare-deployment.md` - Full deployment guide
- `DEPLOYMENT_CHANGES.md` - Summary of changes made

---

**Total Setup Time**: ~15-20 minutes
