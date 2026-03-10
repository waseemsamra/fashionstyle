const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'fashionstore-orders-prod';
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || 'waseemsamra@gmail.com';

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

      // Send order confirmation email via SES
      try {
        await sendOrderConfirmationEmail(item);
        console.log('✅ Order confirmation email sent to:', item.email);
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError);
        // Don't fail the order if email fails
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Order created successfully',
          orderId,
          email: item.email,
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

    // GET /admin/orders - Get ALL orders (admin only)
    if (method === 'GET' && !userId && event.path.includes('/admin/orders')) {
      console.log('📋 Fetching all orders for admin');
      
      // Scan all orders from DynamoDB
      const params = {
        TableName: ORDERS_TABLE,
        FilterExpression: 'begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':skPrefix': 'ORDER#'
        }
      };
      
      const result = await dynamodb.scan(params).promise();
      
      const orders = result.Items.map(item => ({
        orderId: item.orderId,
        userId: item.userId,
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
      
      // Sort by date (newest first)
      orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log(`✅ Found ${orders.length} orders`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          orders,
          total: orders.length
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

// Send order confirmation email via SES
async function sendOrderConfirmationEmail(order) {
  const emailParams = {
    Source: SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [order.email]
    },
    Message: {
      Subject: {
        Data: `Order Confirmation - ${order.orderId}`,
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #D4AF37;">Thank You for Your Order!</h1>
                  
                  <p>Dear ${order.fullName},</p>
                  
                  <p>Your order has been received and is being processed.</p>
                  
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="color: #D4AF37;">Order Details</h2>
                    <p><strong>Order Number:</strong> ${order.orderId}</p>
                    <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
                    <p><strong>Total Amount:</strong> $${order.totalPrice.toFixed(2)}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                  </div>
                  
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="color: #D4AF37;">Shipping Information</h2>
                    <p>${order.fullName}</p>
                    <p>${order.address}</p>
                    <p>${order.city}, ${order.postalCode}</p>
                    <p>${order.phone}</p>
                  </div>
                  
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="color: #D4AF37;">Items Ordered</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      ${order.items.map((item, index) => `
                        <tr style="border-bottom: 1px solid #ddd;">
                          <td style="padding: 10px 0;">${item.name || `Item ${index + 1}`}</td>
                          <td style="padding: 10px 0; text-align: center;">${item.quantity}</td>
                          <td style="padding: 10px 0; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      `).join('')}
                    </table>
                  </div>
                  
                  <p style="margin-top: 30px;">You can track your order status by visiting your account dashboard.</p>
                  
                  <p>Thank you for shopping with us!</p>
                  
                  <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    If you have any questions, please contact our customer support team.
                  </p>
                </div>
              </body>
            </html>
          `,
          Charset: 'UTF-8'
        },
        Text: {
          Data: `
Thank You for Your Order!

Dear ${order.fullName},

Your order has been received and is being processed.

Order Details:
- Order Number: ${order.orderId}
- Order Date: ${new Date(order.date).toLocaleDateString()}
- Total Amount: $${order.totalPrice.toFixed(2)}
- Payment Method: ${order.paymentMethod}
- Status: ${order.status}

Shipping Information:
${order.fullName}
${order.address}
${order.city}, ${order.postalCode}
${order.phone}

Items Ordered:
${order.items.map((item, index) => `${item.name || `Item ${index + 1}`} - Qty: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

You can track your order status by visiting your account dashboard.

Thank you for shopping with us!

If you have any questions, please contact our customer support team.
          `,
          Charset: 'UTF-8'
        }
      }
    }
  };

  try {
    await ses.sendEmail(emailParams).promise();
    console.log('✅ Order confirmation email sent to:', order.email);
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    throw error;
  }
}
