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
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
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
    const path = event.path;

    // GET /admin/settings/categories - Get all categories
    if (method === 'GET' && path.includes('/categories')) {
      const params = {
        TableName: SETTINGS_TABLE,
        Key: {
          settingKey: 'categories'
        }
      };

      const result = await dynamodb.get(params).promise();
      
      const categories = result.Item?.items || [];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ categories })
      };
    }

    // POST /admin/settings/categories - Save all categories
    if (method === 'POST' && path.includes('/categories')) {
      const body = JSON.parse(event.body);
      const timestamp = new Date().toISOString();

      const params = {
        TableName: SETTINGS_TABLE,
        Key: {
          settingKey: 'categories'
        },
        UpdateExpression: 'SET items = :items, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':items': body.categories || [],
          ':updatedAt': timestamp
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamodb.update(params).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Categories saved successfully',
          categories: result.Attributes?.items || []
        })
      };
    }

    // GET /admin/settings - Get all settings
    if (method === 'GET' && !path.includes('/categories')) {
      // Get all settings from DynamoDB
      const params = {
        TableName: SETTINGS_TABLE
      };

      const result = await dynamodb.scan(params).promise();
      
      const settings = {};
      result.Items.forEach(item => {
        settings[item.settingKey] = item.items || item;
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ settings })
      };
    }

    // POST /admin/settings - Save settings
    if (method === 'POST' && !path.includes('/categories')) {
      const body = JSON.parse(event.body);
      const timestamp = new Date().toISOString();

      // Save general settings
      const params = {
        TableName: SETTINGS_TABLE,
        Key: {
          settingKey: 'general'
        },
        UpdateExpression: 'SET currency = :currency, taxRate = :taxRate, shippingFee = :shippingFee, storeName = :storeName, storeEmail = :storeEmail, storePhone = :storePhone, storeAddress = :storeAddress, description = :description, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':currency': body.currency || 'USD',
          ':taxRate': body.taxRate || 0,
          ':shippingFee': body.shippingFee || 0,
          ':storeName': body.storeName || '',
          ':storeEmail': body.storeEmail || '',
          ':storePhone': body.storePhone || '',
          ':storeAddress': body.storeAddress || '',
          ':description': body.description || '',
          ':updatedAt': timestamp
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamodb.update(params).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Settings saved successfully',
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
