# 🚀 AWS Amplify Deployment Guide

## Problem: Website Not Showing Anything on Amplify

This is usually caused by:
1. ❌ Missing environment variables
2. ❌ Incorrect SPA rewrite rules
3. ❌ Build errors

## ✅ Solution Steps

### Step 1: Update Environment Variables in Amplify Console

**Option A: Using AWS Console (Recommended)**

1. Go to [AWS Amplify Console](https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1)
2. Select your app: `fashionstyle` (App ID: `d1l8ayoz0simv1`)
3. Click **"App settings"** → **"Environment variables"**
4. Click **"Manage environment variables"**
5. Add/Update these variables:

```
VITE_API_URL=https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod
VITE_GRAPHQL_URL=https://5wclz64wkfgp3h3exivmggigvu.appsync-api.us-east-1.amazonaws.com/graphql
VITE_GRAPHQL_API_KEY=da2-aadwbwrozrfgriafn6pgjjhrca
VITE_USER_POOL_ID=us-east-1_MjEc3MXcK
VITE_USER_POOL_CLIENT_ID=1ijahndnp57usbb131kpbchnkf
VITE_IDENTITY_POOL_ID=us-east-1:a5f3b7a9-0cd4-4af7-9beb-e27fea219927
VITE_OAUTH_DOMAIN=fashionstore-prod.auth.us-east-1.amazoncognito.com
VITE_OAUTH_REDIRECT_SIGN_IN=https://YOUR_DOMAIN.amplifyapp.com/
VITE_OAUTH_REDIRECT_SIGN_OUT=https://YOUR_DOMAIN.amplifyapp.com/
VITE_S3_BUCKET=fashionstore-prod-assets-536217686312
VITE_S3_URL=https://fashionstore-prod-assets-536217686312.s3.amazonaws.com
VITE_S3_BASE_URL=https://fashionstore-prod-assets-536217686312.s3.us-east-1.amazonaws.com
VITE_AWS_REGION=us-east-1
```

6. Click **"Save"**

**Option B: Using Script**

```bash
chmod +x update-amplify-env.sh
./update-amplify-env.sh
```

### Step 2: Configure Rewrite Rules

1. In Amplify Console, go to **"App settings"** → **"Rewrites and redirects"**
2. Click **"Edit"**
3. Add these rules:

```json
[
  {
    "source": "/<*>.html",
    "target": "/index.html",
    "status": "200",
    "condition": "FileExists"
  },
  {
    "source": "/**",
    "target": "/index.html",
    "status": "200"
  }
]
```

4. Click **"Save"**

### Step 3: Trigger New Build

After updating environment variables:

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** (or push a new commit to Git)
3. Wait for build to complete (~5 minutes)

### Step 4: Verify Deployment

1. Check build logs for errors
2. Look for these success messages:
   - ✅ `npm run build` completed
   - ✅ `dist/` folder created
   - ✅ Files uploaded to S3

3. Visit your Amplify URL: `https://YOUR_APP_ID.amplifyapp.com`

## 🔍 Troubleshooting

### Blank White Page

**Check Browser Console (F12)**

Common errors:
- `Failed to load module` → Environment variables missing
- `404 Not Found` → Rewrite rules not configured
- `CORS error` → API Gateway CORS not enabled

**Solution:**
1. Check browser console for errors
2. Verify all environment variables are set
3. Verify rewrite rules are configured

### Build Fails

**Check Amplify Build Logs:**

Common issues:
- `npm ci` fails → Check package-lock.json exists
- `npm run build` fails → Check TypeScript errors locally first
- Environment variable errors → Verify variable names match exactly

**Test Build Locally:**
```bash
npm run build
```

Should complete without errors.

### OAuth/Login Issues

If login doesn't work on Amplify:

1. Update Cognito OAuth redirect URIs:
   - Go to **Cognito Console** → User Pool
   - Click **"App integration"** → **"App client"**
   - Add your Amplify domain to callback URLs:
     - `https://YOUR_DOMAIN.amplifyapp.com/`

2. Update `.env` with correct Amplify domain
3. Redeploy

## 📊 Monitoring

### Check Build Status
- Amplify Console → Deployments tab
- Click on latest build
- View logs for each phase

### Check Runtime Errors
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### CloudWatch Logs
- Go to CloudWatch Console
- Log groups → `/aws/amplifyapp/YOUR_APP_ID`
- View function logs

## 🎯 Quick Checklist

Before deploying to Amplify:

- [ ] Test build locally: `npm run build`
- [ ] All environment variables added to Amplify
- [ ] Rewrite rules configured
- [ ] Cognito OAuth callbacks updated with Amplify domain
- [ ] Git repository connected to Amplify
- [ ] Latest code pushed to Git

## 📞 Support

If still having issues:

1. Check Amplify build logs
2. Check browser console errors
3. Verify environment variables
4. Test locally first

## 🌐 Your Amplify URLs

- **Main Branch:** `https://main.d1l8ayoz0simv1.amplifyapp.com`
- **Amplify Console:** https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/apps/d1l8ayoz0simv1

---

**Last Updated:** 2026-03-07
