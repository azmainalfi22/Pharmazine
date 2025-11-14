# How to Fix CORS Error on Render

## Current Status
✅ **Netlify Frontend**: Fixed - Now correctly calling Render backend  
❌ **Render Backend**: CORS not configured - Blocking requests from Netlify

## The Error
```
Access to fetch at 'https://pharmazine.onrender.com/api/auth/register' 
from origin 'https://pharmazine.netlify.app' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Fix Steps (5 minutes)

### Step 1: Go to Render Dashboard
1. Open https://dashboard.render.com
2. Log in to your account
3. Find and click on your **pharmazine-backend** service

### Step 2: Update Environment Variables
1. In the left sidebar, click **Environment**
2. Look for a variable named `CORS_ORIGINS`

### Step 3: Add or Update CORS_ORIGINS

**If the variable EXISTS:**
- Click the **Edit** button next to it
- Update the value to:
  ```
  https://pharmazine.netlify.app,http://localhost:5173,http://localhost:3000,http://localhost:8080,http://localhost:8081,http://localhost:5000,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:8080
  ```
- Click **Save**

**If the variable DOES NOT EXIST:**
- Click **Add Environment Variable**
- **Key**: `CORS_ORIGINS`
- **Value**: `https://pharmazine.netlify.app,http://localhost:5173,http://localhost:3000,http://localhost:8080,http://localhost:8081,http://localhost:5000,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:8080`
- Click **Save**

**Note**: This includes multiple localhost ports so you can test on any common development port (3000, 5173, 8080, etc.)

### Step 4: Wait for Redeployment
- Render will automatically redeploy your service (takes 3-5 minutes)
- Watch the **Events** tab to see deployment progress
- Wait for it to show "Deploy live for..."

### Step 5: Test Authentication
1. Wait until deployment completes
2. Go to https://pharmazine.netlify.app/auth
3. Click **Sign Up**
4. Fill in the form and click **Create Account**
5. It should work now! 🎉

## Other Required Environment Variables

While you're in the Environment section, verify these are also set:

| Variable | Required Value |
|----------|---------------|
| `DATABASE_URL` | Your Supabase connection string |
| `SUPABASE_URL` | https://jsctsjwtqlluthxglood.supabase.co |
| `SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `SECRET_KEY` | Auto-generated or custom |
| `JWT_SECRET_KEY` | Auto-generated or custom |
| `ENVIRONMENT` | production |

## Why This Happened

The `render.yaml` file contains the CORS configuration, but:
- Environment variables in `render.yaml` are only applied during **initial** deployment
- If you deployed before the variable was in the file, it wasn't set
- You need to manually add it via the dashboard

## Alternative: Redeploy from Scratch

If the above doesn't work:
1. Go to **Settings** → **Manual Deploy**
2. Click **Deploy latest commit**
3. This will re-read the `render.yaml` and apply all environment variables

## Troubleshooting

**If it still doesn't work after 10 minutes:**

1. Check Render logs:
   - Go to your service → **Logs**
   - Look for lines like `[ENV] CORS_ORIGINS set: ...`
   - If you don't see this, the variable isn't set correctly

2. Check if service is running:
   - Visit https://pharmazine.onrender.com/api/health
   - Should return: `{"status":"OK"}`

3. Check Netlify deployment:
   - Visit https://app.netlify.com/sites/pharmazine/deploys
   - Make sure the latest deploy finished successfully

## Contact if Needed

If you're stuck, provide:
1. Screenshot of Render Environment Variables page
2. Screenshot of Render Logs showing environment checks
3. Any error messages from browser console

---

**Expected completion time**: 5-10 minutes (mostly waiting for redeployment)

