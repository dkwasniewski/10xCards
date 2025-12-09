# Run Migrations on Production Supabase

## Problem Identified ✅

Your **local development** uses: `http://127.0.0.1:54321` (local Supabase)
Your **production** uses: `https://qrufyrgswinheiyvosuz.supabase.co` (cloud Supabase)

The production Supabase project **doesn't have the flashcards table** because migrations were only run locally.

## Solution: Run Migrations on Production

### Option 1: Using Supabase CLI (Recommended)

```bash
# 1. Link to your production Supabase project
npx supabase link --project-ref qrufyrgswinheiyvosuz

# 2. Push your local migrations to production
npx supabase db push

# This will apply all migrations from supabase/migrations/ to production
```

### Option 2: Manual SQL Execution (If CLI doesn't work)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qrufyrgswinheiyvosuz/sql)
2. Click **SQL Editor**
3. Run each migration file manually in order:

You need to run all migration files from `supabase/migrations/` in chronological order.

### Option 3: Reset and Run All Migrations

If you want a clean slate on production:

```bash
# 1. Link to production
npx supabase link --project-ref qrufyrgswinheiyvosuz

# 2. Reset the database (WARNING: This deletes all data!)
npx supabase db reset --linked

# 3. Push migrations
npx supabase db push
```

## After Running Migrations

1. **Verify the table exists**:
   - Go to: https://supabase.com/dashboard/project/qrufyrgswinheiyvosuz/editor
   - Check that `flashcards` table is visible

2. **Test the API**:
   - Visit: https://10xcards-19y.pages.dev/flashcards
   - You should now see the empty state instead of an error

3. **Create a test flashcard**:
   - Click "New Flashcard"
   - Create one to verify everything works

## Important Notes

- Your local Supabase (127.0.0.1:54321) and production Supabase are **separate databases**
- Data in local won't automatically sync to production
- You need to run migrations on **both** environments
- Consider using the same cloud Supabase project for both local and production to avoid this issue

## Alternative: Use Cloud Supabase for Local Development

To avoid this confusion in the future, you can point your local development to the cloud Supabase:

1. Update your `.env` file:

   ```
   SUPABASE_URL=https://qrufyrgswinheiyvosuz.supabase.co
   SUPABASE_KEY=your-anon-key-here
   ```

2. Restart your dev server

This way, local and production use the same database (but be careful with test data!).
