# Deployment Fix Guide - Authentication Issues

## Problem Identified

The authentication was failing due to CORS (Cross-Origin Resource Sharing) issues between your Netlify frontend and Render backend.

## Root Causes

1. **Frontend Issue**: The Netlify deployment wasn't configured to point to the Render backend URL
2. **Backend Issue**: The Render backend might not have the CORS_ORIGINS environment variable set

## Fixes Applied

### 1. ✅ Frontend Fix (netlify.toml)

Updated `netlify.toml` to include the backend URL in build environment variables:

```toml
[build.environment]
  VITE_API_BASE_URL = "https://pharmazine.onrender.com"
  VITE_SUPABASE_URL = "https://jsctsjwtqlluthxglood.supabase.co"
  VITE_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Status**: ✅ Committed and pushed. Netlify will auto-deploy.

### 2. ⚠️ Backend Fix Required (Render Environment Variables)

You need to **manually verify** that the following environment variable is set in your Render dashboard:

**Navigate to**: Render Dashboard → Your Service → Environment

**Required Variable**:
```
CORS_ORIGINS=https://pharmazine.netlify.app,http://localhost:5173
```

## Steps to Verify/Fix on Render

1. Go to https://dashboard.render.com
2. Click on your `pharmazine-backend` service
3. Click on **Environment** in the left sidebar
4. Look for the `CORS_ORIGINS` variable
5. If it's missing or incorrect, add/update it with:
   ```
   https://pharmazine.netlify.app,http://localhost:5173
   ```
6. Click **Save Changes**
7. Your service will automatically redeploy

## Other Required Render Environment Variables

Make sure these are also set in Render:

| Variable Name | Value | Required |
|--------------|-------|----------|
| `DATABASE_URL` | Your Supabase connection string | ✅ Yes |
| `SUPABASE_URL` | https://jsctsjwtqlluthxglood.supabase.co | ✅ Yes |
| `SUPABASE_ANON_KEY` | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | ✅ Yes |
| `SECRET_KEY` | Auto-generated or custom | ✅ Yes |
| `JWT_SECRET_KEY` | Auto-generated or custom | ✅ Yes |
| `CORS_ORIGINS` | https://pharmazine.netlify.app,http://localhost:5173 | ✅ Yes |
| `ENVIRONMENT` | production | ✅ Yes |

## Testing the Fix

After both deployments complete (Netlify frontend + Render backend):

1. Open https://pharmazine.netlify.app/auth
2. Try to create a new account
3. Check the browser console (F12) for any errors
4. Authentication should now work!

## Timeline

- **Netlify**: Typically takes 2-3 minutes to rebuild and deploy
- **Render**: If you update env vars, it takes 3-5 minutes to redeploy

## What Was Happening Before

1. Frontend on Netlify tried to call `https://pharmazine.netlify.app/api/auth/register`
2. But the API is actually on `https://pharmazine.onrender.com/api/auth/register`
3. Even when calling the correct URL, Render was blocking the request due to missing CORS configuration

## Need Help?

If authentication still doesn't work after these changes:

1. Check browser console for errors (F12 → Console tab)
2. Check Render logs: Dashboard → Service → Logs
3. Verify all environment variables are set correctly
4. Make sure both services finished deploying

---

**Last Updated**: 2025-11-14
**Status**: Awaiting deployment completion

