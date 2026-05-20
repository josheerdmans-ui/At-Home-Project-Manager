# Deploy Eerdmans Hub online

This app is a **static Vite site** backed by **Supabase** (auth, database, file storage). The recommended host is **Vercel** (free tier, connects to your GitHub repo).

---

## Checklist

| Step | What |
|------|------|
| 1 | Supabase project + database schema |
| 2 | Supabase auth (email) + URL settings for your live domain |
| 3 | Push code to GitHub |
| 4 | Vercel project + environment variables |
| 5 | Create family login accounts |

---

## 1. Supabase (backend)

### Create or use a project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project** (or open an existing one).
2. Wait until the project is **Active**.

### Apply the database schema

**Option A — SQL Editor (no CLI)**

1. Supabase → **SQL Editor** → **New query**.
2. Open [`supabase/scripts/apply-all-migrations.sql`](supabase/scripts/apply-all-migrations.sql) in this repo, copy all of it, paste, **Run**.
3. Confirm under **Table Editor**: `vehicles`, `vault_documents`, `image_vault_photos`, etc.

If you already ran old migrations and things conflict, run [`supabase/scripts/reset-public-schema.sql`](supabase/scripts/reset-public-schema.sql) first (destroys public data), then run `apply-all-migrations.sql`.

**Option B — Supabase CLI**

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:push
```

### Get API keys

Supabase → **Project Settings** → **API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

(Use the **anon** key in the frontend, never the `service_role` key.)

---

## 2. Supabase Auth (login on the live site)

1. **Authentication** → **Providers** → enable **Email**.
2. For a private family hub, either:
   - **Authentication** → **Users** → **Add user** for each family member, or
   - Allow **Sign up** on the login screen (you can turn off public signups later).
3. If sign-up emails are required: **Authentication** → **Email** → consider disabling **Confirm email** for faster family onboarding (or confirm each inbox once).

You will set **URL configuration** after Vercel gives you a URL (step 4).

---

## 3. Push to GitHub

Repo: `https://github.com/hardtopixjosh-concrete/At-Home-Project-Manager`

```powershell
cd "C:\Users\hardt\OneDrive\Documents\At Home Project Manager"
git add .
git commit -m "Add deployment config and docs"
git push origin main
```

Skip commit if everything is already pushed.

---

## 4. Vercel (frontend)

1. Go to [vercel.com](https://vercel.com) → sign in with **GitHub**.
2. **Add New…** → **Project** → import **At-Home-Project-Manager**.
3. Framework should detect **Vite**. Settings (also in [`vercel.json`](vercel.json)):
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. **Environment variables** (Production + Preview):

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | your anon key |
   | `VITE_APP_NAME` | `Eerdmans Hub` (optional) |
   | `VITE_APP_ENV` | `production` |

5. **Deploy**. You will get a URL like `https://at-home-project-manager.vercel.app`.

### Point Supabase at your live URL

Supabase → **Authentication** → **URL configuration**:

- **Site URL:** `https://YOUR-VERCEL-URL.vercel.app`
- **Redirect URLs:** add `https://YOUR-VERCEL-URL.vercel.app/**`

Save, then test login on the live site.

### Custom domain (optional)

Vercel → project → **Settings** → **Domains** → add your domain, then update Supabase **Site URL** and **Redirect URLs** to match.

---

## 5. Verify production

1. Open the Vercel URL → you should see the **Family hub** login.
2. Sign in → home hub loads.
3. **Garage** / **Vault** / **Image** — if tables are missing, use in-app **Copy setup SQL** or re-run `apply-all-migrations.sql`.
4. Upload a vault file or garage photo to confirm **Storage** buckets work.

---

## Local vs production

| | Local | Production |
|---|--------|------------|
| Env file | `.env` (gitignored) | Vercel env vars |
| Data | Same Supabase project or a separate dev project | Your linked Supabase project |
| Kitchen / calendar / projects | Browser `localStorage` on that device | Same — not synced across devices yet |

To use one shared database for everyone, keep the same `VITE_SUPABASE_*` values locally and on Vercel.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page / “Missing VITE_SUPABASE…” | Set env vars on Vercel and **redeploy** |
| Login works locally but not online | Add Vercel URL to Supabase **Redirect URLs** |
| “Could not find the table” | Run `apply-all-migrations.sql` in SQL Editor |
| Sign up never finishes | Disable **Confirm email** or check spam |
| Files won’t upload | Confirm `vault-files` and `vehicle-photos` buckets exist (migrations create them) |

---

## Security note

Database RLS policies are open for family development; the **hub login screen** is the main gate. Before exposing the app broadly on the internet, tighten RLS to `authenticated` users only.

---

## Other hosts

Any static host works if you run `npm run build` and upload `dist/`, with the same `VITE_*` variables at build time:

- **Netlify:** build `npm run build`, publish `dist`, add env vars, SPA redirect `/* /index.html 200`
- **Cloudflare Pages:** same pattern

Vercel is the path of least resistance with your GitHub repo.
