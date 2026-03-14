const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const SETTINGS_TABLE = process.env.SETTINGS_TABLE || 'fashionstore-settings-prod';
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
  return decoded && (decoded.role === 'admin' || decoded.email?.includes('admin') || decoded.email === 'waseemsamra@gmail.com');
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS'
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const token = event.headers?.Authorization || event.headers?.authorization;
    const decoded = verifyToken(token);

    // Verify authentication for all endpoints
    if (!decoded || !isAdmin(decoded)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized', message: 'Admin access required' })
      };
    }

    const method = event.httpMethod;

    // GET /admin/settings - Get all settings
    if (method === 'GET') {
      const params = {
        TableName: SETTINGS_TABLE,
        Key: {
          settingKey: 'general'
        }
      };

      const result = await dynamodb.get(params).promise();
      
      const settings = result.Item || {
        settingKey: 'general',
        currency: 'USD',
        taxRate: 0,
        shippingFee: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ settings })
      };
    }

    // POST/PUT /admin/settings - Update settings
    if (method === 'POST' || method === 'PUT') {
      const body = JSON.parse(event.body);
      const timestamp = new Date().toISOString();

      const params = {
        TableName: SETTINGS_TABLE,
        Key: {
          settingKey: 'general'
        },
        UpdateExpression: 'SET currency = :currency, taxRate = :taxRate, shippingFee = :shippingFee, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':currency': body.currency || 'USD',
          ':taxRate': body.taxRate || 0,
          ':shippingFee': body.shippingFee || 0,
          ':updatedAt': timestamp
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamodb.update(params).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Settings updated successfully',
          settings: result.Attributes
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
