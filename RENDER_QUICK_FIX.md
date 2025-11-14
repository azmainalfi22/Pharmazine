# 🚨 Render Deployment - Quick Fix

## Error: "Tenant or user not found"

Your Render deployment is failing because the `DATABASE_URL` format is incorrect.

## ✅ Solution: Get the Correct Connection String

### Step 1: Get Connection String from Supabase

1. Go to: https://supabase.com/dashboard/project/jsctsjwtqlluthxglood
2. Click **Settings** (left sidebar) → **Database**
3. Scroll down to **Connection string** section
4. **IMPORTANT:** Select **"Transaction pooler"** from the dropdown (NOT "Session pooler" or "Direct connection")
5. Select **"URI"** format (NOT "JDBC" or others)
6. Click the **Copy** button

The connection string should look **exactly** like this:
```
postgresql://postgres.jsctsjwtqlluthxglood:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Step 2: Update Render Environment Variable

1. Go to your Render dashboard: https://dashboard.render.com
2. Click on your `pharmazine-backend` service
3. Click **Environment** in the left sidebar
4. Find `DATABASE_URL` and click **Edit**
5. **Paste the connection string** you copied from Supabase
6. Click **Save Changes**
7. Render will automatically redeploy

### Step 3: Wait for Deployment

- Render will rebuild and redeploy (takes 2-5 minutes)
- Watch the logs for success
- You should see: `INFO: Application startup complete.`

---

## 🔍 Key Points

### ❌ Wrong Format (Will Fail)
```
postgresql://postgres:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```
**Problem:** Username is just `postgres` (missing project ref)

### ✅ Correct Format (Will Work)
```
postgresql://postgres.jsctsjwtqlluthxglood:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```
**Correct:** Username is `postgres.jsctsjwtqlluthxglood` (includes project ref)

---

## 📋 All Required Environment Variables for Render

Make sure these are set in Render dashboard:

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `DATABASE_URL` | `postgresql://postgres.jsctsjwtqlluthxglood:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` | Supabase → Settings → Database → Transaction pooler |
| `SUPABASE_URL` | `https://jsctsjwtqlluthxglood.supabase.co` | Already set ✅ |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Already set ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase → Settings → API → service_role key |
| `SECRET_KEY` | Auto-generated | Already set ✅ |
| `JWT_SECRET_KEY` | Auto-generated | Already set ✅ |
| `CORS_ORIGINS` | `https://pharmazine.netlify.app,http://localhost:5173` | Already set ✅ |
| `ENVIRONMENT` | `production` | Already set ✅ |

---

## 🎯 After Fixing

Once deployment succeeds:

1. Copy your Render URL (e.g., `https://pharmazine-backend.onrender.com`)
2. Go to Netlify → pharmazine → Site configuration → Environment variables
3. Update `VITE_API_BASE_URL` to your Render URL
4. Redeploy Netlify
5. Test login at https://pharmazine.netlify.app/auth

---

## ✅ Latest Fix (Pushed to GitHub)

**Schema Conflict Fixed:** The backend now automatically detects when connected to Supabase and skips SQLAlchemy table creation. This prevents schema mismatches between the backend models and Supabase's UUID-based schema.

**What changed:** Commit `59c3b9e` - Backend will now print `[INFO] Using Supabase - skipping SQLAlchemy table creation` instead of trying to create tables.

## 🆘 Still Having Issues?

If you still see "Tenant or user not found":

1. **Double-check the username format:** Must be `postgres.jsctsjwtqlluthxglood` (with the dot and project ref)
2. **Verify the password:** Copy it directly from Supabase, don't type it manually
3. **Use Transaction pooler:** Port must be `6543`, not `5432`
4. **Check for special characters:** If password has special characters like `@`, `#`, `%`, they must be URL-encoded

### URL Encoding Special Characters

If your password contains special characters, encode them:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `=` → `%3D`
- `+` → `%2B`

Example:
- Password: `MyP@ss#123`
- Encoded: `MyP%40ss%23123`
- Full URL: `postgresql://postgres.jsctsjwtqlluthxglood:MyP%40ss%23123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

