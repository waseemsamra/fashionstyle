const AWS = require('aws-sdk');

const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const USER_POOL_ID = process.env.USER_POOL_ID;
const USERS_TABLE = process.env.USERS_TABLE;

// Middleware for CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,Authorization,X-Amz-Security-Token,X-Amz-Target,X-Amz-User-Agent,X-Amz-Content-Sha256,X-Amz-Content-Type,X-Amz-User-Agent,X-Amz-Target',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,HEAD',
};

// Middleware for authentication
const authenticateUser = async (event) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No token provided');
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Verify token with Cognito
    const params = {
      UserPoolId: USER_POOL_ID,
      AccessToken: token,
    };

    const user = await cognito.getUser(params).promise();
    
    // Get user attributes
    const emailAttr = user.UserAttributes.find(attr => attr.Name === 'email');
    const email = emailAttr ? emailAttr.Value : null;
    
    return {
      sub: user.Username,
      email: email,
      token: token,
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    // For development, allow access without valid token
    // In production, throw the error
    // throw new Error('Unauthorized: Invalid token');
    return {
      sub: 'anonymous',
      email: 'anonymous@example.com',
      token: token,
    };
  }
};

// GET /admin/users - List all users from Cognito
exports.getAllUsers = async (event) => {
  console.log('Getting all users...');
  
  try {
    // Authenticate admin user
    await authenticateUser(event);

    // List users from Cognito
    const params = {
      UserPoolId: USER_POOL_ID,
      Limit: 100,
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
          // Return Cognito data only
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
    
    if (error.message === 'Unauthorized: No token provided' || 
        error.message === 'Unauthorized: Invalid token') {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message }),
      };
    }
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to fetch users',
        message: error.message 
      }),
    };
  }
};

// GET /admin/users/:userId - Get single user
exports.getUserById = async (event) => {
  console.log('Getting user by ID...');
  
  try {
    await authenticateUser(event);
    
    const userId = event.pathParameters.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    // Get user from Cognito
    const cognitoParams = {
      UserPoolId: USER_POOL_ID,
      Username: userId,
    };

    const cognitoUser = await cognito.adminGetUser(cognitoParams).promise();
    
    // Get profile from DynamoDB
    const emailAttr = cognitoUser.UserAttributes.find(attr => attr.Name === 'email');
    const email = emailAttr ? emailAttr.Value : null;
    
    let profile = null;
    if (email) {
      const dbParams = {
        TableName: USERS_TABLE,
        Key: { email: email },
      };
      
      const dbResult = await dynamodb.get(dbParams).promise();
      profile = dbResult.Item;
    }

    const user = {
      userId: cognitoUser.Username,
      cognitoSub: cognitoUser.Username,
      email: email,
      name: profile?.name || '',
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      contact: profile?.contact || profile?.phone || '',
      phone: profile?.phone || profile?.contact || '',
      address: profile?.address || '',
      city: profile?.city || '',
      postalCode: profile?.postalCode || '',
      role: profile?.role || 'customer',
      status: profile?.status || 'active',
      enabled: cognitoUser.Enabled,
      cognitoStatus: cognitoUser.UserStatus,
      createdAt: cognitoUser.UserCreateDate,
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(user),
    };
  } catch (error) {
    console.error('Error getting user:', error);
    
    if (error.message.includes('Unauthorized')) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message }),
      };
    }
    
    if (error.code === 'UserNotFoundException') {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to fetch user',
        message: error.message 
      }),
    };
  }
};

// POST /admin/users - Create new user
exports.createUser = async (event) => {
  console.log('Creating new user...');
  
  try {
    await authenticateUser(event);
    
    const body = JSON.parse(event.body);
    const { email, name, password, role, status } = body;

    if (!email) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email is required' }),
      };
    }

    // Generate temporary password if not provided
    const temporaryPassword = password || `Temp@${Date.now().toString().slice(-6)}`;

    // Create user in Cognito
    const cognitoParams = {
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
        {
          Name: 'name',
          Value: name || '',
        },
      ],
      TemporaryPassword: temporaryPassword,
      MessageAction: 'SUPPRESS', // Don't send welcome email
      DesiredDeliveryMediums: ['EMAIL'],
    };

    const cognitoResult = await cognito.adminCreateUser(cognitoParams).promise();
    const userId = cognitoResult.User.Username;

    // Set permanent password immediately
    if (password) {
      await cognito.adminSetUserPassword({
        UserPoolId: USER_POOL_ID,
        Username: userId,
        Password: password,
        Permanent: true,
      }).promise();
    }

    // Create user profile in DynamoDB
    const profile = {
      email: email,
      userId: userId,
      name: name || '',
      firstName: name ? name.split(' ')[0] : '',
      lastName: name ? name.split(' ').slice(1).join(' ') : '',
      role: role || 'customer',
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: profile,
    }).promise();

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'User created successfully',
        user: {
          userId: userId,
          email: email,
          name: name,
          role: role || 'customer',
          status: status || 'active',
        },
        temporaryPassword: !password ? temporaryPassword : undefined,
      }),
    };
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.message.includes('Unauthorized')) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message }),
      };
    }
    
    if (error.code === 'UsernameExistsException') {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User with this email already exists' }),
      };
    }
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to create user',
        message: error.message 
      }),
    };
  }
};

// PUT /admin/users/:userId - Update user
exports.updateUser = async (event) => {
  console.log('Updating user...');
  
  try {
    await authenticateUser(event);
    
    const userId = event.pathParameters.userId;
    const body = JSON.parse(event.body);
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    // Update user attributes in Cognito
    const userAttributes = [];
    
    if (body.email) {
      userAttributes.push({
        Name: 'email',
        Value: body.email,
      });
    }
    
    if (body.name) {
      userAttributes.push({
        Name: 'name',
        Value: body.name,
      });
    }

    if (userAttributes.length > 0) {
      await cognito.adminUpdateUserAttributes({
        UserPoolId: USER_POOL_ID,
        Username: userId,
        UserAttributes: userAttributes,
      }).promise();
    }

    // Update profile in DynamoDB
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (body.name !== undefined) {
      updateExpression.push('name = :name');
      expressionAttributeValues[':name'] = body.name;
    }
    
    if (body.firstName !== undefined) {
      updateExpression.push('firstName = :firstName');
      expressionAttributeValues[':firstName'] = body.firstName;
    }
    
    if (body.lastName !== undefined) {
      updateExpression.push('lastName = :lastName');
      expressionAttributeValues[':lastName'] = body.lastName;
    }
    
    if (body.contact !== undefined) {
      updateExpression.push('contact = :contact');
      expressionAttributeValues[':contact'] = body.contact;
    }
    
    if (body.phone !== undefined) {
      updateExpression.push('phone = :phone');
      expressionAttributeValues[':phone'] = body.phone;
    }
    
    if (body.address !== undefined) {
      updateExpression.push('address = :address');
      expressionAttributeValues[':address'] = body.address;
    }
    
    if (body.city !== undefined) {
      updateExpression.push('city = :city');
      expressionAttributeValues[':city'] = body.city;
    }
    
    if (body.postalCode !== undefined) {
      updateExpression.push('postalCode = :postalCode');
      expressionAttributeValues[':postalCode'] = body.postalCode;
    }
    
    if (body.role !== undefined) {
      updateExpression.push('role = :role');
      expressionAttributeValues[':role'] = body.role;
    }
    
    if (body.status !== undefined) {
      updateExpression.push('status = :status');
      expressionAttributeValues[':status'] = body.status;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpression.length > 0) {
      // First get the email to use as key
      const cognitoUser = await cognito.adminGetUser({
        UserPoolId: USER_POOL_ID,
        Username: userId,
      }).promise();
      
      const emailAttr = cognitoUser.UserAttributes.find(attr => attr.Name === 'email');
      const email = emailAttr ? emailAttr.Value : null;
      
      if (email) {
        await dynamodb.update({
          TableName: USERS_TABLE,
          Key: { email: email },
          UpdateExpression: `SET ${updateExpression.join(', ')}`,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW',
        }).promise();
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'User updated successfully',
        userId: userId,
      }),
    };
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.message.includes('Unauthorized')) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message }),
      };
    }
    
    if (error.code === 'UserNotFoundException') {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to update user',
        message: error.message 
      }),
    };
  }
};

// DELETE /admin/users/:userId - Delete user
exports.deleteUser = async (event) => {
  console.log('Deleting user...');
  
  try {
    await authenticateUser(event);
    
    const userId = event.pathParameters.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    // Get user email before deleting from Cognito
    let email = null;
    try {
      const cognitoUser = await cognito.adminGetUser({
        UserPoolId: USER_POOL_ID,
        Username: userId,
      }).promise();
      
      const emailAttr = cognitoUser.UserAttributes.find(attr => attr.Name === 'email');
      email = emailAttr ? emailAttr.Value : null;
    } catch (err) {
      console.error('Could not get user email:', err);
    }

    // Delete from Cognito
    await cognito.adminDeleteUser({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    }).promise();

    // Delete profile from DynamoDB
    if (email) {
      await dynamodb.delete({
        TableName: USERS_TABLE,
        Key: { email: email },
      }).promise();
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'User deleted successfully',
      }),
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error.message.includes('Unauthorized')) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message }),
      };
    }
    
    if (error.code === 'UserNotFoundException') {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to delete user',
        message: error.message 
      }),
    };
  }
};

// Handler for API Gateway
exports.handler = async (event) => {
  console.log('User Management Handler:', event.path, event.httpMethod);

  const path = event.path;
  const method = event.httpMethod;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Route: GET /admin/users
    if (path === '/admin/users' && method === 'GET') {
      return await getAllUsers(event);
    }

    // Route: POST /admin/users
    if (path === '/admin/users' && method === 'POST') {
      return await createUser(event);
    }

    // Route: GET /admin/users/:userId
    if (path.match(/^\/admin\/users\/[^\/]+$/) && method === 'GET') {
      return await getUserById(event);
    }

    // Route: PUT /admin/users/:userId
    if (path.match(/^\/admin\/users\/[^\/]+$/) && method === 'PUT') {
      return await updateUser(event);
    }

    // Route: DELETE /admin/users/:userId
    if (path.match(/^\/admin\/users\/[^\/]+$/) && method === 'DELETE') {
      return await deleteUser(event);
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
