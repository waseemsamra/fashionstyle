# 🚀 Deploy AI Try-On Lambda to AWS

## 📋 Overview

The CORS error occurs because Hugging Face API **blocks direct browser requests**. 

**Solution**: Route through your AWS Lambda backend instead.

```
Browser → Your Lambda → Hugging Face API
(No CORS)  (Server-side)  (Works!)
```

---

## 🛠️ Deployment Steps

### **Step 1: Add Hugging Face Token to Lambda Environment**

1. Go to **AWS Console** → **Lambda**
2. Find your existing Lambda function (the one handling your backend API)
3. Go to **Configuration** → **Environment variables**
4. Add:
   - **Key**: `HUGGING_FACE_API_KEY`
   - **Value**: `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`
5. Click **Save**

---

### **Step 2: Deploy the Lambda Function**

#### **Option A: AWS Console (Easiest)**

1. Go to **AWS Lambda Console**
2. Click **Create function**
3. Select **Author from scratch**
4. Configure:
   - **Function name**: `ai-tryon-handler`
   - **Runtime**: Node.js 18.x or 20.x
   - **Architecture**: arm64 or x86_64
5. Click **Create function**
6. In the **Code** tab, paste the content of `lambda-ai-tryon.js`
7. Go to **Configuration** → **Environment variables**
8. Add:
   - `HUGGING_FACE_API_KEY=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`
9. Click **Deploy**

#### **Option B: AWS CLI**

```bash
# Create ZIP file
zip lambda-ai-tryon.zip lambda-ai-tryon.js

# Create Lambda function
aws lambda create-function \
  --function-name ai-tryon-handler \
  --runtime nodejs18.x \
  --handler lambda-ai-tryon.handler \
  --zip-file fileb://lambda-ai-tryon.zip \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_LAMBDA_ROLE \
  --environment Variables="{HUGGING_FACE_API_KEY=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}"

```

---

### **Step 3: Add to API Gateway**

1. Go to **API Gateway Console**
2. Select your existing API (the one at `rvtv0snm8k.execute-api.us-east-1.amazonaws.com`)
3. Create new resource:
   - **Resource name**: `ai-tryon`
   - **Resource path**: `/ai-tryon`
4. Create **POST** method
5. Integration type: **Lambda Function**
6. Select your `ai-tryon-handler` function
7. **Enable CORS**:
   - Go to **Actions** → **Enable CORS**
   - Configure for your domain
8. **Deploy API** to `prod` stage

---

### **Step 4: Test Locally First (Optional)**

If you want to test the Lambda locally:

```bash
# Install serverless-offline if needed
npm install --save-dev serverless-offline

# Test with curl
curl -X POST http://localhost:3000/ai-tryon \
  -H "Content-Type: application/json" \
  -d '{
    "userPhoto": "data:image/png;base64,...",
    "garmentImage": "data:image/png;base64,...",
    "garmentDescription": "test clothing"
  }'
```

---

### **Step 5: Update Frontend & Deploy**

The frontend code is **already updated** to call your Lambda! Just rebuild and deploy:

```bash
# Build the app
npm run build

# Deploy to Amplify (git push or manual upload)
git add .
git commit -m "fix: route AI try-on through Lambda to fix CORS"
git push
```

Amplify will automatically rebuild and deploy.

---

## ✅ Verification Checklist

After deployment, test these:

- [ ] Lambda function deployed and has `HUGGING_FACE_API_KEY` env var
- [ ] API Gateway has `/ai-tryon` POST endpoint
- [ ] CORS enabled on API Gateway
- [ ] Frontend rebuilt and deployed to Amplify
- [ ] Test AI try-on on product page
- [ ] Check browser console - **NO CORS errors**

---

## 🔍 How to Test

1. Go to your deployed app (e.g., `https://main.d1l8ayoz0simv1.amplifyapp.com`)
2. Navigate to any product
3. Click "Try On"
4. Upload your photo
5. Click "Generate AI Try-On"
6. **Should work without CORS errors!**

---

## 🐛 Troubleshooting

### **Still Getting CORS Errors?**

1. **Check API Gateway CORS settings**:
   - Go to API Gateway → Your API → Resources
   - Select `/ai-tryon` → POST method
   - Click **Enable CORS**
   - Set `Access-Control-Allow-Origin` to `*` or your domain
   - **Redeploy API**

2. **Check Lambda function logs**:
   - Go to CloudWatch → Log groups
   - Find `/aws/lambda/ai-tryon-handler`
   - Check for errors

3. **Test Lambda directly**:
   ```bash
   curl -X POST https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/ai-tryon \
     -H "Content-Type: application/json" \
     -d '{"userPhoto":"data:image/png;base64,test","garmentImage":"data:image/png;base64,test"}'
   ```

### **"User not found" Error?**

This is from your **auth middleware**. The Lambda might need to bypass auth for this endpoint.

**Solution**: In your API Gateway, add `/ai-tryon` to the **public routes** (no auth required).

---

## 💡 Alternative Quick Fix (No Lambda Needed)

If deploying Lambda is too complex right now, here's a **temporary workaround**:

### **Use a CORS Proxy (Not Recommended for Production)**

Update `aiTryOnService.ts` to use a CORS proxy:

```typescript
const CORS_PROXY = 'https://corsproxy.io/?';
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models';

// In performVirtualTryOn:
const response = await fetch(
  `${CORS_PROXY}${encodeURIComponent(HUGGING_FACE_API_URL}/${modelId})`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ... }),
  }
);
```

⚠️ **Warning**: This is slower and less secure, but works immediately without Lambda deployment.

---

## 📊 What Changed

### **Before (Broken)**:
```
Browser → Hugging Face API (CORS BLOCKED ❌)
```

### **After (Working)**:
```
Browser → Your Lambda → Hugging Face API ✅
         (No CORS)      (Server-side OK)
```

---

## 🎯 Next Steps

1. ✅ Deploy Lambda function
2. ✅ Add to API Gateway
3. ✅ Rebuild and deploy frontend
4. ✅ Test AI try-on
5. ✅ Monitor usage in CloudWatch

---

**Questions?** Let me know and I'll help you deploy! 🚀
