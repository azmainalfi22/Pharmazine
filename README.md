# Pharmazine 2

Clean copy of the Pharmazine pharmacy stack: **React (Vite) frontend** + **FastAPI backend** + **PostgreSQL** (intended: **Supabase**). No Docker requirement, no one-off fix scripts in this tree.

## How this app talks to the database

| Layer | Role |
|--------|------|
| **PostgreSQL** | Source of truth for business data (`DATABASE_URL`). |
| **Supabase Auth** | Sign-up / login and JWT verification against Supabase (`SUPABASE_*`). The API also syncs users into a `profiles` table in Postgres. |

You are **not** choosing “Docker *or* Supabase” as two databases. Older confusion usually came from: mixing a **local Docker Postgres** connection string with **Supabase** credentials, or pointing the app at one DB while migrations ran on another.

## Guest mode (no login required)

Opening the site never forces a login. Visitors land on the dashboard in **guest mode**: every page works on a fresh, empty pharmacy, and whatever they add (products, sales, customers, …) is saved in **their browser's localStorage only** — nothing reaches the backend or your database.

- Implemented in `src/guest/`: while no API token is stored, `installGuestFetch.ts` routes every `/api/*` request to `guestApi.ts`, an in-browser stand-in that mirrors the backend's response shapes. `/api/auth/login` and `/api/auth/register` always go to the real backend.
- **Sign In / Sign Up** (sidebar, banner, or `/auth`) switches to the real backend and loads that account's own workspace (see below). Signing out returns to guest mode.
- Guests can wipe their sandbox with **Reset guest data** in the sidebar.
- Not available to guests: CSV import, backups, 2FA/password changes (these need a real account).

## Per-account workspaces

Each account has its own **workspace** — its own products, sales, customers, users list, etc. Nobody can see or change another workspace's data.

- **New sign-ups** get a fresh, empty workspace (seeded with the standard medicine categories, unit types and medicine types) and are its **admin**.
- **Accounts that existed before this feature** all share the **Original workspace**, which holds all pre-existing data. To move an account elsewhere, change its `profiles.tenant_id` (and its `user_roles.tenant_id`) in Supabase.
- **How it's enforced:** `supabase/migrations/20261007120000_per_account_workspaces.sql` adds `tenant_id` to every table plus Postgres row-level security for a `pharmazine_app` role. `backend/tenancy.py` switches each API request's transaction to that role with the caller's workspace (from the login token), so every query — ORM or raw SQL — only touches that workspace. Requests without a valid token see no data.
- **Rollout:** apply the migrations in Supabase (SQL editor or `supabase db push`) and deploy the backend, in either order. Apply them in filename order: `20261007110000_add_missing_model_columns.sql`, `20261007120000_per_account_workspaces.sql`, then `20261007130000_create_missing_module_tables.sql` (creates the HRM, Services, CRM, stock receive/issue, companies and vouchers tables, which never existed in the production database). Until the migration is applied the backend logs `Per-account workspaces: DISABLED` and behaves as before; it re-checks every minute and switches to `ENABLED` on its own.
- Background jobs (`scheduler.py`) run outside requests and are not workspace-scoped.

## Why login / sign-up can fail (typical causes)

1. **`DATABASE_URL` does not match the same Supabase project** as `SUPABASE_URL` / keys — the API writes sessions/profiles in Postgres; Auth is Supabase.
2. **Missing `SUPABASE_SERVICE_ROLE_KEY` on the server** — creating users or admin operations often need the service role (keep it **only** on Render, never in the frontend).
3. **CORS** — `CORS_ORIGINS` on the backend must include your **Netlify** URL (and localhost for dev).
4. **Schema** — run migrations on the Supabase project (see below) before expecting logins to work end-to-end.

## Local development

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # Windows — fill in real values
# edit .env: DATABASE_URL, SUPABASE_*, SECRET_KEY, JWT_SECRET_KEY, CORS_ORIGINS
python start_server.py
```

API: `http://127.0.0.1:8000` — docs at `/docs`, health at `GET /api/health`.

### Frontend

```bash
# from repo root
copy .env.example .env.local   # fill VITE_* from Supabase + local API
npm ci
npm run dev
```

Vite defaults to port **8080** and proxies `/api` to `VITE_API_BASE_URL` or `http://127.0.0.1:8000`.

## Supabase: database schema

SQL migrations live in:

- `supabase/migrations/` — ordered files for Supabase CLI or SQL editor  
- `backend/migrations/` — parallel / legacy SQL (use one source of truth; prefer `supabase/migrations` if you use Supabase hosting)

Apply them to **your** new project in timestamp order (Supabase Dashboard → SQL, or `supabase db push` if you use the CLI).

## Deploy

| Service | Notes |
|---------|--------|
| **Render** (API) | Use `render.yaml` or create a Python Web Service with **Root Directory** `backend`, install `backend/requirements.txt`, start: `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set all env vars from `backend/.env.example`. |
| **Netlify** (UI) | `netlify.toml` builds with `npm run build` and publishes `dist`. Set `VITE_API_BASE_URL` to your Render URL (no `/api` suffix), plus `VITE_SUPABASE_*` from Supabase. |

After Netlify deploy, add the site URL to backend `CORS_ORIGINS` on Render and redeploy the API.

## Repository layout

```
pharmazine-2/
  src/                 # React app
  public/
  backend/             # FastAPI (main.py, routes, models)
  supabase/migrations/ # Schema for Supabase Postgres
  .env.example         # Frontend template
  backend/.env.example # Backend template
  netlify.toml
  render.yaml
```

## Security

- Never commit `.env` files.
- This tree has **no** hardcoded Supabase URLs or keys in `main.py` / `client.ts` — configure everything via environment variables.
