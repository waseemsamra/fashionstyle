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

    // Verify authentication
    if (!decoded || !isAdmin(decoded)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized', message: 'Admin access required' })
      };
    }

    const method = event.httpMethod;
    const path = event.path;

    // GET /admin/settings-v2 - Get all settings
    if (method === 'GET' && path.includes('/admin/settings-v2')) {
      const params = {
        TableName: SETTINGS_TABLE
      };

      const result = await dynamodb.scan(params).promise();
      
      const settings = {};
      result.Items.forEach(item => {
        settings[item.settingKey] = item.items || item.data || {};
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ settings })
      };
    }

    // POST /admin/settings-v2/:section - Save specific section
    if (method === 'POST' && path.includes('/admin/settings-v2/')) {
      const section = path.split('/').pop(); // Get last part of path
      const body = JSON.parse(event.body);
      const timestamp = new Date().toISOString();

      const params = {
        TableName: SETTINGS_TABLE,
        Key: {
          settingKey: section
        },
        UpdateExpression: 'SET items = :items, data = :data, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':items': body.items || body.categories || body.data || [],
          ':data': body,
          ':updatedAt': timestamp
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamodb.update(params).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: `${section} saved successfully`,
          [section]: result.Attributes?.items || result.Attributes?.data || body
        })
      };
    }

    // PUT /admin/settings-v2/:section/:id - Update specific item
    if (method === 'PUT' && path.includes('/admin/settings-v2/')) {
      const parts = path.split('/');
      const section = parts[parts.indexOf('admin') + 2];
      const id = parts.pop(); // Get last part (item ID)
      const body = JSON.parse(event.body);
      const timestamp = new Date().toISOString();

      // Get current items
      const getParams = {
        TableName: SETTINGS_TABLE,
        Key: { settingKey: section }
      };
      const getResult = await dynamodb.get(getParams).promise();
      
      let items = getResult.Item?.items || [];
      const itemIndex = items.findIndex(item => item.id === id || item.name === id);
      
      if (itemIndex >= 0) {
        // Update existing
        items[itemIndex] = { ...items[itemIndex], ...body, updatedAt: timestamp };
      } else {
        // Add new
        items.push({ ...body, id, updatedAt: timestamp });
      }

      const updateParams = {
        TableName: SETTINGS_TABLE,
        Key: { settingKey: section },
        UpdateExpression: 'SET items = :items, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':items': items,
          ':updatedAt': timestamp
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamodb.update(updateParams).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: `Item ${id} saved successfully`,
          items: result.Attributes?.items
        })
      };
    }

    // DELETE /admin/settings-v2/:section/:id - Delete specific item
    if (method === 'DELETE' && path.includes('/admin/settings-v2/')) {
      const parts = path.split('/');
      const section = parts[parts.indexOf('admin') + 2];
      const id = parts.pop();

      // Get current items
      const getParams = {
        TableName: SETTINGS_TABLE,
        Key: { settingKey: section }
      };
      const getResult = await dynamodb.get(getParams).promise();
      
      let items = getResult.Item?.items || [];
      items = items.filter(item => item.id !== id && item.name !== id);

      const updateParams = {
        TableName: SETTINGS_TABLE,
        Key: { settingKey: section },
        UpdateExpression: 'SET items = :items, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':items': items,
          ':updatedAt': new Date().toISOString()
        }
      };

      await dynamodb.update(updateParams).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: `Item ${id} deleted successfully`,
          items: items
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
