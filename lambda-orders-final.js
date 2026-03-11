const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

const ORDERS_TABLE = process.env.ORDERS_TABLE || 'fashionstore-orders-prod';
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || 'waseemsamra@gmail.com';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Amz-Security-Token,X-Amz-User-Agent',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': true
  };

  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ CORS preflight request for:', event.path);
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
        console.error('❌ Failed to send order confirmation email:', emailError);
        // Don't fail the order if email fails
      }

      // Send welcome email with login credentials for guest users
      if (orderData.isGuest || orderData.isGuestOrder) {
        try {
          const tempPassword = generateTempPassword();
          await sendWelcomeEmail({
            email: item.email,
            firstName: orderData.firstName || item.fullName.split(' ')[0],
            lastName: orderData.lastName || item.fullName.split(' ')[1] || '',
            tempPassword: tempPassword
          });
          console.log('✅ Welcome email with credentials sent to:', item.email);
        } catch (emailError) {
          console.error('❌ Failed to send welcome email:', emailError);
          // Don't fail the order if welcome email fails
        }
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

    // PUT /users/{userId}/orders/{orderId} - Update order status
    if (method === 'PUT' && orderId) {
      const body = JSON.parse(event.body);
      const timestamp = new Date().toISOString();

      // Get existing order
      const existingOrder = await dynamodb.get({
        TableName: ORDERS_TABLE,
        Key: {
          PK: `USER#${userId}`,
          SK: `ORDER#${orderId}`
        }
      }).promise();

      if (!existingOrder.Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Order not found' })
        };
      }

      // Update order status
      const updateExpression = [];
      const expressionAttributeValues = {};

      if (body.status) {
        updateExpression.push('status = :status');
        expressionAttributeValues[':status'] = body.status;
      }

      updateExpression.push('updatedAt = :updatedAt');
      expressionAttributeValues[':updatedAt'] = timestamp;

      await dynamodb.update({
        TableName: ORDERS_TABLE,
        Key: {
          PK: `USER#${userId}`,
          SK: `ORDER#${orderId}`
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues
      }).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Order updated successfully',
          orderId,
          status: body.status
        })
      };
    }

    // OPTIONS /users/{userId}/orders/{orderId} - CORS preflight
    if (method === 'OPTIONS' && orderId) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS'
        },
        body: ''
      };
    }

    // DELETE /users/{userId}/orders/{orderId} - Delete order
    if (method === 'DELETE' && orderId) {
      await dynamodb.delete({
        TableName: ORDERS_TABLE,
        Key: {
          PK: `USER#${userId}`,
          SK: `ORDER#${orderId}`
        }
      }).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Order deleted successfully',
          orderId
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

// Generate a secure temporary password
function generateTempPassword() {
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  let password = '';
  password += upperCase[Math.floor(Math.random() * upperCase.length)];
  password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  const allChars = upperCase + lowerCase + numbers + symbols;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Send welcome email with login credentials
async function sendWelcomeEmail(userData) {
  const { email, firstName, lastName, tempPassword } = userData;
  
  const emailParams = {
    Source: SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Subject: {
        Data: '🎉 Welcome to Pakistani Fashion - Your Account Credentials',
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .container {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  border-radius: 10px;
                  padding: 30px;
                  color: white;
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .header h1 {
                  margin: 0;
                  font-size: 28px;
                }
                .content {
                  background: white;
                  color: #333;
                  border-radius: 8px;
                  padding: 25px;
                  margin-top: 20px;
                }
                .credentials {
                  background: #f8f9fa;
                  border-left: 4px solid #667eea;
                  padding: 15px;
                  margin: 20px 0;
                  border-radius: 4px;
                }
                .credentials p {
                  margin: 5px 0;
                }
                .credentials strong {
                  color: #667eea;
                }
                .credentials code {
                  background: #eee;
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-family: monospace;
                }
                .button {
                  display: inline-block;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  text-decoration: none;
                  padding: 12px 30px;
                  border-radius: 5px;
                  margin-top: 20px;
                  font-weight: bold;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #eee;
                  font-size: 12px;
                  color: #666;
                }
                .warning {
                  background: #fff3cd;
                  border: 1px solid #ffc107;
                  color: #856404;
                  padding: 15px;
                  border-radius: 4px;
                  margin: 20px 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Welcome to Pakistani Fashion!</h1>
                </div>
              </div>
              
              <div class="content">
                <p>Dear ${firstName || 'Valued Customer'},</p>
                
                <p>Thank you for shopping with us! We've created a guest account for you to track your orders and manage your profile.</p>
                
                <div class="credentials">
                  <p><strong>🔐 Your Login Credentials:</strong></p>
                  <p>📧 Email: <strong>${email}</strong></p>
                  <p>🔑 Temporary Password: <code>${tempPassword}</code></p>
                </div>
                
                <div class="warning">
                  ⚠️ <strong>Important:</strong> Please change your temporary password after your first login for security reasons.
                </div>
                
                <p style="text-align: center;">
                  <a href="https://main.d1l8ayoz0simv1.amplifyapp.com/login" class="button">Login to Your Account</a>
                </p>
                
                <p>With your account, you can:</p>
                <ul>
                  <li>✨ Track your order status in real-time</li>
                  <li>📦 View your order history</li>
                  <li>👤 Manage your profile and addresses</li>
                  <li>❤️ Save items to your wishlist</li>
                  <li>🛍️ Enjoy faster checkout next time</li>
                </ul>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Best regards,<br>
                <strong>The Pakistani Fashion Team</strong></p>
              </div>
              
              <div class="footer">
                <p>This email was sent to ${email}</p>
                <p>© ${new Date().getFullYear()} Pakistani Fashion. All rights reserved.</p>
                <p>If you didn't create this account, please ignore this email.</p>
              </div>
            </body>
            </html>
          `,
          Charset: 'UTF-8'
        },
        Text: {
          Data: `
Welcome to Pakistani Fashion!

Dear ${firstName || 'Valued Customer'},

Thank you for shopping with us! We've created a guest account for you.

Your Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

IMPORTANT: Please change your temporary password after your first login.

Login here: https://main.d1l8ayoz0simv1.amplifyapp.com/login

With your account, you can:
- Track your order status in real-time
- View your order history
- Manage your profile and addresses
- Save items to your wishlist
- Enjoy faster checkout next time

If you have any questions, feel free to reach out to our support team.

Best regards,
The Pakistani Fashion Team

---
This email was sent to ${email}
© ${new Date().getFullYear()} Pakistani Fashion. All rights reserved.
          `,
          Charset: 'UTF-8'
        }
      }
    }
  };

  try {
    await ses.sendEmail(emailParams).promise();
    console.log('✅ Welcome email sent to:', email);
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw error;
  }
}
