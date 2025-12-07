# Environment Configuration Guide

## 🎯 Current Setup (December 2025)

Your environment is now configured so that **`npm run dev` uses LOCAL Supabase** by default.

---

## 📁 Environment Files

| File | Purpose | Supabase | Git | Used By |
|------|---------|----------|-----|---------|
| **`.env`** | 🏠 Local development | Local (127.0.0.1) | ❌ Ignored | `npm run dev` |
| **`.env.remote`** | ☁️ Remote development | Remote (cloud) | ❌ Ignored | Manual switching |
| **`.env.test`** | 🧪 E2E testing | Remote (cloud) | ❌ Ignored | `npm run test:e2e` |
| **`.env.example`** | 📝 Template | Local (example) | ✅ Committed | New developers |

### Additional Files (Backups)
- `.env.remote.backup` - Backup of remote config (gitignored)

---

## 🚀 How to Use

### Default: Local Development (Current Setup)

```bash
npm run dev
```

**Uses:** `.env` with **local Supabase** (`http://127.0.0.1:54321`)

**Requirements:**
- Local Supabase must be running: `supabase start`
- All data is local to your machine
- Perfect for development without affecting production data

---

### Switch to Remote Supabase

If you need to use remote Supabase temporarily:

**Option 1: Temporary Switch**
```bash
# Use remote for this session only
mv .env .env.local.disabled
mv .env.remote .env.local

# Run dev with remote Supabase
npm run dev

# Switch back to local
mv .env.local .env.remote
mv .env.local.disabled .env
```

**Option 2: Environment Variable Override**
```bash
# Override just the Supabase URL
SUPABASE_URL=https://imqdgswlhuzufrfsxouw.supabase.co npm run dev
```

**Option 3: Create `.env.local`** (highest priority)
```bash
# Copy remote config to .env.local (Astro will prioritize this)
cp .env.remote .env.local

# Run dev - will use .env.local automatically
npm run dev

# Remove when done to go back to local
rm .env.local
```

---

## 🧪 E2E Testing

```bash
npm run test:e2e
```

**Uses:** `.env.test` with **remote Supabase**

Playwright is configured to load `.env.test` automatically (see `playwright.config.ts`).

---

## 📋 Environment Variables Reference

### Required Variables (in all files)

```bash
# Supabase Configuration
SUPABASE_URL=<url>           # http://127.0.0.1:54321 (local) OR https://xxx.supabase.co (remote)
SUPABASE_KEY=<anon-key>      # Different for local vs remote

# OpenRouter API
OPENROUTER_API_KEY=<key>     # Same in all environments

# Site URL
PUBLIC_SITE_URL=<url>        # http://localhost:3000 for local dev
```

### E2E Testing Variables (only in `.env.test`)

```bash
# E2E Test User
E2E_EMAIL=test@test.com
E2E_PASSWORD=10xCardsE2E
```

---

## 🔄 Astro Environment Loading Order

Astro loads environment files in this priority (highest first):

### Development Mode (`npm run dev`)
1. `.env.development.local` (if exists)
2. **`.env.local`** (if exists) ← Create this to override `.env`
3. `.env.development` (if exists)
4. **`.env`** ← Your default (local Supabase)

### Production Mode (`npm run build`)
1. `.env.production.local` (if exists)
2. `.env.local` (if exists)
3. `.env.production` (if exists)
4. `.env`

**Key Point:** Files with higher priority completely override lower priority files (no variable-level merging).

---

## 🛠️ Common Scenarios

### Scenario 1: "I want to test with real data"

```bash
# Create .env.local to override .env
cp .env.remote .env.local
npm run dev

# When done, remove .env.local
rm .env.local
```

### Scenario 2: "E2E tests are failing"

Make sure `.env.test` exists and has valid credentials:
```bash
cat .env.test
# Should show remote Supabase URL and E2E credentials
```

### Scenario 3: "New developer setup"

```bash
# Copy example file
cp .env.example .env

# Start local Supabase
supabase start

# Add your OpenRouter API key to .env
nano .env  # Replace your_openrouter_api_key_here

# Start development
npm run dev
```

### Scenario 4: "Local Supabase isn't running"

```bash
# Start local Supabase
supabase start

# Or switch to remote temporarily
cp .env.remote .env.local
```

---

## 🔒 Security Notes

### Files That Are Gitignored ✅

These contain secrets and are **never committed**:
- `.env`
- `.env.local`
- `.env.remote`
- `.env.remote.backup`
- `.env.test`

### Files That Are Committed ✅

Only this template is committed:
- `.env.example` - Contains placeholder values only

---

## 📊 Quick Reference Table

| What I Want | Command | File Used | Supabase |
|-------------|---------|-----------|----------|
| Local dev (default) | `npm run dev` | `.env` | Local |
| Remote dev | Create `.env.local` from `.env.remote` | `.env.local` | Remote |
| E2E tests | `npm run test:e2e` | `.env.test` | Remote |
| Production build | `npm run build` | `.env.production` or `.env` | Depends |

---

## 🎓 Best Practices

1. **Default to Local**: Keep `.env.local` deleted for normal development
2. **Remote When Needed**: Only create `.env.local` when you need remote Supabase
3. **Clean Up**: Delete `.env.local` when done to avoid confusion
4. **Never Commit Secrets**: All `.env*` files (except `.env.example`) are gitignored
5. **Document Changes**: Update this guide if you change the setup

---

## 📚 Related Documentation

- `ENV_VARIABLES_ANALYSIS.md` - Complete analysis of all environment variables
- `ENV_VARIABLES_CLEANUP_SUMMARY.md` - Summary of changes made
- `E2E-ENVIRONMENT-VARIABLES-UPDATE.md` - E2E testing configuration

---

## ✅ Current Status

**✅ Setup Complete**
- `npm run dev` → Uses `.env` → Local Supabase
- `npm run test:e2e` → Uses `.env.test` → Remote Supabase
- No `.env.local` → Won't override `.env`

**Next Steps:**
1. Make sure local Supabase is running: `supabase start`
2. Run development: `npm run dev`
3. Everything should work with local database!

---

*Last updated: December 7, 2025*


