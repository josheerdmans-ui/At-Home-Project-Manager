# Project setup (one time)

## Required

1. Copy [`.env.example`](.env.example) to `.env`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase → Project Settings → API

## Optional — automatic migrations

Link the Supabase CLI once so builds can run `npm run db:push` without opening the dashboard:

```powershell
npx supabase login
npx supabase link
npm run db:push
```

## If CLI is not linked

When you open a room that needs the database, the app shows a **Setup** panel with a **Copy setup SQL** button. Paste into Supabase → SQL Editor → Run once.

## Auth

Enable **Email** provider in Supabase → Authentication → Providers. Create family accounts in Authentication → Users (or sign up via the hub login screen).

## Production

See **[DEPLOY.md](DEPLOY.md)** for Vercel + Supabase URL/auth configuration.

## Workflow

1. **Plan mode** — design a page; approve the plan file
2. **Agent mode** — say *implement the plan — full auto*
