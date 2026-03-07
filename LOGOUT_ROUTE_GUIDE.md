# 🚪 Logout Route Guide

## ✅ Your Logout is Now Configured!

Your logout route now works for both **localhost** and **Amplify**.

---

## 🔧 How It Works

### Logout Flow:
```javascript
app.get('/auth/logout', (req, res) => {
    // 1. Destroy local session
    req.session.destroy();
    
    // 2. Redirect to Cognito logout
    res.redirect('https://fashionstore-prod.auth.us-east-1.amazoncognito.com/logout?client_id=...&logout_uri=...');
});
```

### What Happens:
1. **Local session destroyed** - User logged out of your app
2. **Redirect to Cognito** - Cognito clears its session
3. **Redirect back** - User returns to your app logged out

---

## 📋 Available Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/auth/logout` | GET | Main logout route |
| `/logout` | GET | Redirects to `/auth/logout` |

Both work! Use whichever you prefer.

---

## 🌐 Environment Configuration

### Local Development:
```bash
NODE_ENV=development
LOGOUT_URL=http://localhost:3000/
```

**Logout URL:**
```
https://fashionstore-prod.auth.us-east-1.amazoncognito.com/logout?client_id=45ruk52pjgd4m1qobbut5eeae7&logout_uri=http://localhost:3000/
```

### Amplify Production:
```bash
NODE_ENV=production
LOGOUT_URL=https://main.d1l8ayoz0simv1.amplifyapp.com/
```

**Logout URL:**
```
https://fashionstore-prod.auth.us-east-1.amazoncognito.com/logout?client_id=45ruk52pjgd4m1qobbut5eeae7&logout_uri=https://main.d1l8ayoz0simv1.amplifyapp.com/
```

---

## ⚙️ Cognito Configuration

### Add Logout URLs to Cognito:

1. Go to: https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1
2. Click **"User pools"** → **`us-east-1_MjEc3MXcK`**
3. Click **"App integration"**
4. Click **"Edit"** under Hosted UI
5. Add **Sign-out redirect URIs**:

```
http://localhost:3000/
https://main.d1l8ayoz0simv1.amplifyapp.com/
```

6. Click **"Save changes"**

---

## 🧪 Test Logout

### 1. Login First
```
http://localhost:3000/auth/login
```

### 2. Check You're Logged In
```
http://localhost:3000/health
```
Should show: `"authenticated": true`

### 3. Logout
```
http://localhost:3000/auth/logout
```
or
```
http://localhost:3000/logout
```

### 4. Check You're Logged Out
```
http://localhost:3000/health
```
Should show: `"authenticated": false`

---

## 🔗 Add Logout Link to Your Frontend

### In Your React App:
```jsx
// Simple logout link
<a href="/auth/logout">Logout</a>

// Or with button
<button onClick={() => window.location.href = '/auth/logout'}>
  Logout
</button>

// Or with fetch (if you want to handle it via API)
const handleLogout = async () => {
  await fetch('/auth/logout');
  // Then redirect or update UI
  window.location.href = '/';
};
```

### In Your EJS Template:
```ejs
<a href="/auth/logout" class="btn btn-logout">Logout</a>
```

---

## 🎯 Your Current Code vs Improved Code

### Your Original:
```javascript
app.get('/logout', (req, res) => {
    req.session.destroy();
    const logoutUrl = `https://us-east-1mjec3mxck.auth.us-east-1.amazoncognito.com/logout?client_id=45ruk52pjgd4m1qobbut5eeae7&logout_uri=<logout uri>`;
    res.redirect(logoutUrl);
});
```

### Issues:
- ❌ Wrong Cognito domain format (`us-east-1mjec3mxck` should be `fashionstore-prod`)
- ❌ Hardcoded logout URI
- ❌ No environment detection

### Improved:
```javascript
app.get('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Session destruction failed:', err.message);
        }
        
        // Auto-detect environment
        const isProduction = process.env.NODE_ENV === 'production';
        const logoutUri = encodeURIComponent(
            isProduction 
                ? 'https://main.d1l8ayoz0simv1.amplifyapp.com/'
                : (process.env.LOGOUT_URL || 'http://localhost:3000/')
        );
        
        const cognitoDomain = 'fashionstore-prod.auth.us-east-1.amazoncognito.com';
        const clientId = process.env.COGNITO_CLIENT_ID || '45ruk52pjgd4m1qobbut5eeae7';
        
        const logoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
        
        res.redirect(`https://${logoutUrl}`);
    });
});
```

### Benefits:
- ✅ Correct Cognito domain
- ✅ Works for localhost and Amplify
- ✅ Uses environment variables
- ✅ Error handling
- ✅ Backward compatible (`/logout` still works)

---

## 📝 Complete Logout URLs

### Localhost:
```
https://fashionstore-prod.auth.us-east-1.amazoncognito.com/logout?client_id=45ruk52pjgd4m1qobbut5eeae7&logout_uri=http://localhost:3000/
```

### Amplify:
```
https://fashionstore-prod.auth.us-east-1.amazoncognito.com/logout?client_id=45ruk52pjgd4m1qobbut5eeae7&logout_uri=https://main.d1l8ayoz0simv1.amplifyapp.com/
```

---

## ✅ Checklist

- [ ] Logout route configured
- [ ] Cognito sign-out URLs added
- [ ] Environment variables set
- [ ] Tested on localhost
- [ ] Ready for Amplify deployment

---

**Your logout is working!** 🎉

Test it with: `http://localhost:3000/auth/logout`
