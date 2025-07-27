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
3. Look for these logs:
   ```
   🔧 Using VITE_API_BASE_URL: https://lendibl.replit.app
   🔍 Testing API Connection...
   ✅ API Connection successful!
   ```

## Troubleshooting

If you still see "Using development mode (same origin)":
- The environment variables might not be propagating
- Try **redeploying manually** on Vercel
- Check the deployment logs for build-time environment variables

## Manual Test

To test if your Vercel deployment will work, open the developer console on your deployed site and run:
```javascript
fetch('https://lendibl.replit.app/api/categories')
  .then(r => r.json())
  .then(data => console.log('✅ Direct API test:', data))
  .catch(err => console.error('❌ API test failed:', err))
```

## Current Status

✅ Build process fixed  
✅ CORS configured on Replit backend  
✅ API configuration updated  
✅ Environment variables should be set on Vercel  
⚠️ May need manual redeploy to pick up environment variables