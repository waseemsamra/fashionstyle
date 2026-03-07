// Amplify Production Callback Route
// This handles OAuth callbacks from Cognito when deployed on Amplify

const express = require('express');
const router = express.Router();

// Production callback route for Amplify
router.get('/auth/callback', async (req, res) => {
    try {
        console.log('📥 Received OAuth callback (Amplify production)');
        
        const client = req.app.get('oauth_client');
        const session = req.session;
        
        if (!client || !session.code_verifier) {
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
        
        // Use Amplify domain for callback
        const redirectUri = 'https://main.d1l8ayoz0simv1.amplifyapp.com/auth/callback';
        
        const params = {
            code: req.query.code,
            redirect_uri: redirectUri,
            code_verifier: session.code_verifier
        };
        
        console.log('🔄 Exchanging code for tokens...');
        
        const tokenSet = await client.callback(
            redirectUri,
            params,
            {
                nonce: session.nonce,
                code_verifier: session.code_verifier,
                state: session.state
            }
        );
        
        // Store tokens and user info
        session.tokens = {
            access_token: tokenSet.access_token,
            id_token: tokenSet.id_token,
            refresh_token: tokenSet.refresh_token,
            expires_at: tokenSet.expires_at
        };
        
        session.userInfo = tokenSet.claims();
        session.user = session.userInfo;
        
        console.log('✅ Authentication successful');
        console.log('📋 User email:', session.userInfo.email);
        
        // Clear temporary data
        delete session.code_verifier;
        delete session.nonce;
        delete session.state;
        
        // Redirect or return JSON
        const redirectUrl = session.return_to || '/';
        delete session.return_to;
        
        if (req.query.format === 'json') {
            res.json({
                success: true,
                redirect: redirectUrl,
                user: {
                    email: session.userInfo.email,
                    name: session.userInfo.name || session.userInfo.email,
                    sub: session.userInfo.sub
                }
            });
        } else {
            res.redirect(redirectUrl);
        }
        
    } catch (error) {
        console.error('❌ OAuth callback failed:', error.message);
        res.status(500).json({
            error: 'Authentication failed',
            message: error.message
        });
    }
});

module.exports = router;
