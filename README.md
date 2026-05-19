# At Home Project Manager

Blank foundation for a home management app. Stack: Vite + React + TypeScript + Tailwind + Supabase.

## Setup

1. Copy `.env.example` to `.env` and add your Supabase URL and anon key.
2. `npm install`
3. `npm run dev`

## Resetting Supabase

If you previously applied study-group or project migrations, clear the remote database before defining a new schema. See [supabase/scripts/reset-public-schema.sql](supabase/scripts/reset-public-schema.sql) or use **Settings → General → Reset database** in the Supabase Dashboard.

## Workflow

1. Spec
2. Plan
3. Build
4. Review

No feature UI until the data layer and business logic are defined.
