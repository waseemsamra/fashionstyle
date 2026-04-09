# 🚀 Deploy Backend to Render.com (FREE)

## Why?

Your backend (`app.js`) needs to run somewhere to proxy AI requests to Hugging Face. Amplify only hosts static frontend files.

**Render.com offers**:
✅ FREE backend hosting
✅ Always-on service
✅ Easy Git integration
✅ Environment variables

---

## 📋 Step-by-Step (5 Minutes)

### **Step 1: Create Render Account**

1. Go to https://render.com
2. Click **Get Started for Free**
3. Sign up with GitHub (easiest)

---

### **Step 2: Create Backend Service**

1. Click **New +** → **Web Service**
2. Connect your GitHub repository (`fashionstyle`)
3. Configure:

```
Name: fashionstyle-backend
Environment: Node
Build Command: npm install
Start Command: node app.js
```

4. Select **Free** plan

---

### **Step 3: Add Environment Variables**

In Render dashboard → Your service → **Environment** tab:

Add these:

```bash
HUGGING_FACE_API_KEY=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
PORT=3000
NODE_ENV=production
SESSION_SECRET=some-secret-change-in-production
VITE_API_URL=https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod
VITE_S3_BUCKET=fashionstore-products-1773891614v
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=us-east-1_MjEc3MXcK
VITE_USER_POOL_CLIENT_ID=1ijahndnp57usbb131kpbchnkf
```

---

### **Step 4: Deploy**

1. Click **Create Web Service**
2. Wait 3-5 minutes for build
3. You'll get a URL like: `https://fashionstyle-backend.onrender.com`

---

### **Step 5: Update Frontend**

Add this environment variable to **Amplify**:

```
VITE_BACKEND_URL=https://fashionstyle-backend.onrender.com
```

Then update `src/services/aiTryOnService.ts`:

```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const AI_TRYON_ENDPOINT = `${BACKEND_URL}/ai-tryon`;
```

---

### **Step 6: Push Code**

```bash
git add -A
git commit -m "feat: configure backend URL for AI try-on"
git push
```

Amplify will rebuild and AI Try-On will work!

---

## ✅ After Deployment

1. Backend runs at: `https://fashionstyle-backend.onrender.com`
2. Frontend calls: `https://fashionstyle-backend.onrender.com/ai-tryon`
3. Backend proxies to Hugging Face
4. **NO CORS issues!**

---

## 🎯 Alternative: Railway.app (Also FREE)

If you prefer Railway:

1. Go to https://railway.app
2. Sign in with GitHub
3. New Project → Deploy from GitHub repo
4. Add environment variables
5. Deploy

Same process, different platform.

---

## 💡 Why This Works

```
Browser → Render Backend → Hugging Face API
(No CORS)  (Your server)   (Server-to-server)
```

- Backend is YOUR server (no CORS restrictions)
- Hugging Face allows server-to-server requests
- Completely FREE on Render/Railway

---

## 🚀 Quick Start Command

Your `app.js` already has the route! Just deploy it.

**Questions?** Let me know and I'll guide you through Render deployment! 🎉
