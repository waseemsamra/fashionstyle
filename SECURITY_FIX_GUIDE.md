# 🔒 Security: Hugging Face Token Exposed - FIX GUIDE

## 🚨 What Happened

Your Hugging Face API token was committed to Git and detected by GitGuardian.
This means it's **publicly visible** in your commit history.

---

## ✅ Step-by-Step Fix (5 Minutes)

### **Step 1: Revoke The Exposed Token**

1. Go to https://huggingface.co/settings/tokens
2. Find your token named `fashion-tryon`
3. Click **Delete** 🗑️
4. Confirm deletion

### **Step 2: Generate New Token**

1. Still on https://huggingface.co/settings/tokens
2. Click **New token**
3. Name it: `fashion-tryon-2`
4. Type: **Read** (fine-grained)
5. Copy the new token (starts with `hf_...`)

### **Step 3: Update Your `.env` File**

Your `.env` file is **now removed from git** ✅

Create it locally (it won't be committed again):

```bash
# Copy from example
cp .env.example .env
```

Then edit `.env` and add your **NEW token**:

```bash
HUGGING_FACE_API_KEY=hf_YOUR_NEW_TOKEN_HERE
VITE_HUGGING_FACE_API_KEY=hf_YOUR_NEW_TOKEN_HERE
```

### **Step 4: Add Token to Amplify (Secure)**

1. Go to **AWS Amplify Console** → Your App → App settings → Environment variables
2. **Delete** the old `HUGGING_FACE_API_KEY` and `VITE_HUGGING_FACE_API_KEY`
3. **Add new ones** with your NEW token:

| Variable | Value |
|----------|-------|
| `HUGGING_FACE_API_KEY` | `hf_YOUR_NEW_TOKEN` |
| `VITE_HUGGING_FACE_API_KEY` | `hf_YOUR_NEW_TOKEN` |

### **Step 5: Add to Backend (Render/Railway)**

If you deployed backend to Render.com or Railway:

1. Go to your backend service dashboard
2. Find **Environment Variables**
3. **Delete** old `HUGGING_FACE_API_KEY`
4. **Add new one**: `HUGGING_FACE_API_KEY=hf_YOUR_NEW_TOKEN`
5. Redeploy service

### **Step 6: Push Security Fix**

Already done! This commit was made:
```
241f580 - security: remove .env from git and add to .gitignore
```

---

## 🔒 Security Best Practices

### ✅ **What We Fixed**:

1. ✅ Added `.env` to `.gitignore` (won't be committed again)
2. ✅ Created `.env.example` (safe template without secrets)
3. ✅ Removed `.env` from git history

### ✅ **What You Should Do**:

1. ✅ **Never commit `.env` files** to Git
2. ✅ **Use environment variables** in Amplify/Render/Railway
3. ✅ **Rotate tokens** if exposed
4. ✅ **Use fine-grained tokens** with minimal permissions

### 📋 **Where Secrets Should Live**:

| Platform | Where to Add Secrets |
|----------|---------------------|
| **Local Development** | `.env` file (NOT in git) |
| **Amplify (Frontend)** | Console → Environment variables |
| **Render/Railway (Backend)** | Dashboard → Environment variables |
| **AWS Lambda** | Lambda → Configuration → Environment variables |

---

## 🚀 After Fixing

1. ✅ Old token revoked
2. ✅ New token generated
3. ✅ `.env` file updated locally
4. ✅ Amplify environment variables updated
5. ✅ Backend environment variables updated
6. ✅ Security fix pushed to git

**Your app will be secure!** 🔒

---

## ⚠️ **If You Don't Fix This**:

- Anyone can use your Hugging Face token
- They can make API calls on your behalf
- You may hit rate limits or get charged
- Your account could be compromised

**Fix it now!** It only takes 5 minutes. 🔒
