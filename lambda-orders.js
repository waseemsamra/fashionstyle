const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const userId = event.pathParameters?.userId;
    const orderId = event.pathParameters?.orderId;
    const method = event.httpMethod;

    // GET /users/{userId}/orders - Get all orders for a user
    if (method === 'GET' && !orderId) {
      const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':skPrefix': 'ORDER#'
        }
      };

      const result = await dynamodb.query(params).promise();
      
      const orders = result.Items.map(item => ({
        orderId: item.orderId,
        date: item.date,
        items: item.items,
        totalPrice: item.totalPrice,
        paymentMethod: item.paymentMethod,
        status: item.status,
        fullName: item.fullName,
        email: item.email,
        phone: item.phone,
        address: item.address,
        city: item.city,
        postalCode: item.postalCode,
        itemCount: item.itemCount,
        createdAt: item.createdAt
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ items: orders })
      };
    }

    // GET /users/{userId}/orders/{orderId} - Get a specific order
    if (method === 'GET' && orderId) {
      const result = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: { 
          PK: `USER#${userId}`, 
          SK: `ORDER#${orderId}` 
        }
      }).promise();

      if (!result.Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Order not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Item)
      };
    }

    // POST /users/{userId}/orders - Create a new order
    if (method === 'POST') {
      const orderData = JSON.parse(event.body);
      const orderId = orderData.orderId || `ORD-${Date.now().toString().slice(-8)}`;
      const timestamp = new Date().toISOString();

      const item = {
        PK: `USER#${userId}`,
        SK: `ORDER#${orderId}`,
        orderId,
        date: orderData.date || timestamp,
        items: orderData.items,
        totalPrice: orderData.totalPrice,
        paymentMethod: orderData.paymentMethod,
        status: orderData.status || 'Processing',
        fullName: orderData.fullName,
        email: orderData.email,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        postalCode: orderData.postalCode,
        itemCount: orderData.itemCount || orderData.items?.length || 0,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: item
      }).promise();

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          message: 'Order created successfully',
          orderId,
          order: item 
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
