# AWS Amplify Complete Environment Setup

## 🚀 Quick Setup - Copy These Variables to Amplify

### Step 1: Go to Amplify Console
Open: https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/apps/d1l8ayoz0simv1

### Step 2: Add Environment Variables
Click **"App settings"** → **"Environment variables"** → **"Edit"**

Copy and paste these variables:

```bash
# Backend API Configuration
VITE_API_URL=https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod

# GraphQL Configuration
VITE_GRAPHQL_URL=https://5wclz64wkfgp3h3exivmggigvu.appsync-api.us-east-1.amazonaws.com/graphql
VITE_GRAPHQL_API_KEY=da2-aadwbwrozrfgriafn6pgjjhrca

# Cognito Authentication - User Pool
VITE_USER_POOL_ID=us-east-1_MjEc3MXcK
VITE_USER_POOL_CLIENT_ID=1ijahndnp57usbb131kpbchnkf
VITE_IDENTITY_POOL_ID=us-east-1:a5f3b7a9-0cd4-4af7-9beb-e27fea219927

# OAuth Configuration (for Cognito Hosted UI)
VITE_OAUTH_DOMAIN=fashionstore-prod.auth.us-east-1.amazoncognito.com
VITE_OAUTH_REDIRECT_SIGN_IN=https://main.d1l8ayoz0simv1.amplifyapp.com/
VITE_OAUTH_REDIRECT_SIGN_OUT=https://main.d1l8ayoz0simv1.amplifyapp.com/

# S3 Bucket for Assets
VITE_S3_BUCKET=fashionstore-prod-assets-536217686312
VITE_S3_URL=https://fashionstore-prod-assets-536217686312.s3.amazonaws.com
VITE_S3_BASE_URL=https://fashionstore-prod-assets-536217686312.s3.us-east-1.amazonaws.com

# AWS Region
VITE_AWS_REGION=us-east-1
```

### Step 3: Save and Redeploy
1. Click **"Save"**
2. Go to **"Deployments"** tab
3. Click **"Redeploy"** (or push a new commit to Git)

---

## 📋 Complete Environment Variables Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod` | Backend REST API |
| `VITE_GRAPHQL_URL` | `https://5wclz64wkfgp3h3exivmggigvu.appsync-api.us-east-1.amazonaws.com/graphql` | GraphQL API endpoint |
| `VITE_GRAPHQL_API_KEY` | `da2-aadwbwrozrfgriafn6pgjjhrca` | GraphQL API key |
| `VITE_USER_POOL_ID` | `us-east-1_MjEc3MXcK` | Cognito User Pool ID |
| `VITE_USER_POOL_CLIENT_ID` | `1ijahndnp57usbb131kpbchnkf` | Cognito App Client ID |
| `VITE_IDENTITY_POOL_ID` | `us-east-1:a5f3b7a9-0cd4-4af7-9beb-e27fea219927` | Cognito Identity Pool ID |
| `VITE_OAUTH_DOMAIN` | `fashionstore-prod.auth.us-east-1.amazoncognito.com` | Cognito OAuth domain |
| `VITE_OAUTH_REDIRECT_SIGN_IN` | `https://main.d1l8ayoz0simv1.amplifyapp.com/` | OAuth sign-in redirect |
| `VITE_OAUTH_REDIRECT_SIGN_OUT` | `https://main.d1l8ayoz0simv1.amplifyapp.com/` | OAuth sign-out redirect |
| `VITE_S3_BUCKET` | `fashionstore-prod-assets-536217686312` | S3 bucket name |
| `VITE_S3_URL` | `https://fashionstore-prod-assets-536217686312.s3.amazonaws.com` | S3 bucket URL |
| `VITE_S3_BASE_URL` | `https://fashionstore-prod-assets-536217686312.s3.us-east-1.amazonaws.com` | S3 base URL |
| `VITE_AWS_REGION` | `us-east-1` | AWS region |

---

## 🔧 Required AWS Configuration

### 1. Enable CORS on API Gateway ⚠️ CRITICAL

Your API Gateway needs CORS enabled for Amplify to access it.

**Steps:**
1. Go to: https://us-east-1.console.aws.amazon.com/apigateway/home?region=us-east-1
2. Click on API: `xpyh8srop0`
3. Click **"CORS"** in left menu
4. Click **"Enable CORS"**
5. Set:
   - **Access-Control-Allow-Origin:** `*`
   - **Access-Control-Allow-Headers:** `Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token`
   - **Access-Control-Allow-Methods:** `GET,POST,PUT,DELETE,OPTIONS`
6. Click **"Save"**
7. Click **"Actions"** → **"Deploy API"** → Select **prod** → **"Deploy"**

### 2. Update Cognito OAuth Redirect URLs

Your Cognito User Pool needs to allow Amplify domain redirects.

**Steps:**
1. Go to: https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1
2. Click **"User pools"** → Select: `us-east-1_MjEc3MXcK`
3. Click **"App integration"** in left menu
4. Scroll to **"Hosted UI"**
5. Click **"Edit"**
6. Under **"Sign-in and sign-out redirect URIs"**, add:
   - `https://main.d1l8ayoz0simv1.amplifyapp.com/`
7. Under **"Sign-out redirect URIs"**, add:
   - `https://main.d1l8ayoz0simv1.amplifyapp.com/`
8. Click **"Save changes"**

### 3. Verify S3 Bucket Permissions

Your S3 bucket should allow public read for product images.

**Steps:**
1. Go to: https://s3.console.aws.amazon.com/s3/home?region=us-east-1
2. Click bucket: `fashionstore-prod-assets-536217686312`
3. Click **"Permissions"** tab
4. Scroll to **"Bucket policy"**
5. Ensure it has public read access (or use CloudFront)

---

## 📝 amplify.yml Configuration

Your `amplify.yml` file should look like this:

```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci --cache .npm --prefer-offline
            - npm install react react-dom
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - .npm/**/*
          - node_modules/**/*
    rewrites:
      - source: '/<*>.html'
        target: '/index.html'
      - source: '/**'
        target: '/index.html'
      - source: '/assets/<*>.css'
        target: '/assets/*.css'
      - source: '/assets/<*>.js'
        target: '/assets/*.js'
```

---

## ✅ Deployment Checklist

Before deploying, verify:

- [ ] All environment variables added to Amplify
- [ ] CORS enabled on API Gateway (prod stage deployed)
- [ ] Cognito OAuth redirect URLs updated with Amplify domain
- [ ] S3 bucket has public read access for images
- [ ] amplify.yml has rewrite rules configured
- [ ] Latest code pushed to Git repository

---

## 🔍 Troubleshooting

### Products Not Loading
**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`
**Solution:** Enable CORS on API Gateway (see section above)

### Login Not Working
**Error:** `OAuth domain not found`
**Solution:** Update Cognito redirect URLs with Amplify domain

### Images Not Showing
**Error:** `403 Forbidden` or `404 Not Found`
**Solution:** Check S3 bucket permissions and image paths

### Build Fails
**Error:** `Environment variable not defined`
**Solution:** Ensure all variables are added to Amplify Console

---

## 📞 Your Amplify Information

- **App ID:** `d1l8ayoz0simv1`
- **Branch:** `main`
- **Amplify URL:** `https://main.d1l8ayoz0simv1.amplifyapp.com`
- **Region:** `us-east-1`

### Quick Links:
- [Amplify Console](https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/apps/d1l8ayoz0simv1)
- [API Gateway](https://us-east-1.console.aws.amazon.com/apigateway/home?region=us-east-1)
- [Cognito](https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1)
- [S3](https://s3.console.aws.amazon.com/s3/home?region=us-east-1)

---

## 🎯 After Setup - Test Your App

1. **Wait for deployment** (~5 minutes)
2. **Visit:** https://main.d1l8ayoz0simv1.amplifyapp.com
3. **Open browser console** (F12)
4. **Check for:**
   - ✅ Products loaded (should see 25 products)
   - ✅ No CORS errors
   - ✅ Images loading from S3

---

**Last Updated:** 2026-03-07
**Version:** 1.0
