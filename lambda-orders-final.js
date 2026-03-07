const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'fashionstore-orders-prod';

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

    // POST /users/{userId}/orders - Create a new order
    if (method === 'POST') {
      const orderData = JSON.parse(event.body);
      const orderId = `ORD-${Date.now().toString()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const timestamp = new Date().toISOString();

      const item = {
        orderId,
        userId,  // For GSI query
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
        TableName: ORDERS_TABLE,
        Item: item
      }).promise();

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          message: 'Order created successfully',
          orderId,
          total: orderData.totalPrice
        })
      };
    }

    // GET /users/{userId}/orders - Get all orders for a user (using GSI)
    if (method === 'GET' && !orderId) {
      // Query using GSI (userId-index)
      const params = {
        TableName: ORDERS_TABLE,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
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
        body: JSON.stringify({ 
          message: 'Orders function is working',
          userId,
          orders,
          totalOrders: orders.length
        })
      };
    }

    // GET /users/{userId}/orders/{orderId} - Get a specific order
    if (method === 'GET' && orderId) {
      const result = await dynamodb.get({
        TableName: ORDERS_TABLE,
        Key: { orderId }
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
