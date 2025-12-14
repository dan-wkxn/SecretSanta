# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: "Secret Santa" (or any name)
   - Database password: (choose a strong password)
   - Region: (choose closest to you)
5. Click "Create new project"
6. Wait for project to be created (takes ~2 minutes)

## Step 2: Run SQL Setup

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `supabase_setup.sql` from this folder
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

## Step 3: Get Your API Keys

1. In Supabase, go to **Settings** (gear icon, bottom left)
2. Click **API** in the settings menu
3. You'll see:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

## Step 4: Configure Your App

1. Open `config.js` in this folder
2. Replace `YOUR_SUPABASE_URL_HERE` with your **Project URL**
3. Replace `YOUR_SUPABASE_ANON_KEY_HERE` with your **anon public** key
4. Save the file

## Step 5: Test It!

1. Open `index.html` in your browser
2. Create a new group
3. The group should be created in Supabase
4. Check your Supabase dashboard → **Table Editor** → `groups` table to see it

## Troubleshooting

- **Error: "Invalid API key"**: Double-check your keys in `config.js`
- **Error: "relation does not exist"**: Make sure you ran the SQL setup script
- **No real-time updates**: Check browser console for errors
- **Can't create group**: Check Supabase logs in Dashboard → Logs

## What's Different Now?

✅ **Shared Data**: All participants see the same data (works across devices!)
✅ **Real-time Updates**: Status updates automatically when someone joins
✅ **Persistent Storage**: Data is saved in the cloud, not just browser
✅ **Group Tracking**: Can see all groups and participants in Supabase dashboard

## Security Note

The `anon` key is safe to use in frontend code. Supabase Row Level Security (RLS) policies control access. The current setup allows public read/write for simplicity. For production, you may want to add authentication.

