const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_MjEc3MXcK';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '45ruk52pjgd4m1qobbut5eeae7';
const JWT_SECRET = process.env.JWT_SECRET || 'fashionstore-secret-key';
const ADMIN_EMAILS = ['waseemsamra@gmail.com', 'admin@fashionstore.com', 'admin@example.com'];

const jwt = require('jsonwebtoken');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing credentials', message: 'Email and password are required' })
      };
    }

    console.log('🔐 Auth attempt for:', email);

    // Check if admin email
    const isAdminEmail = ADMIN_EMAILS.some(adminEmail => 
      email.toLowerCase() === adminEmail.toLowerCase() ||
      email.toLowerCase().includes(adminEmail.split('@')[0].toLowerCase())
    );

    // Authenticate with Cognito
    const authParams = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    };

    const authResult = await cognito.adminInitiateAuth(authParams).promise();

    console.log('✅ Cognito auth successful for:', email);

    // Generate JWT token
    const accessToken = authResult.AuthenticationResult.AccessToken;
    const idToken = authResult.AuthenticationResult.IdToken;

    // Decode ID token to get user info
    const decodedToken = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());

    // Create custom JWT with admin role
    const jwtPayload = {
      email: email,
      sub: decodedToken.sub,
      role: isAdminEmail ? 'admin' : 'user',
      email_verified: decodedToken.email_verified || false,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
    };

    const jwtToken = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '1h' });

    console.log('✅ JWT token generated for:', email, 'Role:', jwtPayload.role);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        accessToken: jwtToken,
        refreshToken: authResult.AuthenticationResult.RefreshToken,
        idToken: idToken,
        user: {
          email: email,
          role: jwtPayload.role,
          email_verified: jwtPayload.email_verified
        },
        message: 'Authentication successful'
      })
    };

  } catch (error) {
    console.error('❌ Auth error:', error);

    let errorMessage = 'Authentication failed';
    let statusCode = 500;

    if (error.code === 'NotAuthorizedException') {
      errorMessage = 'Invalid email or password';
      statusCode = 401;
    } else if (error.code === 'UserNotFoundException') {
      errorMessage = 'User not found';
      statusCode = 404;
    } else if (error.code === 'UserNotConfirmedException') {
      errorMessage = 'Please verify your email first';
      statusCode = 403;
    } else if (error.message && error.message.includes('Password')) {
      errorMessage = error.message;
    }

    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        message: errorMessage,
        code: error.code
      })
    };
  }
};
