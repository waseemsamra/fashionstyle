# 🚀 Amplify Complete Environment Setup

## ⚡ Quick Setup - Copy These Variables

### Go to Amplify Console:
https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/apps/d1l8ayoz0simv1

### Add These Environment Variables:

```bash
# Backend REST API
VITE_API_URL=https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod

# GraphQL API (AppSync)
VITE_GRAPHQL_URL=https://5wclz64wkfgp3h3exivmggigvu.appsync-api.us-east-1.amazonaws.com/graphql
VITE_GRAPHQL_API_KEY=da2-aadwbwrozrfgriafn6pgjjhrca

# Cognito Authentication
VITE_USER_POOL_ID=us-east-1_MjEc3MXcK
VITE_USER_POOL_CLIENT_ID=1ijahndnp57usbb131kpbchnkf
VITE_IDENTITY_POOL_ID=us-east-1:a5f3b7a9-0cd4-4af7-9beb-e27fea219927

# OAuth Configuration
VITE_OAUTH_DOMAIN=fashionstore-prod.auth.us-east-1.amazoncognito.com
VITE_OAUTH_REDIRECT_SIGN_IN=https://main.d1l8ayoz0simv1.amplifyapp.com/
VITE_OAUTH_REDIRECT_SIGN_OUT=https://main.d1l8ayoz0simv1.amplifyapp.com/

# S3 Bucket
VITE_S3_BUCKET=fashionstore-prod-assets-536217686312
VITE_S3_URL=https://fashionstore-prod-assets-536217686312.s3.amazonaws.com
VITE_S3_BASE_URL=https://fashionstore-prod-assets-536217686312.s3.us-east-1.amazonaws.com

# AWS Region
VITE_AWS_REGION=us-east-1
```

---

## ⚠️ CRITICAL: Enable CORS on API Gateway

**Without this, products won't load!**

### Steps:
1. Go to: https://us-east-1.console.aws.amazon.com/apigateway/home?region=us-east-1
2. Click API: **`xpyh8srop0`**
3. Click **"CORS"** in left menu
4. Click **"Enable CORS"**
5. Set:
   - **Access-Control-Allow-Origin:** `*`
   - **Access-Control-Allow-Headers:** `Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token`
   - **Access-Control-Allow-Methods:** `GET,POST,PUT,DELETE,OPTIONS`
6. Click **"Save"**
7. Click **"Actions"** → **"Deploy API"** → Select **`prod`** → **"Deploy"**

---

## 📋 All Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | `https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod` | ✅ Yes |
| `VITE_GRAPHQL_URL` | `https://5wclz64wkfgp3h3exivmggigvu.appsync-api.us-east-1.amazonaws.com/graphql` | ✅ Yes |
| `VITE_GRAPHQL_API_KEY` | `da2-aadwbwrozrfgriafn6pgjjhrca` | ✅ Yes |
| `VITE_USER_POOL_ID` | `us-east-1_MjEc3MXcK` | ✅ Yes |
| `VITE_USER_POOL_CLIENT_ID` | `1ijahndnp57usbb131kpbchnkf` | ✅ Yes |
| `VITE_IDENTITY_POOL_ID` | `us-east-1:a5f3b7a9-0cd4-4af7-9beb-e27fea219927` | ✅ Yes |
| `VITE_OAUTH_DOMAIN` | `fashionstore-prod.auth.us-east-1.amazoncognito.com` | ✅ Yes |
| `VITE_OAUTH_REDIRECT_SIGN_IN` | `https://main.d1l8ayoz0simv1.amplifyapp.com/` | ✅ Yes |
| `VITE_OAUTH_REDIRECT_SIGN_OUT` | `https://main.d1l8ayoz0simv1.amplifyapp.com/` | ✅ Yes |
| `VITE_S3_BUCKET` | `fashionstore-prod-assets-536217686312` | ✅ Yes |
| `VITE_S3_URL` | `https://fashionstore-prod-assets-536217686312.s3.amazonaws.com` | ✅ Yes |
| `VITE_S3_BASE_URL` | `https://fashionstore-prod-assets-536217686312.s3.us-east-1.amazonaws.com` | ✅ Yes |
| `VITE_AWS_REGION` | `us-east-1` | ✅ Yes |

---

## ✅ Deployment Checklist

- [ ] CORS enabled on API Gateway (`xpyh8srop0`)
- [ ] API deployed to `prod` stage
- [ ] All 13 environment variables added to Amplify
- [ ] Cognito OAuth redirects updated
- [ ] Code pushed to Git
- [ ] Deployment completed

---

## 🔗 Quick Links

- **Amplify Console:** https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/apps/d1l8ayoz0simv1
- **API Gateway:** https://us-east-1.console.aws.amazon.com/apigateway/home?region=us-east-1
- **Cognito:** https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1
- **AppSync (GraphQL):** https://us-east-1.console.aws.amazon.com/appsync/v2/home?region=us-east-1
- **S3:** https://s3.console.aws.amazon.com/s3/home?region=us-east-1

---

## 🌐 Your Amplify App

- **URL:** https://main.d1l8ayoz0simv1.amplifyapp.com
- **App ID:** d1l8ayoz0simv1
- **Branch:** main
- **Region:** us-east-1

---

**After setup, products should load on Amplify!** 🎉
