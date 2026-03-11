const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

const USERS_TABLE = process.env.USERS_TABLE || 'Users';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Credentials': true
};

exports.handler = async (event) => {
  console.log('📧 Received event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { email, firstName, lastName, tempPassword } = body;

    // Validate required fields
    if (!email || !tempPassword) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'email and tempPassword are required'
        })
      };
    }

    // Create welcome email HTML
    const htmlContent = `
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
      <p><strong>Your Login Credentials:</strong></p>
      <p>📧 Email: ${email}</p>
      <p>🔑 Temporary Password: <code style="background: #eee; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code></p>
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
    `;

    // Plain text version
    const textContent = `
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
    `;

    // Send email via SES
    const params = {
      Source: 'Pakistani Fashion <noreply@yourdomain.com>',
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: 'Welcome to Pakistani Fashion - Your Account Credentials'
        },
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: textContent
          },
          Html: {
            Charset: 'UTF-8',
            Data: htmlContent
          }
        }
      },
      Tags: [
        { Name: 'type', Value: 'welcome-email' },
        { Name: 'user', Value: email }
      ]
    };

    console.log('📧 Sending email to:', email);
    const result = await ses.sendEmail(params).promise();
    console.log('✅ Email sent successfully:', result.MessageId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: result.MessageId
      })
    };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to send welcome email',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
