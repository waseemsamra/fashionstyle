# 🔐 Enable SRP Authentication for Admin Client

## Problem
Getting error: `USER_SRP_AUTH is not enabled for the client`

This means your Cognito User Pool Client doesn't have SRP authentication enabled.

---

## ✅ Solution: Enable SRP in Cognito Console

### Step 1: Go to Cognito Console
```
https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1
```

### Step 2: Select Your User Pool
1. Click **"User pools"**
2. Click on: **`us-east-1_MjEc3MXcK`**

### Step 3: Go to App Client Settings
1. Click **"App integration"** in left menu
2. Scroll to **"App clients and analytics"**
3. You'll see your app clients listed

### Step 4: Edit App Client
1. Click on your app client (the one used for login)
2. Click **"Edit"** button

### Step 5: Enable SRP Authentication
Scroll to **"Authentication flows"** section

**CHECK these boxes:**
```
✅ ALLOW_USER_SRP_AUTH              (REQUIRED for React/Ampify)
✅ ALLOW_USER_PASSWORD_AUTH          (Recommended for flexibility)
✅ ALLOW_REFRESH_TOKEN_AUTH          (Should be auto-checked)
```

**UNCHECK these (not needed):**
```
❌ ALLOW_ADMIN_USER_PASSWORD_AUTH    (Backend only)
❌ ALLOW_USER_AUTH                   (Legacy)
❌ ALLOW_CUSTOM_AUTH                 (Custom Lambda)
```

### Step 6: Save Changes
Click **"Save changes"** at the bottom

---

## 🎯 Which Client Needs SRP?

You might have multiple app clients:

### Customer Login Client:
- **Client ID:** `1ijahndnp57usbb131kpbchnkf`
- **Name:** (whatever you named it)
- **Needs SRP:** ✅ YES

### Admin Login Client:
- **Client ID:** (your admin client)
- **Name:** (e.g., "AdminClient")
- **Needs SRP:** ✅ YES (same as customer)

**Both customer and admin logins use the SAME user pool client!**

---

## 🔍 Check Which Client You're Using

### In Your Code:
```javascript
// .env file
VITE_USER_POOL_CLIENT_ID=1ijahndnp57usbb131kpbchnkf
```

This is the client ID used for BOTH customer and admin login.

---

## ✅ After Enabling SRP:

### Test Admin Login:
1. Go to: `http://localhost:3001/admin/login`
2. Enter admin credentials:
   - Email: `waseemsamra@gmail.com`
   - Password: `Admin@123` (or your password)
3. Click "Login"
4. Should redirect to `/admin/dashboard` ✅

### Test Customer Login:
1. Go to: `http://localhost:3001/login`
2. Enter customer credentials
3. Should login successfully ✅

---

## 📊 SRP vs Direct Auth:

| Auth Type | SRP Required | Security | Use Case |
|-----------|--------------|----------|----------|
| **USER_SRP_AUTH** | ✅ Yes | High | React/Frontend apps |
| **USER_PASSWORD_AUTH** | ❌ No | Medium | Backend APIs |
| **ADMIN_USER_PASSWORD_AUTH** | ❌ No | Low | Server-side only |

**For Amplify/React apps, ALWAYS use SRP!**

---

## 🆘 Still Getting Error?

### Check These:

1. **Correct User Pool:**
   - Make sure you're editing `us-east-1_MjEc3MXcK`
   - Not a different user pool

2. **Correct Client ID:**
   - Check `.env` file
   - `VITE_USER_POOL_CLIENT_ID=1ijahndnp57usbb131kpbchnkf`

3. **SRP Actually Enabled:**
   - Go back to Cognito console
   - Verify `ALLOW_USER_SRP_AUTH` is CHECKED
   - Save changes

4. **Wait for Propagation:**
   - AWS changes take 2-3 minutes
   - Wait before testing again

---

## 🎯 Quick Checklist:

```
□ Go to Cognito Console
□ Select User Pool: us-east-1_MjEc3MXcK
□ Click App Integration
□ Find your app client
□ Click Edit
□ Check ALLOW_USER_SRP_AUTH
□ Check ALLOW_USER_PASSWORD_AUTH
□ Click Save Changes
□ Wait 2-3 minutes
□ Test admin login
□ Test customer login
```

---

## ✅ Expected Result:

After enabling SRP:

### Admin Login:
```
✅ Admin login successful
→ Redirects to /admin/dashboard
```

### Customer Login:
```
✅ Login successful
→ Redirects to /dashboard or /checkout
```

---

**Enable SRP and both admin and customer logins will work!** 🎉
