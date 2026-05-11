const AWS = require('aws-sdk');

// DynamoDB client
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const TABLE_NAME = process.env.ORDERS_TABLE || 'fashionstore-orders';

// Enhanced CORS headers for Amplify compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // Allow all origins for Amplify
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,Authorization,X-Amz-Security-Token,X-Amz-User-Agent,X-Amz-Content-Sha256,X-Amz-Content-Type,X-Amz-User-Agent,X-Amz-Target',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,HEAD',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

function createResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  console.log('📦 Orders API Lambda called:', JSON.stringify(event, null, 2));
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('🔧 CORS preflight request');
    return createResponse(200, {});
  }

  const path = event.path || event.pathParameters?.proxy || '';
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  const pathParts = path.replace(/^\//, '').split('/');

  console.log('📋 Path:', path, 'Method:', httpMethod, 'Path parts:', pathParts);

  try {
    // GET /orders - List all orders
    if (httpMethod === 'GET' && pathParts[0] === 'orders' && pathParts.length === 1) {
      console.log('📋 Getting all orders');
      const params = {
        TableName: TABLE_NAME
      };
      const result = await dynamodb.scan(params).promise();
      
      const orders = result.Items || [];
      console.log('📋 Found orders:', orders.length);
      
      return createResponse(200, {
        items: orders,
        total: orders.length
      });
    }

    // GET /orders/{orderId} - Get specific order
    if (httpMethod === 'GET' && pathParts[0] === 'orders' && pathParts.length === 2) {
      const orderId = pathParts[1];
      console.log('📋 Getting order:', orderId);
      
      const params = {
        TableName: TABLE_NAME,
        Key: { orderId: orderId }
      };
      const result = await dynamodb.get(params).promise();
      
      if (!result.Item) {
        return createResponse(404, { error: 'Order not found' });
      }
      
      return createResponse(200, result.Item);
    }

    // PUT /orders/{orderId} - Update order status
    if (httpMethod === 'PUT' && pathParts[0] === 'orders' && pathParts.length === 2) {
      const orderId = pathParts[1];
      console.log('🔄 Updating order:', orderId);
      
      let requestBody;
      try {
        requestBody = JSON.parse(event.body || '{}');
      } catch (e) {
        console.error('❌ Invalid JSON body:', e);
        return createResponse(400, { error: 'Invalid JSON body' });
      }
      
      console.log('🔄 Request body:', requestBody);
      
      if (!requestBody.status) {
        return createResponse(400, { error: 'Status field is required' });
      }
      
      // Get current order
      const getParams = {
        TableName: TABLE_NAME,
        Key: { orderId: orderId }
      };
      const currentOrder = await dynamodb.get(getParams).promise();
      
      if (!currentOrder.Item) {
        return createResponse(404, { error: 'Order not found' });
      }
      
      // Update order status
      const updateParams = {
        TableName: TABLE_NAME,
        Key: { orderId: orderId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': requestBody.status,
          ':updatedAt': new Date().toISOString()
        }
      };
      
      const updateResult = await dynamodb.update(updateParams).promise();
      console.log('✅ Order updated successfully');
      
      return createResponse(200, {
        ...currentOrder.Item,
        ...updateResult.Attributes,
        status: requestBody.status
      });
    }

    // DELETE /orders/{orderId} - Delete order
    if (httpMethod === 'DELETE' && pathParts[0] === 'orders' && pathParts.length === 2) {
      const orderId = pathParts[1];
      console.log('🗑️ Deleting order:', orderId);
      
      const params = {
        TableName: TABLE_NAME,
        Key: { orderId: orderId }
      };
      
      await dynamodb.delete(params).promise();
      console.log('✅ Order deleted successfully');
      
      return createResponse(200, { message: 'Order deleted successfully' });
    }

    // POST /orders - Create new order
    if (httpMethod === 'POST' && pathParts[0] === 'orders' && pathParts.length === 1) {
      console.log('📦 Creating new order');
      
      let orderData;
      try {
        orderData = JSON.parse(event.body || '{}');
      } catch (e) {
        console.error('❌ Invalid JSON body:', e);
        return createResponse(400, { error: 'Invalid JSON body' });
      }
      
      // Generate order ID if not provided
      if (!orderData.orderId) {
        orderData.orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Add timestamps
      orderData.createdAt = new Date().toISOString();
      orderData.updatedAt = new Date().toISOString();
      orderData.status = orderData.status || 'pending';
      
      const params = {
        TableName: TABLE_NAME,
        Item: orderData
      };
      
      await dynamodb.put(params).promise();
      console.log('✅ Order created successfully:', orderData.orderId);
      
      return createResponse(201, orderData);
    }

    return createResponse(404, { error: 'Endpoint not found' });

  } catch (error) {
    console.error('❌ Lambda error:', error);
    return createResponse(500, { error: 'Internal server error', details: error.message });
  }
};
