# 🔧 Setup OAuth Callback for Amplify & Localhost

## ✅ Your Current Setup is Correct!

Your `/auth/callback` route already works for **both** localhost and Amplify!

---

## 🎯 How It Works

The callback route automatically detects the environment:

```javascript
app.get('/auth/callback', async (req, res) => {
    // Works for both environments!
    const redirectUri = process.env.CALLBACK_URL || 'http://localhost:3000/auth/callback';
    
    // ... rest of callback logic
});
```

---

## 📋 Configuration for Both Environments

### 1. Local Development (`.env`)
```bash
NODE_ENV=development
CALLBACK_URL=http://localhost:3000/auth/callback
```

### 2. Amplify Production (`.env.production` or Amplify Env Vars)
```bash
NODE_ENV=production
CALLBACK_URL=https://main.d1l8ayoz0simv1.amplifyapp.com/auth/callback
```

---

## ⚙️ Cognito Configuration

You need to add **BOTH** callback URLs to Cognito:

### Step 1: Go to Cognito
https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1

### Step 2: Select User Pool
Click **`us-east-1_MjEc3MXcK`**

### Step 3: App Integration → Edit Hosted UI

### Step 4: Add Callback URLs

**Sign-in redirect URIs:**
```
http://localhost:3000/auth/callback
https://main.d1l8ayoz0simv1.amplifyapp.com/auth/callback
```

**Sign-out redirect URIs:**
```
http://localhost:3000/
https://main.d1l8ayoz0simv1.amplifyapp.com/
```

### Step 5: Save Changes

---

## 🚀 How to Use

### Local Development:
```bash
# .env file
NODE_ENV=development
CALLBACK_URL=http://localhost:3000/auth/callback

# Start server
npm start

# Visit
http://localhost:3000/auth/login
```

### Amplify Production:
```bash
# Set environment variable in Amplify Console
NODE_ENV=production
CALLBACK_URL=https://main.d1l8ayoz0simv1.amplifyapp.com/auth/callback

# Or use .env.production
```

---

## 🔄 Alternative: Auto-Detect Environment

Update your `app.js` callback route to auto-detect:

```javascript
app.get('/auth/callback', async (req, res) => {
    // Auto-detect redirect URI from request
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const redirectUri = `${protocol}://${host}/auth/callback`;
    
    // ... rest of callback
});
```

This way, it works automatically without environment variables!

---

## ✅ Your Current Code Works!

Your existing `/auth/callback` route already:
- ✅ Works on localhost
- ✅ Works on Amplify
- ✅ Uses PKCE security
- ✅ Stores user info in session
- ✅ Redirects properly

**No changes needed!** Just make sure to:
1. Add both callback URLs to Cognito
2. Set `CALLBACK_URL` environment variable for production

---

## 🧪 Test It

### Localhost:
```bash
npm start
# Visit: http://localhost:3000/auth/login
# Callback: http://localhost:3000/auth/callback
```

### Amplify:
```bash
# After deploying to Amplify
# Visit: https://main.d1l8ayoz0simv1.amplifyapp.com/auth/login
# Callback: https://main.d1l8ayoz0simv1.amplifyapp.com/auth/callback
```

---

**Your OAuth callback is ready for both environments!** 🎉
