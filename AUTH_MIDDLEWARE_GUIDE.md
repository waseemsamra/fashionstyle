# 🔐 Authentication Middleware Guide

## ✅ `checkAuth` Middleware Integrated!

Your authentication middleware is now working across all routes.

---

## 📋 How It Works

```javascript
// Middleware checks session for user info
const checkAuth = (req, res, next) => {
    if (req.session && req.session.userInfo) {
        req.isAuthenticated = true;
        req.user = req.session.userInfo;
    } else {
        req.isAuthenticated = false;
        req.user = null;
    }
    next();
};
```

---

## 🎯 Available on Every Request

After the middleware runs, you can access:

### In Routes:
```javascript
app.get('/some-route', (req, res) => {
    if (req.isAuthenticated) {
        // User is logged in
        console.log(req.user.email);
    } else {
        // User is not logged in
    }
});
```

### In Templates (EJS):
```ejs
<% if (isAuthenticated) { %>
    <p>Welcome, <%= user.email %>!</p>
<% } else { %>
    <p>Please login</p>
<% } %>
```

---

## 🔒 Protected Routes

### Example 1: API Endpoint
```javascript
app.get('/api/profile', (req, res) => {
    if (!req.isAuthenticated) {
        return res.status(401).json({ 
            error: 'Authentication required'
        });
    }
    
    res.json({
        success: true,
        user: req.user
    });
});
```

### Example 2: Redirect to Login
```javascript
app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated) {
        return res.redirect('/auth/login');
    }
    
    res.render('dashboard', { user: req.user });
});
```

---

## 📊 Session Data Structure

After successful login, `req.session` contains:

```javascript
{
    userInfo: {
        email: 'user@example.com',
        sub: 'us-east-1:xxx-xxx-xxx',
        name: 'User Name',
        email_verified: true,
        // ... other Cognito claims
    },
    user: { /* same as userInfo */ },
    tokens: {
        access_token: 'eyJ...',
        id_token: 'eyJ...',
        refresh_token: 'eyJ...',
        expires_at: 1234567890
    }
}
```

---

## 🧪 Test Authentication

### 1. Check Health Endpoint
```bash
curl http://localhost:3000/health
```

Response (not logged in):
```json
{
    "status": "healthy",
    "oauth_initialized": true,
    "authenticated": false,
    "user": null
}
```

### 2. Login
Visit: `http://localhost:3000/auth/login`

### 3. Check Health Again
```bash
curl http://localhost:3000/health
```

Response (logged in):
```json
{
    "status": "healthy",
    "oauth_initialized": true,
    "authenticated": true,
    "user": {
        "email": "user@example.com",
        "sub": "us-east-1:xxx-xxx-xxx"
    }
}
```

### 4. Access Protected Route
```bash
curl http://localhost:3000/api/profile
```

---

## 🎯 Usage Examples

### Check if User is Logged In
```javascript
app.get('/check', (req, res) => {
    if (req.isAuthenticated) {
        res.json({ logged_in: true, user: req.user });
    } else {
        res.json({ logged_in: false });
    }
});
```

### Get User Email
```javascript
app.get('/user-email', (req, res) => {
    if (req.isAuthenticated) {
        res.json({ email: req.user.email });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});
```

### Admin-Only Route
```javascript
const requireAdmin = (req, res, next) => {
    if (!req.isAuthenticated) {
        return res.redirect('/auth/login');
    }
    
    // Check if user has admin role (if you store it)
    if (req.user['cognito:groups']?.includes('Admins')) {
        return next();
    }
    
    res.status(403).json({ error: 'Admin access required' });
};

app.get('/admin', requireAdmin, (req, res) => {
    res.json({ message: 'Welcome admin!' });
});
```

---

## 📁 Files Modified

- ✅ `app.js` - Added `checkAuth` middleware
- ✅ `app.js` - Applied middleware to all routes
- ✅ `app.js` - Updated OAuth callback to store `userInfo`
- ✅ `app.js` - Updated protected routes to use `req.isAuthenticated`
- ✅ `app.js` - Updated health check to show auth status

---

## 🚀 Ready to Use!

Your authentication middleware is now:
- ✅ Checking every request
- ✅ Setting `req.isAuthenticated`
- ✅ Setting `req.user`
- ✅ Available in all templates
- ✅ Protecting routes

**Start your server and test it!**

```bash
npm start
```

Then visit: `http://localhost:3000/health`

---

**Your auth middleware is working!** 🎉
