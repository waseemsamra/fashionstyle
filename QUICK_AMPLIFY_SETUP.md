# ⚡ Quick Amplify Setup - 3 Steps

## ⚠️ CRITICAL: Do These First (Required for Products to Load)

### 1️⃣ Enable CORS on API Gateway (5 minutes)

**Without this, products won't load!**

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

### 2️⃣ Add Environment Variables to Amplify (3 minutes)

**Option A: Using AWS Console (Recommended)**

1. Go to: https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/apps/d1l8ayoz0simv1
2. Click **"App settings"** → **"Environment variables"**
3. Click **"Edit"**
4. Add these variables:

```
VITE_API_URL=https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod
VITE_GRAPHQL_URL=https://5wclz64wkfgp3h3exivmggigvu.appsync-api.us-east-1.amazonaws.com/graphql
VITE_GRAPHQL_API_KEY=da2-aadwbwrozrfgriafn6pgjjhrca
VITE_USER_POOL_ID=us-east-1_MjEc3MXcK
VITE_USER_POOL_CLIENT_ID=1ijahndnp57usbb131kpbchnkf
VITE_IDENTITY_POOL_ID=us-east-1:a5f3b7a9-0cd4-4af7-9beb-e27fea219927
VITE_OAUTH_DOMAIN=fashionstore-prod.auth.us-east-1.amazoncognito.com
VITE_OAUTH_REDIRECT_SIGN_IN=https://main.d1l8ayoz0simv1.amplifyapp.com/
VITE_OAUTH_REDIRECT_SIGN_OUT=https://main.d1l8ayoz0simv1.amplifyapp.com/
VITE_S3_BUCKET=fashionstore-prod-assets-536217686312
VITE_S3_URL=https://fashionstore-prod-assets-536217686312.s3.amazonaws.com
VITE_S3_BASE_URL=https://fashionstore-prod-assets-536217686312.s3.us-east-1.amazonaws.com
VITE_AWS_REGION=us-east-1
```

5. Click **"Save"**

**Option B: Using Script**

```bash
chmod +x setup-amplify-environment.sh
./setup-amplify-environment.sh
```

---

### 3️⃣ Update Cognito OAuth Redirects (2 minutes)

1. Go to: https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1
2. Click **"User pools"** → **`us-east-1_MjEc3MXcK`**
3. Click **"App integration"**
4. Click **"Edit"** under Hosted UI
5. Add to **Sign-in redirect URIs**:
   - `https://main.d1l8ayoz0simv1.amplifyapp.com/`
6. Add to **Sign-out redirect URIs**:
   - `https://main.d1l8ayoz0simv1.amplifyapp.com/`
7. Click **"Save changes"**

---

## 🚀 Deploy

1. Push code to Git:
   ```bash
   git add .
   git commit -m "Update for Amplify deployment"
   git push origin main
   ```

2. Or manually redeploy in Amplify Console:
   - Go to **"Deployments"** tab
   - Click **"Redeploy"**

3. Wait 3-5 minutes for build

---

## ✅ Test

1. Visit: **https://main.d1l8ayoz0simv1.amplifyapp.com**
2. Open browser console (F12)
3. Check for:
   - ✅ Products loaded (25 items)
   - ✅ No CORS errors
   - ✅ Images showing

---

## 📋 Checklist

- [ ] CORS enabled on API Gateway (`xpyh8srop0`)
- [ ] API deployed to `prod` stage
- [ ] Environment variables added to Amplify
- [ ] Cognito OAuth redirects updated
- [ ] Code pushed to Git / Redeploy triggered
- [ ] Deployment completed successfully

---

## 🆘 Troubleshooting

**Products not showing?**
- Check browser console for CORS errors
- Verify CORS is enabled on API Gateway
- Redeploy API to prod stage

**Login not working?**
- Check Cognito OAuth redirect URLs
- Verify environment variables are set

**Images broken?**
- Check S3 bucket permissions
- Verify image paths in database

---

**Full documentation:** See `AMPLIFY_ENVIRONMENT_COMPLETE.md`
