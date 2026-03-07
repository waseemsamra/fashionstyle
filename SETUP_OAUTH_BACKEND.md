# 🔑 Get Cognito Client Secret & Setup OAuth Backend

## 📋 Your Cognito Information

- **User Pool ID:** `us-east-1_MjEc3MXcK`
- **Current Client ID:** `1ijahndnp57usbb131kpbchnkf`
- **New Client ID (from your code):** `45ruk52pjgd4m1qobbut5eeae7`
- **OAuth Domain:** `fashionstore-prod.auth.us-east-1.amazoncognito.com`

---

## ⚠️ Important: Client Secret

Cognito App Clients **don't have client secrets by default** for security. You need to enable it.

### How to Generate Client Secret:

#### Step 1: Go to Cognito Console
https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1

#### Step 2: Select Your User Pool
Click **"User pools"** → **`us-east-1_MjEc3MXcK`**

#### Step 3: Go to App Clients
Click **"App integration"** → Scroll to **"App clients and analytics"**

#### Step 4: Create New App Client (with secret)
1. Click **"Add an app client"**
2. **App client name:** `OAuthBackend`
3. **Select OAuth 2.0 grant types:** ✅ Yes
4. **Enable client secret:** ✅ **Generate a client secret**
5. **Callback URL:** 
   - `https://main.d1l8ayoz0simv1.amplifyapp.com/`
   - `http://localhost:3000/`
6. **Sign-out URL:** 
   - `https://main.d1l8ayoz0simv1.amplifyapp.com/`
7. **Identity providers:** 
   - ✅ Cognito user pool
8. **Authorization code grant:** ✅ Enabled
9. Click **"Create app client"**

#### Step 5: Copy Client Secret
After creation, you'll see:
- **App client ID:** (copy this)
- **Client secret:** (copy this - **only shown once!**)

---

## 🔧 Update Your Backend Code

Replace the values in `backend-oauth-server.js`:

```javascript
client = new issuer.Client({
    client_id: process.env.COGNITO_CLIENT_ID || 'YOUR_NEW_CLIENT_ID',
    client_secret: process.env.COGNITO_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
    redirect_uris: [
        'https://main.d1l8ayoz0simv1.amplifyapp.com/',
        'http://localhost:3000/'
    ],
    // ... rest of config
});
```

---

## 📦 Install Dependencies

```bash
npm install express session openid-client dotenv
```

---

## 🚀 Run the Server

### Option 1: Environment Variables
```bash
export COGNITO_CLIENT_ID='your-client-id'
export COGNITO_CLIENT_SECRET='your-client-secret'
export SESSION_SECRET='your-secret-key'
node backend-oauth-server.js
```

### Option 2: .env File
Create `.env` file:
```bash
COGNITO_CLIENT_ID=your-client-id-here
COGNITO_CLIENT_SECRET=your-client-secret-here
SESSION_SECRET=your-secret-key-change-in-production
PORT=3000
```

Then run:
```bash
node backend-oauth-server.js
```

---

## 🌐 Test OAuth Flow

### 1. Start the server
```bash
node backend-oauth-server.js
```

### 2. Open browser to:
```
http://localhost:3000/auth/login
```

### 3. You'll be redirected to Cognito login
- Enter your credentials
- Authorize the application

### 4. Redirected back to callback
- You'll see JSON with user info and tokens

---

## ⚠️ Important Notes

### For Amplify Deployment:
This backend server needs to be deployed separately (e.g., AWS EC2, Lambda, or Elastic Beanstalk).

### For Frontend (React on Amplify):
Your React app should use **Amplify's built-in auth** (already configured), not this backend OAuth server.

### When to Use This Backend:
- ✅ When you need server-side session management
- ✅ When building API backend that needs OAuth
- ✅ When you need to integrate with other backend services

### When NOT to Use:
- ❌ For simple React SPA on Amplify (use Amplify Auth instead)
- ❌ If you don't need server-side sessions
- ❌ For mobile apps (use Cognito SDK directly)

---

## 🔗 Quick Links

- **Cognito Console:** https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1
- **Your User Pool:** `us-east-1_MjEc3MXcK`
- **OAuth Domain:** https://fashionstore-prod.auth.us-east-1.amazoncognito.com

---

## 🆘 Troubleshooting

### "Invalid client" Error
**Solution:** Check client_id and client_secret are correct

### "Redirect URI mismatch" Error
**Solution:** Ensure callback URL in code matches Cognito configuration exactly

### "Client secret not generated" 
**Solution:** You need to create a NEW app client with "Generate client secret" enabled

---

**After setup, your OAuth backend will work!** 🎉
