# Sharkar Pharmacy Management System – Supabase Setup

This guide connects the project to the Supabase project `jsctsjwtqlluthxglood`.

---

## 1. Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Access to the Supabase project (Project ID: `jsctsjwtqlluthxglood`)
- The following secrets (already provided):
  - Postgres password: `Xactidea@3939`
  - Anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzY3Rzand0cWxsdXRoeGdsb29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0OTI4OTAsImV4cCI6MjA3ODA2ODg5MH0.wCyVHtaIuBlVkir006NAfdcSqRUdOuZw71CU3_kjQNk`
  - Service-role key (retrieve from Supabase → Settings → API when needed)

---

## 2. Link the local repository to Supabase

```bash
supabase login          # paste the Supabase access token
supabase link --project-ref jsctsjwtqlluthxglood
```

---

## 3. Configure environment variables

1. Copy `env.example` to create your runtime `.env`:
   ```bash
   cp env.example .env
   ```
2. For production builds copy `env.production.example` to `.env.production` and adjust `VITE_API_BASE_URL` to your deployed backend domain.
3. Update any remaining secrets (e.g. `SUPABASE_SERVICE_ROLE_KEY`) directly in the target environment instead of committing them.

The important variables are:
- `DATABASE_URL=postgresql://postgres:Xactidea%403939@db.jsctsjwtqlluthxglood.supabase.co:5432/postgres`
- `DIRECT_DATABASE_URL` and `POOLER_DATABASE_URL` for migration tools
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` for the frontend

---

## 4. Run migrations against Supabase

### 4.1 Supabase SQL migrations

```bash
npx supabase@latest db push --db-url "postgresql://postgres.jsctsjwtqlluthxglood:Xactidea%403939@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

This applies the SQL files in `supabase/migrations/` (tables, RLS policies, enums).

### 4.2 Seeding data (optional)

After the migrations finish, you can seed demo records through the backend scripts:

```bash
set DATABASE_URL=postgresql://postgres.jsctsjwtqlluthxglood:Xactidea%403939@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
cd backend
python seed_all_data.py
```

> `run_all_pharmacy_migrations.py` is intended for local Postgres instances. When `DATABASE_URL` points to Supabase the script will now exit early and remind you to use the Supabase CLI command above.

---

## 5. Create initial users and roles

1. In Supabase dashboard → Authentication, enable **Email/Password**.
2. Add initial users via the Auth UI or SQL editor.
3. Grant roles using SQL (replace `USER_UUID` with the ID from the `auth.users` table):
   ```sql
   insert into public.user_roles (user_id, role) values ('USER_UUID', 'admin');
   ```

---

## 6. Configure deployment environments

- **Backend container/host**: set `DATABASE_URL`, `SECRET_KEY`, `ENVIRONMENT=production`, and (optionally) `SUPABASE_SERVICE_ROLE_KEY`.
- **Frontend host**: set `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Use the pooled connection strings (`POOLER_DATABASE_URL`) for long-running app servers if you rely on PgBouncer.

---

## 7. Verify the integration

1. Run the backend locally (`uvicorn backend.main:app --reload`) or deploy it, then open `http://localhost:8000/docs`.
2. Start the frontend (`npm run dev`) and test a Supabase-backed screen (e.g. Category setup).
3. Confirm CRUD operations succeed and respect RLS policies based on user roles.

---

## 8. Helpful links

- Supabase project dashboard: https://app.supabase.com/project/jsctsjwtqlluthxglood
- Managed connection dashboard: https://mcp.supabase.com/mcp?project_ref=jsctsjwtqlluthxglood

Keep this document updated if credentials or project references change.
