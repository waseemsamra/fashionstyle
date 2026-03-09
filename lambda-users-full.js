const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider();

const TABLE_NAME = process.env.USERS_TABLE || 'fashionstore-prod';
const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_MjEc3MXcK';
const JWT_SECRET = process.env.JWT_SECRET || 'fashionstore-secret-key';

const jwt = require('jsonwebtoken');

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Check if user is admin
const isAdmin = (decoded) => {
  return decoded && (decoded.role === 'admin' || decoded.email === 'admin@fashionstore.com');
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const userId = event.pathParameters?.userId;
    const method = event.httpMethod;
    const token = event.headers?.Authorization || event.headers?.authorization;

    // Verify authentication for all endpoints
    const decoded = verifyToken(token);
    if (!decoded || !isAdmin(decoded)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized', message: 'Admin access required' })
      };
    }

    // GET /users - List all users from Cognito
    if (method === 'GET' && !userId) {
      const queryParams = new URLSearchParams(event.rawQueryString);
      const email = queryParams.get('email');

      let users = [];

      if (email) {
        // Search users by email in Cognito
        const cognitoParams = {
          UserPoolId: USER_POOL_ID,
          Filter: `email = "${email}"`
        };

        const cognitoResult = await cognito.listUsers(cognitoParams).promise();
        users = cognitoResult.Users.map(user => {
          const emailAttr = user.Attributes.find(a => a.Name === 'email');
          return {
            userId: user.Username,
            email: emailAttr ? emailAttr.Value : '',
            enabled: user.Enabled,
            status: user.UserStatus,
            createdAt: user.UserCreateDate
          };
        });
      } else {
        // List all users from Cognito
        const cognitoParams = {
          UserPoolId: USER_POOL_ID,
          Limit: 60
        };

        const cognitoResult = await cognito.listUsers(cognitoParams).promise();
        
        // Get profiles from DynamoDB for additional info
        const profilePromises = cognitoResult.Users.map(async (user) => {
          const emailAttr = user.Attributes.find(a => a.Name === 'email');
          const email = emailAttr ? emailAttr.Value : '';
          const userId = user.Username;

          try {
            const profileResult = await dynamodb.get({
              TableName: TABLE_NAME,
              Key: { PK: `USER#${userId}`, SK: 'PROFILE' }
            }).promise();

            const profile = profileResult.Item?.profile || {};

            return {
              userId,
              email,
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              contact: profile.contact || '',
              role: profile.role || 'customer',
              status: profile.status || user.UserStatus,
              enabled: user.Enabled,
              createdAt: user.UserCreateDate || profile.createdAt
            };
          } catch (e) {
            // Profile not found, return Cognito data only
            return {
              userId,
              email,
              firstName: '',
              lastName: '',
              contact: '',
              role: 'customer',
              status: user.UserStatus,
              enabled: user.Enabled,
              createdAt: user.UserCreateDate
            };
          }
        });

        users = await Promise.all(profilePromises);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users, total: users.length })
      };
    }

    // GET /users/{userId} - Get single user
    if (method === 'GET' && userId) {
      // Get user from Cognito
      const cognitoResult = await cognito.adminGetUser({
        UserPoolId: USER_POOL_ID,
        Username: userId
      }).promise();

      // Get profile from DynamoDB
      const profileResult = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' }
      }).promise();

      const profile = profileResult.Item?.profile || {};

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: {
            userId,
            email: cognitoResult.UserAttributes.find(a => a.Name === 'email')?.Value || '',
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            contact: profile.contact || '',
            role: profile.role || 'customer',
            status: profile.status || cognitoResult.UserStatus,
            enabled: cognitoResult.Enabled,
            createdAt: cognitoResult.UserCreateDate
          }
        })
      };
    }

    // POST /users - Create new user
    if (method === 'POST') {
      const body = JSON.parse(event.body);
      
      // Create user in Cognito
      const cognitoResult = await cognito.adminCreateUser({
        UserPoolId: USER_POOL_ID,
        Username: body.email,
        UserAttributes: [
          { Name: 'email', Value: body.email },
          { Name: 'email_verified', Value: 'true' }
        ],
        MessageAction: 'SUPPRESS',
        DesiredDeliveryMediums: ['EMAIL']
      }).promise();

      // Create profile in DynamoDB
      const userId = body.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '-');
      const timestamp = new Date().toISOString();

      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
          profile: {
            email: body.email,
            firstName: body.name?.split(' ')[0] || '',
            lastName: body.name?.split(' ')[1] || '',
            contact: body.contact || '',
            role: body.role || 'customer',
            status: body.status || 'active'
          },
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }).promise();

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'User created successfully',
          user: {
            userId,
            email: body.email,
            name: body.name,
            role: body.role,
            status: body.status
          }
        })
      };
    }

    // PUT /users/{userId} - Update user
    if (method === 'PUT' && userId) {
      const body = JSON.parse(event.body);
      const updateExpression = [];
      const expressionAttributeValues = {};

      if (body.email) {
        updateExpression.push('profile.email = :email');
        expressionAttributeValues[':email'] = body.email;
      }
      if (body.firstName) {
        updateExpression.push('profile.firstName = :firstName');
        expressionAttributeValues[':firstName'] = body.firstName;
      }
      if (body.lastName) {
        updateExpression.push('profile.lastName = :lastName');
        expressionAttributeValues[':lastName'] = body.lastName;
      }
      if (body.name) {
        const parts = body.name.split(' ');
        updateExpression.push('profile.firstName = :firstName, profile.lastName = :lastName');
        expressionAttributeValues[':firstName'] = parts[0] || '';
        expressionAttributeValues[':lastName'] = parts[1] || '';
      }
      if (body.contact) {
        updateExpression.push('profile.contact = :contact');
        expressionAttributeValues[':contact'] = body.contact;
      }
      if (body.role) {
        updateExpression.push('profile.role = :role');
        expressionAttributeValues[':role'] = body.role;
      }
      if (body.status) {
        updateExpression.push('profile.status = :status');
        expressionAttributeValues[':status'] = body.status;
      }

      if (updateExpression.length > 0) {
        updateExpression.push('updatedAt = :updatedAt');
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        await dynamodb.update({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
          UpdateExpression: `SET ${updateExpression.join(', ')}`,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW'
        }).promise();
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'User updated successfully',
          userId
        })
      };
    }

    // DELETE /users/{userId} - Delete user from Cognito and DynamoDB
    if (method === 'DELETE' && userId) {
      // Delete from Cognito
      try {
        await cognito.adminDeleteUser({
          UserPoolId: USER_POOL_ID,
          Username: userId
        }).promise();
        console.log('✅ User deleted from Cognito:', userId);
      } catch (cognitoErr) {
        console.log('⚠️ Cognito delete failed:', cognitoErr.message);
      }

      // Delete from DynamoDB
      try {
        await dynamodb.delete({
          TableName: TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: 'PROFILE' }
        }).promise();
        console.log('✅ User profile deleted from DynamoDB:', userId);
      } catch (dynamoErr) {
        console.log('⚠️ DynamoDB delete failed:', dynamoErr.message);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'User deleted successfully',
          userId
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
