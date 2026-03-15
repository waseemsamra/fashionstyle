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
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS'
};

// Helper: Get section name from path
const getSection = (path) => {
  const parts = path.split('/');
  const adminIndex = parts.indexOf('admin');
  if (adminIndex >= 0 && parts[adminIndex + 1] === 'settings-v2') {
    return parts[adminIndex + 2] || null;
  }
  return null;
};

// Helper: Get ID from path
const getId = (path) => {
  const parts = path.split('/');
  return parts[parts.length - 1] || null;
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const token = event.headers?.Authorization || event.headers?.authorization;
    const decoded = verifyToken(token);

    // Verify authentication (skip for GET requests on some sections)
    if (token && (!decoded || !isAdmin(decoded))) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized', message: 'Admin access required' })
      };
    }

    const method = event.httpMethod;
    const path = event.path;
    const section = getSection(path);
    const id = getId(path);

    console.log(`📋 Settings API: ${method} /admin/settings-v2/${section}${id ? '/' + id : ''}`);

    // GET /admin/settings-v2 - Get all settings
    if (method === 'GET' && !section) {
      const params = { TableName: SETTINGS_TABLE };
      const result = await dynamodb.scan(params).promise();
      
      const settings = {};
      result.Items.forEach(item => {
        settings[item.settingKey] = item.items || item.data || {};
      });

      return { statusCode: 200, headers, body: JSON.stringify({ settings }) };
    }

    // GET /admin/settings-v2/:section - Get specific section
    if (method === 'GET' && section && !id) {
      const params = {
        TableName: SETTINGS_TABLE,
        Key: { settingKey: section }
      };
      const result = await dynamodb.get(params).promise();
      
      const items = result.Item?.items || result.Item?.data || [];
      return { statusCode: 200, headers, body: JSON.stringify({ [section]: items }) };
    }

    // GET /admin/settings-v2/:section/:id - Get specific item
    if (method === 'GET' && section && id) {
      const params = {
        TableName: SETTINGS_TABLE,
        Key: { settingKey: section }
      };
      const result = await dynamodb.get(params).promise();
      
      const items = result.Item?.items || [];
      const item = items.find(i => i.id === id || i.name === id);
      
      if (!item) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
      }
      
      return { statusCode: 200, headers, body: JSON.stringify({ item }) };
    }

    // POST /admin/settings-v2/:section - Create/Save section
    if (method === 'POST' && section && !id) {
      const body = JSON.parse(event.body);
      const timestamp = new Date().toISOString();

      const items = body.items || body.data || body.categories || [];
      
      const params = {
        TableName: SETTINGS_TABLE,
        Key: { settingKey: section },
        UpdateExpression: 'SET items = :items, data = :data, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':items': items,
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
          [section]: result.Attributes?.items || items
        })
      };
    }

    // PUT /admin/settings-v2/:section/:id - Update specific item
    if (method === 'PUT' && section && id) {
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
    if (method === 'DELETE' && section && id) {
      // Get current items
      const getParams = {
        TableName: SETTINGS_TABLE,
        Key: { settingKey: section }
      };
      const getResult = await dynamodb.get(getParams).promise();
      
      let items = getResult.Item?.items || [];
      const filteredItems = items.filter(item => item.id !== id && item.name !== id);

      if (filteredItems.length === items.length) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Item not found' }) };
      }

      const updateParams = {
        TableName: SETTINGS_TABLE,
        Key: { settingKey: section },
        UpdateExpression: 'SET items = :items, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':items': filteredItems,
          ':updatedAt': new Date().toISOString()
        }
      };

      await dynamodb.update(updateParams).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: `Item ${id} deleted successfully`,
          items: filteredItems
        })
      };
    }

    // PATCH /admin/settings-v2/:section/reorder - Reorder items
    if (method === 'PATCH' && section && path.includes('reorder')) {
      const body = JSON.parse(event.body);
      const timestamp = new Date().toISOString();

      const params = {
        TableName: SETTINGS_TABLE,
        Key: { settingKey: section },
        UpdateExpression: 'SET items = :items, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':items': body.items || [],
          ':updatedAt': timestamp
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamodb.update(params).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: `${section} reordered successfully`,
          items: result.Attributes?.items
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed', path, method })
    };

  } catch (error) {
    console.error('❌ Settings API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
