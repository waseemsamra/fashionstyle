# 🚀 OAuth Backend - Quick Start Guide

## 📦 Your Package is Ready!

Your `package.json` already has all required dependencies:
- ✅ express
- ✅ express-session
- ✅ openid-client
- ✅ ejs

---

## ⚡ Setup in 3 Steps

### Step 1: Get Your Client Secret

1. Go to: https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1
2. Click **"User pools"** → **`us-east-1_MjEc3MXcK`**
3. Click **"App integration"**
4. Find your app client: **`45ruk52pjgd4m1qobbut5eeae7`**
5. If no client secret, create a new app client with "Generate client secret" enabled
6. **Copy the Client Secret**

### Step 2: Create `.env` File

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and add your client secret:
```bash
COGNITO_CLIENT_ID=45ruk52pjgd4m1qobbut5eeae7
COGNITO_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
CALLBACK_URL=http://localhost:3000/auth/callback
SESSION_SECRET=change-this-to-a-random-secret
PORT=3000
```

### Step 3: Install & Run

```bash
# Install dependencies (if not already done)
npm install

# Start the server
npm start
```

---

## 🌐 Test It

### 1. Open your browser to:
```
http://localhost:3000
```

### 2. Click "Sign In"
You'll be redirected to Cognito login page

### 3. Login with your credentials
- Email: Your Cognito user email
- Password: Your Cognito password

### 4. You'll be redirected back to:
```
http://localhost:3000/auth/callback
```

### 5. See your user info!
✅ Logged in successfully

---

## 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Home page (login/logout UI) |
| `/auth/login` | GET | Start OAuth flow |
| `/auth/callback` | GET | OAuth callback handler |
| `/auth/me` | GET | Get current user |
| `/auth/logout` | GET | Logout user |
| `/auth/refresh` | GET | Refresh access token |
| `/api/profile` | GET | Protected route example |
| `/health` | GET | Health check |

---

## 🔧 Configure Cognito Redirect URLs

**Important:** Add these to Cognito app client settings:

### Callback URLs:
```
http://localhost:3000/auth/callback
https://main.d1l8ayoz0simv1.amplifyapp.com/
```

### Sign-out URLs:
```
http://localhost:3000/
https://main.d1l8ayoz0simv1.amplifyapp.com/
```

### Allowed OAuth Flows:
- ✅ Authorization code grant
- ✅ Implicit grant (optional)

### Allowed OAuth Scopes:
- ✅ openid
- ✅ email
- ✅ profile

---

## 🚀 Deploy to AWS (Optional)

### Option 1: AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize and deploy
eb init
eb create production
```

### Option 2: AWS Lambda with API Gateway
Use `serverless-framework` or `aws-sam`

### Option 3: EC2 or Docker
```bash
# Set production environment
export NODE_ENV=production
export PORT=80
npm start
```

---

## 🔗 Connect to Your Amplify Frontend

In your React app, you can call the backend:

```javascript
// Login
window.location.href = 'http://localhost:3000/auth/login';

// Get current user
const response = await fetch('http://localhost:3000/auth/me');
const user = await response.json();

// Logout
window.location.href = 'http://localhost:3000/auth/logout';
```

---

## 🆘 Troubleshooting

### "OAuth client not initialized"
**Solution:** Check COGNITO_CLIENT_ID and COGNITO_CLIENT_SECRET in `.env`

### "Redirect URI mismatch"
**Solution:** Ensure callback URL in `.env` matches Cognito configuration exactly

### "Invalid client"
**Solution:** Verify client_id and client_secret are correct

### "Session not working"
**Solution:** Check SESSION_SECRET is set and cookie settings are correct

---

## 📖 File Structure

```
fashionstyle/
├── app.js                 # Main OAuth server
├── package.json           # Dependencies
├── .env                   # Environment variables (create this)
├── .env.example           # Example env file
└── views/
    └── index.ejs         # Login/logout UI
```

---

## ✅ Success Checklist

- [ ] `.env` file created with client secret
- [ ] Dependencies installed (`npm install`)
- [ ] Cognito redirect URLs configured
- [ ] Server running (`npm start`)
- [ ] Can login successfully
- [ ] Can see user info
- [ ] Can logout successfully

---

**Your OAuth backend is ready!** 🎉

Start with: `npm start` then visit `http://localhost:3000`
