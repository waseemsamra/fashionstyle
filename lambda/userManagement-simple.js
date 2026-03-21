const AWS = require('aws-sdk');

const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_MqsmTDkkg';
const USERS_TABLE = process.env.USERS_TABLE || 'fashionstore-users';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle CORS preflight
async function handleOptions() {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: '',
  };
}

// GET /admin/users - List all users from Cognito
async function getAllUsers(event) {
  console.log('Getting all users...');
  
  try {
    // List users from Cognito (max 60 per request)
    const params = {
      UserPoolId: USER_POOL_ID,
      Limit: 60,
    };

    const result = await cognito.listUsers(params).promise();
    console.log('Cognito users:', result.Users);

    // Get additional user data from DynamoDB
    const users = await Promise.all(
      result.Users.map(async (user) => {
        const emailAttr = user.Attributes.find(attr => attr.Name === 'email');
        const email = emailAttr ? emailAttr.Value : null;
        
        // Try to get user profile from DynamoDB
        try {
          const dbParams = {
            TableName: USERS_TABLE,
            Key: { email: email },
          };
          
          const dbResult = await dynamodb.get(dbParams).promise();
          const profile = dbResult.Item || {};
          
          return {
            userId: user.Username,
            cognitoSub: user.Username,
            email: email,
            name: profile.name || '',
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            contact: profile.contact || profile.phone || '',
            phone: profile.phone || profile.contact || '',
            address: profile.address || '',
            city: profile.city || '',
            postalCode: profile.postalCode || '',
            role: profile.role || 'customer',
            status: profile.status || 'active',
            enabled: user.Enabled,
            cognitoStatus: user.UserStatus,
            createdAt: user.UserCreateDate,
          };
        } catch (dbError) {
          console.error('Error fetching profile for', email, ':', dbError);
          return {
            userId: user.Username,
            cognitoSub: user.Username,
            email: email,
            name: '',
            firstName: '',
            lastName: '',
            role: 'customer',
            status: user.UserStatus,
            enabled: user.Enabled,
            cognitoStatus: user.UserStatus,
            createdAt: user.UserCreateDate,
          };
        }
      })
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        users: users,
        count: users.length,
      }),
    };
  } catch (error) {
    console.error('Error getting users:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to fetch users',
        message: error.message 
      }),
    };
  }
}

// Handler for API Gateway
exports.handler = async (event) => {
  console.log('User Management Handler:', event.path, event.httpMethod);

  const path = event.path;
  const method = event.httpMethod;

  // Handle CORS preflight FIRST
  if (method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return await handleOptions();
  }

  try {
    // Route: GET /admin/users
    if (path === '/admin/users' && method === 'GET') {
      return await getAllUsers(event);
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};
