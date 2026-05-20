# At Home Project Manager (Eerdmans Hub)

Family home hub: Vite + React + TypeScript + Tailwind + Supabase.

## Local setup

1. Copy `.env.example` to `.env` and add your Supabase URL and anon key.
2. `npm install`
3. `npm run dev`

See [PROJECT_SETUP.md](PROJECT_SETUP.md) for auth and database setup.

## Deploy online

**[DEPLOY.md](DEPLOY.md)** — Supabase schema + Vercel (GitHub: `hardtopixjosh-concrete/At-Home-Project-Manager`).

## Resetting Supabase

If you previously applied study-group or project migrations, clear the remote database before defining a new schema. See [supabase/scripts/reset-public-schema.sql](supabase/scripts/reset-public-schema.sql) or use **Settings → General → Reset database** in the Supabase Dashboard.

## Workflow

1. Spec
2. Plan
3. Build
4. Review

No feature UI until the data layer and business logic are defined.
