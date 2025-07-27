# Vercel Deployment Guide

## The Problem
Your Vercel frontend isn't connecting to the Replit backend because of missing environment variables.

## Solution: Set Environment Variables on Vercel

1. **Go to your Vercel dashboard**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add these variables:**

```
VITE_API_BASE_URL = https://lendibl.replit.app
VITE_STRIPE_PUBLIC_KEY = pk_live_51PgcdvGBZXNshUV1GIfQG3q4Kf4z3lZLnEVfQJmwb9ZqF4vPGa3J5UaK0qVwUshvJ9BpUtdNUNKQmdJDVtDRrE2V00sIaZzpYG
```

**Important:** Set these for **Production** environment.

## Verification Steps

After setting the environment variables:

1. **Redeploy** your Vercel app (it should automatically redeploy)
2. **Check the browser console** - you should see:
   ```
   🔧 Using VITE_API_BASE_URL: https://lendibl.replit.app
   ✅ API Connection successful!
   ```

## Alternative: Manual Override

If environment variables don't work, the code now forces the Replit backend for all production builds.

## Test Your Deployment

1. Visit your Vercel URL
2. Open browser dev tools → Console
3. Look for API connection test logs
4. Try logging in - should work without 405 errors

## Current Status

✅ Build process fixed  
✅ CORS configured on Replit backend  
✅ API configuration updated  
⚠️ Need environment variables set on Vercel  

The fix is ready - just need to set those environment variables on Vercel.