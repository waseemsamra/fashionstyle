const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client');
const app = express();
const port = process.env.PORT || 3000;

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let client;

// Initialize OpenID Client with correct Cognito configuration
async function initializeClient() {
    try {
        // Use Cognito domain for discovery (not the direct endpoint)
        const issuer = await Issuer.discover('https://fashionstore-prod.auth.us-east-1.amazoncognito.com');
        
        client = new issuer.Client({
            client_id: process.env.COGNITO_CLIENT_ID || '45ruk52pjgd4m1qobbut5eeae7',
            client_secret: process.env.COGNITO_CLIENT_SECRET || '<your-client-secret>',
            redirect_uris: [
                'https://main.d1l8ayoz0simv1.amplifyapp.com/',
                'http://localhost:3000/',
                'http://localhost:3001/'
            ],
            response_types: ['code'],
            grant_types: ['authorization_code', 'refresh_token'],
            id_token_signed_response_alg: 'RS256'
        });
        
        console.log('✅ OpenID Client initialized successfully');
        console.log('📋 Issuer:', issuer.metadata.issuer);
        console.log('📋 Authorization endpoint:', issuer.metadata.authorization_endpoint);
        console.log('📋 Token endpoint:', issuer.metadata.token_endpoint);
    } catch (error) {
        console.error('❌ Failed to initialize OpenID Client:', error.message);
    }
}

initializeClient();

// Route: Start OAuth flow
app.get('/auth/login', (req, res) => {
    if (!client) {
        return res.status(500).json({ error: 'OAuth client not initialized' });
    }
    
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);
    
    // Store code verifier in session for later verification
    req.session.code_verifier = code_verifier;
    req.session.nonce = generators.nonce();
    
    const authUrl = client.authorizationUrl({
        scope: 'openid email profile',
        code_challenge,
        code_challenge_method: 'S256',
        nonce: req.session.nonce,
        redirect_uri: 'https://main.d1l8ayoz0simv1.amplifyapp.com/'
    });
    
    res.redirect(authUrl);
});

// Route: OAuth callback
app.get('/auth/callback', async (req, res) => {
    try {
        if (!client || !req.session.code_verifier) {
            return res.status(500).json({ error: 'OAuth session invalid' });
        }
        
        const params = {
            code: req.query.code,
            redirect_uri: 'https://main.d1l8ayoz0simv1.amplifyapp.com/',
            code_verifier: req.session.code_verifier
        };
        
        const tokenSet = await client.callback(
            'https://main.d1l8ayoz0simv1.amplifyapp.com/',
            params,
            { nonce: req.session.nonce, code_verifier: req.session.code_verifier }
        );
        
        // Store tokens in session
        req.session.tokens = tokenSet;
        req.session.user = tokenSet.claims();
        
        // Clear session data
        delete req.session.code_verifier;
        delete req.session.nonce;
        
        console.log('✅ Authentication successful');
        console.log('📋 User:', req.session.user.email);
        
        // Redirect to your frontend or return user info
        res.json({
            success: true,
            user: {
                email: req.session.user.email,
                name: req.session.user.name,
                sub: req.session.user.sub
            },
            accessToken: tokenSet.access_token,
            idToken: tokenSet.id_token
        });
        
    } catch (error) {
        console.error('❌ OAuth callback failed:', error.message);
        res.status(500).json({ 
            error: 'Authentication failed',
            message: error.message 
        });
    }
});

// Route: Get current user
app.get('/auth/me', (req, res) => {
    if (req.session.user) {
        res.json({
            user: req.session.user,
            authenticated: true
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Route: Logout
app.get('/auth/logout', (req, res) => {
    const returnTo = encodeURIComponent('https://main.d1l8ayoz0simv1.amplifyapp.com/');
    const logoutUrl = `https://fashionstore-prod.auth.us-east-1.amazoncognito.com/logout?client_id=${process.env.COGNITO_CLIENT_ID}&logout_uri=${returnTo}`;
    
    req.session.destroy();
    res.redirect(logoutUrl);
});

// Route: Refresh token
app.get('/auth/refresh', async (req, res) => {
    try {
        if (!req.session.tokens || !req.session.tokens.refresh_token) {
            return res.status(401).json({ error: 'No refresh token available' });
        }
        
        const tokenSet = await client.refresh(req.session.tokens.refresh_token);
        req.session.tokens = tokenSet;
        req.session.user = tokenSet.claims();
        
        res.json({
            success: true,
            accessToken: tokenSet.access_token,
            idToken: tokenSet.id_token
        });
    } catch (error) {
        console.error('❌ Token refresh failed:', error.message);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📍 Login URL: http://localhost:${port}/auth/login`);
    console.log(`📍 Callback URL: http://localhost:${port}/auth/callback`);
});

module.exports = app;
