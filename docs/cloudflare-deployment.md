# Cloudflare Pages Deployment Guide

This document describes how the 10xCards application is deployed to Cloudflare Pages using GitHub Actions.

## Overview

The application uses Cloudflare Pages for hosting with the following setup:

- **Adapter**: `@astrojs/cloudflare` (SSR support)
- **CI/CD**: GitHub Actions workflow (`master.yml`)
- **Deployment**: Automated on push to `master` branch

## Prerequisites

Before deploying to Cloudflare Pages, ensure you have:

1. **Cloudflare Account**: Create an account at [cloudflare.com](https://cloudflare.com)
2. **Cloudflare Pages Project**: Create a new Pages project in your Cloudflare dashboard
3. **API Token**: Generate an API token with Pages permissions
4. **Account ID**: Find your Account ID in the Cloudflare dashboard

## Required GitHub Secrets

Configure the following secrets in your GitHub repository under Settings → Secrets and variables → Actions → Secrets:

### Production Environment Secrets

Create a `production` environment in GitHub and add these secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages permissions | `abc123...` |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | `1234567890abcdef` |
| `CLOUDFLARE_PROJECT_NAME` | Name of your Cloudflare Pages project | `10xcards` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Your Supabase anon/public key | `eyJhbGc...` |
| `OPENROUTER_API_KEY` | Your OpenRouter API key | `sk-or-v1-...` |
| `PUBLIC_SITE_URL` | Your production site URL | `https://10xcards.pages.dev` |

## Cloudflare Configuration

### 1. Create Cloudflare Pages Project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Create application** → **Pages**
3. Choose **Connect to Git** or **Direct Upload**
4. If using Git, select your repository and configure:
   - **Production branch**: `master`
   - **Build command**: Leave empty (handled by GitHub Actions)
   - **Build output directory**: `dist`
   - **Framework preset**: None (custom)

### 2. Generate API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Edit Cloudflare Workers** template or create custom token with:
   - **Permissions**: Account → Cloudflare Pages → Edit
   - **Account Resources**: Include → Your account
4. Copy the generated token and add it to GitHub Secrets as `CLOUDFLARE_API_TOKEN`

### 3. Get Account ID

1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Your Account ID is displayed in the right sidebar
3. Copy it and add to GitHub Secrets as `CLOUDFLARE_ACCOUNT_ID`

## Environment Variables in Cloudflare

Configure runtime environment variables in Cloudflare Pages:

1. Go to your Pages project → **Settings** → **Environment variables**
2. Add the following variables for **Production**:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `SUPABASE_URL` | Your Supabase URL | Same as GitHub secret |
| `SUPABASE_KEY` | Your Supabase key | Same as GitHub secret |
| `OPENROUTER_API_KEY` | Your OpenRouter key | Same as GitHub secret |
| `PUBLIC_SITE_URL` | Your site URL | Same as GitHub secret |

> **Note**: While GitHub Actions passes these as build-time variables, Cloudflare Pages also needs them configured for runtime access.

## Deployment Workflow

The `master.yml` workflow runs automatically when code is pushed to the `master` branch:

### Workflow Steps

1. **Lint**: Runs ESLint to check code quality
2. **Unit Tests**: Runs Vitest tests with coverage
3. **Build**: Builds the Astro application for production
4. **Deploy**: Deploys to Cloudflare Pages using Wrangler
5. **Status**: Creates a deployment summary

### Workflow Jobs

```yaml
lint → [unit-tests, build] → deploy → deployment-status
```

- Jobs run in parallel where possible to minimize CI time
- E2E tests are **not** run in the master workflow (only in PR workflow)
- Deployment only proceeds if all previous jobs succeed

## Local Development

To test the Cloudflare adapter locally:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview the build
npm run preview
```

## Troubleshooting

### Build Failures

If the build fails in GitHub Actions:

1. Check the build logs in the Actions tab
2. Verify all environment variables are set correctly
3. Test the build locally: `npm run build`
4. Check for TypeScript or linting errors: `npm run lint`

**Common Issue: "Cannot find module '@astrojs/cloudflare'"**

This happens if `@astrojs/cloudflare` is in `devDependencies` instead of `dependencies`. The adapter must be in `dependencies` because it's required at build time in CI/CD.

**Fix:**
```bash
npm install @astrojs/cloudflare --save-prod
```

Or manually move it from `devDependencies` to `dependencies` in `package.json`.

### Deployment Failures

If deployment fails:

1. Verify `CLOUDFLARE_API_TOKEN` has correct permissions
2. Verify `CLOUDFLARE_ACCOUNT_ID` is correct
3. Verify `CLOUDFLARE_PROJECT_NAME` matches your Pages project
4. Check Cloudflare Pages dashboard for deployment logs

### Runtime Errors

If the deployed app has runtime errors:

1. Check Cloudflare Pages logs in the dashboard
2. Verify environment variables are set in Cloudflare Pages settings
3. Check Supabase and OpenRouter API keys are valid
4. Verify `PUBLIC_SITE_URL` matches your actual deployment URL

## Rollback

To rollback to a previous deployment:

1. Go to Cloudflare Dashboard → Your Pages project → **Deployments**
2. Find the previous successful deployment
3. Click **...** → **Rollback to this deployment**

Alternatively, revert the commit in Git and push to `master`:

```bash
git revert <commit-hash>
git push origin master
```

## Custom Domains

To add a custom domain:

1. Go to your Pages project → **Custom domains**
2. Click **Set up a custom domain**
3. Follow the instructions to add DNS records
4. Update `PUBLIC_SITE_URL` secret to use your custom domain

## Performance Optimization

Cloudflare Pages provides:

- **Global CDN**: Automatic edge caching
- **HTTP/3**: Enabled by default
- **Brotli Compression**: Automatic
- **Smart Routing**: Optimized routing through Argo

No additional configuration needed for basic optimization.

## Security

### Best Practices

1. **Never commit secrets**: Use GitHub Secrets and Cloudflare environment variables
2. **Rotate API tokens**: Regularly rotate your Cloudflare API token
3. **Use environment protection**: Require approvals for production deployments
4. **Monitor logs**: Regularly check Cloudflare Pages logs for suspicious activity

### Content Security Policy

Configure CSP headers in `astro.config.mjs` if needed:

```javascript
export default defineConfig({
  // ... other config
  server: {
    headers: {
      "Content-Security-Policy": "default-src 'self'; ..."
    }
  }
});
```

## Monitoring

Monitor your deployment:

1. **Cloudflare Analytics**: Built-in analytics in Pages dashboard
2. **GitHub Actions**: Check workflow runs for build/deploy status
3. **Supabase Dashboard**: Monitor database and auth usage
4. **OpenRouter Dashboard**: Monitor API usage and costs

## Cost Estimation

### Cloudflare Pages

- **Free Tier**: 500 builds/month, unlimited requests
- **Paid Tier**: $20/month for unlimited builds + $0.50 per additional 1M requests

### Estimated Monthly Costs

For a typical small-to-medium app:

- **Cloudflare Pages**: $0-20/month
- **Supabase**: $0-25/month (free tier covers MVP)
- **OpenRouter**: Variable based on usage

## Support

For issues:

- **Cloudflare**: [Cloudflare Community](https://community.cloudflare.com/)
- **Astro**: [Astro Discord](https://astro.build/chat)
- **GitHub Actions**: [GitHub Docs](https://docs.github.com/actions)

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Documentation](https://docs.github.com/actions)

