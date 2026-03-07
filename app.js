const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'some-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS attacks
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // CSRF protection
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let client;

// Initialize OpenID Client with Cognito
async function initializeClient() {
    try {
        console.log('🔍 Initializing Cognito OAuth client...');
        
        // Use Cognito domain for discovery
        const issuer = await Issuer.discover('https://fashionstore-prod.auth.us-east-1.amazoncognito.com');
        
        console.log('✅ Cognito issuer discovered:', issuer.metadata.issuer);
        
        client = new issuer.Client({
            client_id: process.env.COGNITO_CLIENT_ID || '45ruk52pjgd4m1qobbut5eeae7',
            client_secret: process.env.COGNITO_CLIENT_SECRET,
            redirect_uris: [
                process.env.CALLBACK_URL || 'http://localhost:3000/auth/callback',
                'https://main.d1l8ayoz0simv1.amplifyapp.com/',
                'http://localhost:3000/'
            ],
            response_types: ['code'],
            grant_types: ['authorization_code', 'refresh_token'],
            id_token_signed_response_alg: 'RS256'
        });
        
        console.log('✅ OAuth client initialized successfully');
        console.log('📋 Client ID:', process.env.COGNITO_CLIENT_ID);
        console.log('📋 Callback URL:', process.env.CALLBACK_URL);
        
    } catch (error) {
        console.error('❌ Failed to initialize OAuth client:', error.message);
        console.error('Stack:', error.stack);
    }
}

initializeClient();

// Authentication Middleware - Check if user is logged in
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

// Apply auth check to all routes
app.use(checkAuth);

// Make user available in all templates
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.isAuthenticated = req.isAuthenticated;
    next();
});

// Home route - with authentication check
app.get('/', checkAuth, (req, res) => {
    res.render('index', {
        isAuthenticated: req.isAuthenticated,
        userInfo: req.session.userInfo || req.session.user,
        user: req.session.user
    });
});

// Start OAuth login flow - with PKCE for security
app.get('/auth/login', (req, res) => {
    if (!client) {
        return res.status(500).json({ 
            error: 'OAuth client not initialized',
            message: 'Please check server logs'
        });
    }
    
    try {
        // Generate PKCE parameters
        const code_verifier = generators.codeVerifier();
        const code_challenge = generators.codeChallenge(code_verifier);
        
        // Generate security parameters
        const nonce = generators.nonce();
        const state = generators.state();
        
        // Store in session for verification during callback
        req.session.code_verifier = code_verifier;
        req.session.nonce = nonce;
        req.session.state = state;
        
        // Build authorization URL
        const authUrl = client.authorizationUrl({
            scope: 'openid email profile',
            code_challenge,
            code_challenge_method: 'S256',
            nonce: nonce,
            state: state,
            redirect_uri: process.env.CALLBACK_URL || 'http://localhost:3000/auth/callback'
        });
        
        console.log('🔐 Redirecting to Cognito login...');
        res.redirect(authUrl);
        
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        res.status(500).json({ error: 'Failed to start authentication' });
    }
});

// Alternative login route (for backward compatibility)
app.get('/login', (req, res) => {
    // Redirect to the main auth login route
    res.redirect('/auth/login');
});

// OAuth callback handler
app.get('/auth/callback', async (req, res) => {
    try {
        console.log('📥 Received OAuth callback');
        
        if (!client || !req.session.code_verifier) {
            console.error('❌ Invalid session');
            return res.status(500).json({ 
                error: 'Invalid session',
                message: 'Please try logging in again'
            });
        }
        
        // Check for error from Cognito
        if (req.query.error) {
            return res.status(400).json({
                error: req.query.error,
                message: req.query.error_description || 'Authentication failed'
            });
        }
        
        const params = {
            code: req.query.code,
            redirect_uri: process.env.CALLBACK_URL || 'http://localhost:3000/auth/callback',
            code_verifier: req.session.code_verifier
        };
        
        console.log('🔄 Exchanging code for tokens...');
        
        const tokenSet = await client.callback(
            process.env.CALLBACK_URL || 'http://localhost:3000/auth/callback',
            params,
            { 
                nonce: req.session.nonce,
                code_verifier: req.session.code_verifier,
                state: req.session.state
            }
        );
        
        // Store tokens and user info in session
        req.session.tokens = {
            access_token: tokenSet.access_token,
            id_token: tokenSet.id_token,
            refresh_token: tokenSet.refresh_token,
            expires_at: tokenSet.expires_at
        };
        
        // Store user info for checkAuth middleware
        req.session.userInfo = tokenSet.claims();
        req.session.user = req.session.userInfo;
        
        console.log('✅ Authentication successful');
        console.log('📋 User email:', req.session.userInfo.email);
        console.log('📋 User sub:', req.session.userInfo.sub);
        
        // Clear temporary session data
        delete req.session.code_verifier;
        delete req.session.nonce;
        delete req.session.state;
        
        // Redirect to frontend or show success
        const redirectUrl = req.session.return_to || '/';
        delete req.session.return_to;
        
        // For SPA, return JSON; for server-rendered, redirect
        if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
            res.json({
                success: true,
                user: {
                    email: req.session.user.email,
                    name: req.session.user.name || req.session.user.email,
                    sub: req.session.user.sub,
                    email_verified: req.session.user.email_verified
                },
                accessToken: tokenSet.access_token,
                idToken: tokenSet.id_token
            });
        } else {
            res.redirect(redirectUrl);
        }
        
    } catch (error) {
        console.error('❌ OAuth callback failed:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Authentication failed',
            message: error.message 
        });
    }
});

// Get current user
app.get('/auth/me', (req, res) => {
    if (req.session.user) {
        res.json({
            authenticated: true,
            user: {
                email: req.session.user.email,
                name: req.session.user.name || req.session.user.email,
                sub: req.session.user.sub
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout route
app.get('/auth/logout', (req, res) => {
    // Destroy local session
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Session destruction failed:', err.message);
        }
        
        // Determine logout URI based on environment
        const isProduction = process.env.NODE_ENV === 'production';
        const logoutUri = encodeURIComponent(
            isProduction 
                ? 'https://main.d1l8ayoz0simv1.amplifyapp.com/'
                : (process.env.LOGOUT_URL || 'http://localhost:3000/')
        );
        
        // Build Cognito logout URL
        // Format: https://{domain}.auth.{region}.amazoncognito.com/logout
        const cognitoDomain = 'fashionstore-prod.auth.us-east-1.amazoncognito.com';
        const clientId = process.env.COGNITO_CLIENT_ID || '45ruk52pjgd4m1qobbut5eeae7';
        
        const logoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
        
        console.log('🚪 Logging out user, redirecting to Cognito...');
        res.redirect(`https://${logoutUrl}`);
    });
});

// Alternative logout route (for backward compatibility)
app.get('/logout', (req, res) => {
    res.redirect('/auth/logout');
});

// Refresh access token
app.get('/auth/refresh', async (req, res) => {
    try {
        if (!req.session.tokens || !req.session.tokens.refresh_token) {
            return res.status(401).json({ error: 'No refresh token available' });
        }
        
        console.log('🔄 Refreshing access token...');
        
        const tokenSet = await client.refresh(req.session.tokens.refresh_token);
        
        req.session.tokens = {
            access_token: tokenSet.access_token,
            id_token: tokenSet.id_token,
            refresh_token: tokenSet.refresh_token || req.session.tokens.refresh_token,
            expires_at: tokenSet.expires_at
        };
        
        req.session.user = tokenSet.claims();
        
        console.log('✅ Token refreshed successfully');
        
        res.json({
            success: true,
            accessToken: tokenSet.access_token,
            idToken: tokenSet.id_token,
            expiresIn: tokenSet.expires_in
        });
        
    } catch (error) {
        console.error('❌ Token refresh failed:', error.message);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

// Protected route example - requires authentication
app.get('/api/profile', (req, res) => {
    if (!req.isAuthenticated) {
        return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Please login to access this resource'
        });
    }
    
    res.json({
        success: true,
        user: req.user,
        message: 'This is a protected route - you are authenticated!'
    });
});

// Another protected route example
app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated) {
        // Redirect to login or show login page
        return res.redirect('/auth/login');
    }
    
    res.render('dashboard', { user: req.user });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        oauth_initialized: !!client,
        authenticated: req.isAuthenticated || false,
        user: req.isAuthenticated ? {
            email: req.user?.email,
            sub: req.user?.sub
        } : null,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ============================================');
    console.log('🚀 OAuth Backend Server Started');
    console.log('🚀 ============================================');
    console.log(`📍 Port: ${PORT}`);
    console.log(`📍 Login: http://localhost:${PORT}/auth/login`);
    console.log(`📍 Callback: http://localhost:${PORT}/auth/callback`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log('🚀 ============================================');
    console.log('');
});

module.exports = app;
