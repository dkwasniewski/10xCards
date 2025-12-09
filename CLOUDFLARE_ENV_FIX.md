# Fix for PGRST205 Error - Cloudflare Environment Variables

## Problem

Error: `PGRST205: Could not find the table 'public.flashcards' in the schema cache`

This error occurs because the Cloudflare Pages deployment is either:

1. Not connecting to the correct Supabase project
2. Missing environment variables for runtime access

## Solution

### Step 1: Configure Environment Variables in Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Select your **10xcards** project
4. Go to **Settings** → **Environment variables**
5. Add the following variables for **Production**:

| Variable Name        | Value                                | Where to find it                            |
| -------------------- | ------------------------------------ | ------------------------------------------- |
| `SUPABASE_URL`       | `https://[your-project].supabase.co` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_KEY`       | `eyJhbGc...` (anon/public key)       | Supabase Dashboard → Project Settings → API |
| `OPENROUTER_API_KEY` | `sk-or-v1-...`                       | OpenRouter Dashboard                        |
| `PUBLIC_SITE_URL`    | `https://10xcards-19y.pages.dev`     | Your Cloudflare Pages URL                   |

### Step 2: Verify Your Supabase Project

Make sure you're using the **correct Supabase project** that has the flashcards table:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Table Editor**
4. Verify that the `flashcards` table exists
5. Copy the **Project URL** and **anon key** from **Project Settings → API**

### Step 3: Redeploy

After setting the environment variables in Cloudflare:

1. Make a small change to your code (or trigger a redeploy)
2. Push to master branch
3. Wait for the deployment to complete
4. Test the My Flashcards page again

### Step 4: Verify the Fix

1. Visit your production site: `https://10xcards-19y.pages.dev`
2. Log in
3. Navigate to "My Flashcards"
4. You should now see the empty state message instead of an error

## Alternative: Check if Using Wrong Supabase Project

If you have multiple Supabase projects, make sure you're using the one with your migrations:

```bash
# Check your local .env file
cat .env

# Compare with GitHub Secrets
# Go to: https://github.com/[your-username]/10xCards/settings/secrets/actions

# Compare with Cloudflare Pages
# Go to: https://dash.cloudflare.com → Workers & Pages → 10xcards → Settings → Environment variables
```

All three should point to the **same Supabase project**.

## How to Refresh Supabase Schema Cache (if needed)

If the environment variables are correct but you still get the error:

1. Go to Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Click **Refresh schema cache** (if available)

Or run this SQL in the SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

## Verification Checklist

- [ ] Environment variables set in Cloudflare Pages
- [ ] SUPABASE_URL points to correct project
- [ ] SUPABASE_KEY is the anon/public key (not service_role)
- [ ] Flashcards table exists in the Supabase project
- [ ] Redeployed after setting variables
- [ ] Tested on production site

## Additional Notes

- The GitHub Secrets are used during **build time** by GitHub Actions
- The Cloudflare environment variables are used at **runtime** by your application
- Both need to be set and point to the same Supabase project
