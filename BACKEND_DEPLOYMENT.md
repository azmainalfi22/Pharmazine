# Backend Deployment Guide

## Critical Issue: Backend Server Unreachable

The authentication system is failing because `https://pharmazine-backend.azmainalfi22.com` is not accessible.

## Solution Options

### Option 1: Deploy Backend to Your Domain (Recommended)

#### Step 1: Set Environment Variables on Your Backend Host

On your backend server (wherever `azmainalfi22.com` is hosted), configure these environment variables:

```bash
# Database - Use Supabase Connection Pooler
DATABASE_URL=postgresql://postgres.jsctsjwtqlluthxglood:YOUR_DB_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Supabase Auth Integration
SUPABASE_URL=https://jsctsjwtqlluthxglood.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzY3RzandxbGx1dGh4Z2xvb2QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMTQ5OTI0MywiZXhwIjoyMDQ3MDc1MjQzfQ.HlRGXvLPLvGKVT6wd2jEqDQ5UXJPBZFHvLJcuJJKLAw
SUPABASE_SERVICE_ROLE_KEY=<GET_FROM_SUPABASE_DASHBOARD>

# Security Keys (Generate new ones!)
SECRET_KEY=<GENERATE_NEW>
JWT_SECRET_KEY=<GENERATE_NEW>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS - Allow Netlify Frontend
CORS_ORIGINS=https://pharmazine.netlify.app,http://localhost:5173

# Environment
ENVIRONMENT=production
LOG_LEVEL=INFO
```

**To generate SECRET_KEY and JWT_SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**To get SUPABASE_SERVICE_ROLE_KEY:**
1. Go to https://supabase.com/dashboard/project/jsctsjwtqlluthxglood
2. Settings → API → Project API keys
3. Copy the `service_role` key (🔒 Keep this secret!)

**To get DATABASE_URL password:**
1. Go to Supabase Dashboard → Settings → Database
2. Copy the password from the connection string

#### Step 2: Deploy Backend Using Docker

If using Docker on a VPS:

```bash
# On your server
cd /path/to/pharmazine
docker build -f Dockerfile.backend -t pharmazine-backend .
docker run -d \
  --name pharmazine-backend \
  -p 8000:8000 \
  --env-file .env.production \
  pharmazine-backend
```

Or using docker-compose:

```bash
# Create .env.production with the variables above
docker-compose -f docker-compose.prod.yml up -d backend
```

#### Step 3: Configure Reverse Proxy (Nginx/Caddy)

Example Nginx config for `pharmazine-backend.azmainalfi22.com`:

```nginx
server {
    listen 80;
    server_name pharmazine-backend.azmainalfi22.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pharmazine-backend.azmainalfi22.com;

    ssl_certificate /etc/letsencrypt/live/pharmazine-backend.azmainalfi22.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pharmazine-backend.azmainalfi22.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Step 4: Verify Backend is Running

```bash
# Test health endpoint
curl https://pharmazine-backend.azmainalfi22.com/api/health

# Test auth endpoint
curl -X POST https://pharmazine-backend.azmainalfi22.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","full_name":"Test User"}'
```

---

### Option 2: Use Alternative Hosting Platform

If you don't have a VPS, deploy the backend to:

#### **Render.com** (Recommended - Free tier available)

1. Go to https://render.com
2. Create new "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:** Add all the variables from Step 1 above
5. Deploy
6. Copy the Render URL (e.g., `https://pharmazine-backend.onrender.com`)
7. Update Netlify env: `VITE_API_BASE_URL=https://pharmazine-backend.onrender.com`

#### **Railway.app**

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy
5. Copy the Railway URL
6. Update Netlify env

#### **Fly.io**

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login and launch
flyctl auth login
flyctl launch

# Set secrets
flyctl secrets set DATABASE_URL="postgresql://..."
flyctl secrets set SUPABASE_URL="https://jsctsjwtqlluthxglood.supabase.co"
flyctl secrets set SUPABASE_ANON_KEY="eyJ..."
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="eyJ..."
flyctl secrets set SECRET_KEY="your-secret"
flyctl secrets set JWT_SECRET_KEY="your-jwt-secret"
flyctl secrets set CORS_ORIGINS="https://pharmazine.netlify.app"

# Deploy
flyctl deploy
```

---

### Option 3: Migrate to Supabase-Only Auth (Simplest)

If you don't need the custom FastAPI backend for auth, you can migrate to pure Supabase Auth:

**Pros:**
- No backend hosting needed for auth
- Supabase handles everything
- Simpler architecture

**Cons:**
- Lose custom business logic in auth flow
- Need to migrate existing auth code

This would require significant refactoring of `src/contexts/AuthContext.tsx` to call Supabase directly instead of the backend API.

---

## Recommended Next Steps

1. **Immediate:** Deploy backend to Render.com (fastest, free tier)
2. **Update Netlify:** Set `VITE_API_BASE_URL` to your new backend URL
3. **Test:** Try registration/login again
4. **Long-term:** Set up monitoring and health checks

## Current Status

- ✅ Frontend deployed: https://pharmazine.netlify.app
- ✅ Supabase configured: https://jsctsjwtqlluthxglood.supabase.co
- ❌ Backend unreachable: https://pharmazine-backend.azmainalfi22.com
- ❌ DNS not resolving for backend domain

## Questions?

- Do you have access to `azmainalfi22.com` DNS settings?
- Do you have a VPS/server where the backend should run?
- Would you prefer using a hosting platform like Render/Railway instead?

