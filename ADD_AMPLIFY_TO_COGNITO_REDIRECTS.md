# 📖 How to Add Amplify Domain to Cognito OAuth Redirects

## 🎯 Why You Need This

Cognito needs to know which URLs are allowed to redirect after login. Without this, OAuth login won't work on Amplify.

---

## ✅ Method 1: AWS Console (Easiest - 2 Minutes)

### Step 1: Open Cognito Console
Click this link: https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1

### Step 2: Go to User Pools
1. Click **"User pools"** in the left sidebar
2. You'll see a list of user pools

### Step 3: Select Your User Pool
Find and click on: **`us-east-1_MjEc3MXcK`**

![Select User Pool](https://via.placeholder.com/600x200/f5f5dc/333333?text=Click+on+your+user+pool)

### Step 4: Go to App Integration
1. In the left menu (under your user pool), click **"App integration"**
2. Scroll down to find **"Hosted UI"** section

![App Integration](https://via.placeholder.com/600x300/f5f5dc/333333?text=Click+App+integration+%E2%86%92+Hosted+UI)

### Step 5: Edit Hosted UI Settings
1. Click the **"Edit"** button in the Hosted UI section

![Edit Button](https://via.placeholder.com/400x100/f5f5dc/333333?text=Click+Edit+button)

### Step 6: Add Redirect URIs

Scroll to **"Sign-in and sign-out redirect URIs"**

**Add these Sign-in redirect URIs** (click "Add sign-in redirect URI" to add more):
```
https://main.d1l8ayoz0simv1.amplifyapp.com/
http://localhost:3001/
http://localhost:5173/
```

**Add these Sign-out redirect URIs**:
```
https://main.d1l8ayoz0simv1.amplifyapp.com/
http://localhost:3001/
http://localhost:5173/
```

![Add Redirect URIs](https://via.placeholder.com/600x300/f5f5dc/333333?text=Add+your+Amplify+domain+here)

### Step 7: Save Changes
1. Scroll to the bottom of the page
2. Click **"Save changes"** button

![Save Changes](https://via.placeholder.com/300x80/f5f5dc/333333?text=Click+Save+changes)

---

## ✅ Method 2: Using Script (If AWS CLI Installed)

### Run the Script:
```bash
./configure-cognito-redirects.sh
```

This will automatically add your Amplify domain to Cognito redirects.

---

## ✅ Method 3: AWS CLI Manual Command

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_MjEc3MXcK \
  --client-id 1ijahndnp57usbb131kpbchnkf \
  --callback-urls "https://main.d1l8ayoz0simv1.amplifyapp.com/" \
  --logout-urls "https://main.d1l8ayoz0simv1.amplifyapp.com/" \
  --region us-east-1
```

---

## ✅ Verify It Worked

### Check in AWS Console:
1. Go back to **App integration** → **Hosted UI**
2. Click **"Edit"**
3. Verify you see these URLs in the lists:
   - ✅ `https://main.d1l8ayoz0simv1.amplifyapp.com/`
   - ✅ `http://localhost:3001/`

### Test Login:
1. Go to: https://main.d1l8ayoz0simv1.amplifyapp.com/login
2. Try to login
3. Should redirect properly after authentication

---

## 📋 Complete List of Redirect URIs

### For Production (Amplify):
- Sign-in: `https://main.d1l8ayoz0simv1.amplifyapp.com/`
- Sign-out: `https://main.d1l8ayoz0simv1.amplifyapp.com/`

### For Local Development:
- Sign-in: `http://localhost:3001/`
- Sign-in: `http://localhost:5173/`
- Sign-out: `http://localhost:3001/`
- Sign-out: `http://localhost:5173/`

---

## ⏱️ How Long Does It Take?

Changes typically take **1-2 minutes** to propagate.

---

## 🆘 Troubleshooting

### "Invalid redirect URI" Error
**Solution:** Make sure your URL includes:
- `https://` (not `http://` for Amplify)
- Trailing slash `/` at the end
- Exact domain name (no typos)

### Login Still Not Working
**Solutions:**
1. Wait 2-3 minutes for changes to propagate
2. Clear browser cache
3. Check Amplify environment variables are set correctly
4. Verify CORS is enabled on API Gateway

### Can't Find User Pool
**Solution:**
1. Make sure you're in the correct region: **us-east-1** (N. Virginia)
2. Check the region selector in top-right corner of AWS Console

---

## 📞 Quick Links

- **Cognito Console:** https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1
- **Your User Pool:** `us-east-1_MjEc3MXcK`
- **Your Client ID:** `1ijahndnp57usbb131kpbchnkf`
- **Amplify App:** https://main.d1l8ayoz0simv1.amplifyapp.com

---

**After adding redirects, OAuth login will work on Amplify!** 🎉
