# Eternaflame — Setup Guide

## 1. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in your Supabase dashboard under **Project Settings → API**.

## 2. Database Setup

In the Supabase SQL editor, run in order:

1. `supabase/schema.sql` — Creates tables, indexes, and RLS policies
2. `supabase/seed.sql` — Inserts 3 seed profiles (Jim Turner, Eleanor Whitfield, Marcus Delgado)

> **Note on seed.sql:** The seed inserts run without a `created_by` user. Run these using the **service role key** in the SQL editor (not the anon key), or temporarily disable RLS on the profiles table, then re-enable it after seeding.

## 3. Supabase Auth Setup

In Supabase dashboard:

- **Authentication → Providers:** Enable Email and Google
- **Authentication → URL Configuration:**
  - Site URL: `http://localhost:3000` (dev) or your production domain
  - Redirect URLs: Add `http://localhost:3000/auth/callback` and your production callback URL

For Google OAuth, you'll need Google Cloud Console credentials (OAuth 2.0 client ID and secret).

## 4. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Deploy to Vercel

```bash
vercel
```

Add the two environment variables in Vercel's project settings. Update the Supabase redirect URL to your production domain.
