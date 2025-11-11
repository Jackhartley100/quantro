# Quick Setup Guide

## Fix "Could not find the table 'public.profiles'" Error

This error means the database migration hasn't been run yet. Follow these steps:

### Step 1: Run the Database Migration

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy the entire contents of `supabase/migrations/001_create_profiles.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. You should see "Success. No rows returned"

**Option B: Via Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db push
```

### Step 2: Verify the Table Was Created

In the Supabase Dashboard:
1. Go to **Table Editor**
2. You should see a `profiles` table in the list
3. Check that it has these columns:
   - `id` (uuid, primary key)
   - `display_name` (text)
   - `username` (text, unique)
   - `avatar_url` (text)
   - `timezone` (text)
   - `locale` (text)
   - `updated_at` (timestamptz)

### Step 3: Refresh Your App

After running the migration:
1. Refresh your browser
2. Open Settings → Profile tab
3. The error should be gone and you should see the profile form

### Troubleshooting

**If you get policy errors:**
- The RLS policies should be created automatically by the migration
- Check **Authentication** → **Policies** in Supabase Dashboard to verify

**If the trigger doesn't work:**
- The trigger should auto-create profiles for new users
- For existing users, the app will create a profile on first load

**Still having issues?**
- Check the Supabase Dashboard **Logs** for any error messages
- Verify your environment variables are set correctly

