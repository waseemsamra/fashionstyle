const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

const TABLE_NAME = process.env.NOTIFICATIONS_TABLE || 'fashionstore-notifications-prod';
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'fashionstore-orders-prod';
const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@fashionstore.com';

// Notification templates
const templates = {
  order_confirmed: {
    subject: 'Order Confirmed - Fashion Store',
    email: (data) => `
      <h1>Order Confirmed!</h1>
      <p>Hi ${data.customerName},</p>
      <p>Your order #${data.orderId} has been confirmed.</p>
      <h3>Order Summary:</h3>
      <ul>
        ${data.items.map(item => `<li>${item.name} x ${item.quantity} - $${item.price}</li>`).join('')}
      </ul>
      <p><strong>Total:</strong> $${data.total}</p>
      <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
      <p>We'll notify you when your order ships!</p>
    `,
    sms: (data) => `Order #${data.orderId} confirmed! Total: $${data.total}. We'll notify you when it ships.`
  },
  
  order_shipped: {
    subject: 'Your Order Has Shipped! - Fashion Store',
    email: (data) => `
      <h1>Your Order Has Shipped!</h1>
      <p>Hi ${data.customerName},</p>
      <p>Good news! Your order #${data.orderId} has been shipped.</p>
      <h3>Shipping Details:</h3>
      <p><strong>Carrier:</strong> ${data.carrier}</p>
      <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
      <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
      <p>Track your package: <a href="${data.trackingUrl}">${data.trackingUrl}</a></p>
    `,
    sms: (data) => `Your order #${data.orderId} has shipped! Track: ${data.trackingUrl}`
  },
  
  out_for_delivery: {
    subject: 'Out for Delivery - Fashion Store',
    email: (data) => `
      <h1>Out for Delivery!</h1>
      <p>Hi ${data.customerName},</p>
      <p>Your order #${data.orderId} is out for delivery today!</p>
      <p><strong>Expected Delivery Time:</strong> ${data.deliveryWindow}</p>
      <p>Track your package: <a href="${data.trackingUrl}">${data.trackingUrl}</a></p>
    `,
    sms: (data) => `Your order #${data.orderId} is out for delivery today! Expected between ${data.deliveryWindow}`
  },
  
  delivered: {
    subject: 'Order Delivered - Fashion Store',
    email: (data) => `
      <h1>Order Delivered!</h1>
      <p>Hi ${data.customerName},</p>
      <p>Your order #${data.orderId} has been delivered.</p>
      <p>Thank you for shopping with Fashion Store!</p>
      <p>We'd love to hear your feedback: <a href="${data.reviewUrl}">Leave a Review</a></p>
    `,
    sms: (data) => `Your order #${data.orderId} has been delivered! Thank you for shopping with Fashion Store!`
  },
  
  delivery_exception: {
    subject: 'Delivery Exception - Fashion Store',
    email: (data) => `
      <h1>Delivery Exception</h1>
      <p>Hi ${data.customerName},</p>
      <p>There's an issue with your delivery for order #${data.orderId}.</p>
      <p><strong>Issue:</strong> ${data.exception}</p>
      <p><strong>Resolution:</strong> ${data.resolution}</p>
      <p>Contact us if you need assistance: support@fashionstore.com</p>
    `,
    sms: (data) => `Delivery issue for order #${data.orderId}: ${data.exception}. Check email for details.`
  },
  
  delivery_reminder: {
    subject: 'Delivery Tomorrow - Fashion Store',
    email: (data) => `
      <h1>Your Package Arrives Tomorrow!</h1>
      <p>Hi ${data.customerName},</p>
      <p>Your order #${data.orderId} is scheduled for delivery tomorrow.</p>
      <p><strong>Estimated Time:</strong> ${data.deliveryWindow}</p>
      <p>Track your package: <a href="${data.trackingUrl}">${data.trackingUrl}</a></p>
    `,
    sms: (data) => `Your order #${data.orderId} arrives tomorrow between ${data.deliveryWindow}!`
  }
};

exports.handler = async (event) => {
  console.log('📨 DELIVERY NOTIFICATIONS SERVICE INVOKED');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const headers = {
    'Access-Control-Allow-Origin': event.headers?.origin || '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  const path = event.path;
  const method = event.httpMethod;
  let body = {};
  
  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid JSON body' })
    };
  }
  
  try {
    // Route handling
    if (path === '/admin/delivery/notifications/send') {
      return await sendNotification(body, headers);
    } else if (path === '/admin/delivery/notifications/preferences') {
      return await handlePreferences(method, body, headers);
    } else if (path === '/admin/delivery/notifications/history') {
      return await getNotificationHistory(body, headers);
    } else if (path.match(/^\/admin\/delivery\/notifications\/order\/[^\/]+$/)) {
      const orderId = path.split('/').pop();
      return await getOrderNotifications(orderId, headers);
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Route not found' })
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

async function sendNotification(data, headers) {
  console.log('📨 Sending notification:', data);
  
  const { type, orderId, customerId, channel } = data;
  const template = templates[type];
  
  if (!template) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid notification type' })
    };
  }
  
  // Get order details
  const order = await getOrderDetails(orderId);
  if (!order) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Order not found' })
    };
  }
  
  // Get customer preferences
  const prefs = await getNotificationPreferences(customerId);
  
  const results = [];
  
  // Send email if enabled
  if (prefs.email && (!channel || channel === 'email')) {
    try {
      await sendEmail({
        to: order.customerEmail,
        subject: template.subject,
        html: template.email(order)
      });
      results.push({ channel: 'email', status: 'sent' });
      
      // Log notification
      await logNotification({
        orderId,
        customerId,
        type,
        channel: 'email',
        status: 'sent',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Email send failed:', error);
      results.push({ channel: 'email', status: 'failed', error: error.message });
    }
  }
  
  // Send SMS if enabled
  if (prefs.sms && prefs.phoneNumber && (!channel || channel === 'sms')) {
    try {
      await sendSMS({
        phoneNumber: prefs.phoneNumber,
        message: template.sms(order)
      });
      results.push({ channel: 'sms', status: 'sent' });
      
      // Log notification
      await logNotification({
        orderId,
        customerId,
        type,
        channel: 'sms',
        status: 'sent',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('SMS send failed:', error);
      results.push({ channel: 'sms', status: 'failed', error: error.message });
    }
  }
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Notifications processed',
      results
    })
  };
}

async function handlePreferences(method, body, headers) {
  switch (method) {
    case 'GET':
    case 'POST':
      const { customerId } = body;
      const prefs = await getNotificationPreferences(customerId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(prefs)
      };
      
    case 'PUT':
      const { customerId: id, preferences } = body;
      await saveNotificationPreferences(id, preferences);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Preferences updated' })
      };
      
    default:
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: 'Method not allowed' })
      };
  }
}

async function getOrderDetails(orderId) {
  const params = {
    TableName: ORDERS_TABLE,
    Key: { orderId }
  };
  
  const result = await docClient.send(new GetCommand(params));
  return result.Item;
}

async function getNotificationPreferences(customerId) {
  const params = {
    TableName: TABLE_NAME,
    Key: { customerId, type: 'preferences' }
  };
  
  const result = await docClient.send(new GetCommand(params));
  
  if (result.Item) {
    return result.Item.preferences;
  }
  
  // Default preferences
  return {
    email: true,
    sms: false,
    phoneNumber: null,
    orderConfirmed: true,
    orderShipped: true,
    outForDelivery: true,
    delivered: true,
    exceptions: true,
    reminders: true
  };
}

async function saveNotificationPreferences(customerId, preferences) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      customerId,
      type: 'preferences',
      preferences,
      updatedAt: new Date().toISOString()
    }
  };
  
  await docClient.send(new PutCommand(params));
}

async function logNotification(notification) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      ...notification,
      type: 'history',
      id: `${notification.orderId}_${notification.timestamp}`
    }
  };
  
  await docClient.send(new PutCommand(params));
}

async function sendEmail({ to, subject, html }) {
  const params = {
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: html } }
    }
  };
  
  await sesClient.send(new SendEmailCommand(params));
}

async function sendSMS({ phoneNumber, message }) {
  const params = {
    PhoneNumber: phoneNumber,
    Message: message
  };
  
  await snsClient.send(new PublishCommand(params));
}

async function getNotificationHistory(data, headers) {
  const { customerId, limit = 50 } = data;
  
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'customerId = :customerId AND begins_with(#type, :type)',
    ExpressionAttributeNames: { '#type': 'type' },
    ExpressionAttributeValues: {
      ':customerId': customerId,
      ':type': 'history'
    },
    Limit: limit,
    ScanIndexForward: false // Most recent first
  };
  
  const result = await docClient.send(new QueryCommand(params));
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Items)
  };
}

async function getOrderNotifications(orderId, headers) {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: '#type = :type AND begins_with(id, :orderId)',
    ExpressionAttributeNames: { '#type': 'type' },
    ExpressionAttributeValues: {
      ':type': 'history',
      ':orderId': orderId
    }
  };
  
  const result = await docClient.send(new ScanCommand(params));
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Items)
  };
}
