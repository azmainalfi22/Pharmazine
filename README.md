# Pharmazine 2

Clean copy of the Pharmazine pharmacy stack: **React (Vite) frontend** + **FastAPI backend** + **PostgreSQL** (intended: **Supabase**). No Docker requirement, no one-off fix scripts in this tree.

## How this app talks to the database

| Layer | Role |
|--------|------|
| **PostgreSQL** | Source of truth for business data (`DATABASE_URL`). |
| **Supabase Auth** | Sign-up / login and JWT verification against Supabase (`SUPABASE_*`). The API also syncs users into a `profiles` table in Postgres. |

You are **not** choosing “Docker *or* Supabase” as two databases. Older confusion usually came from: mixing a **local Docker Postgres** connection string with **Supabase** credentials, or pointing the app at one DB while migrations ran on another.

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
