// src/services/emailService.ts
// Email service using Resend API

interface EmailData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
}

interface EmailTemplate {
  orderConfirmation: {
    orderId: string;
    customerName: string;
    email: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      image?: string;
    }>;
    total: number;
    shippingAddress: {
      fullName: string;
      address: string;
      city: string;
      postalCode: string;
      phone: string;
    };
    paymentMethod: string;
  };
  welcomeEmail: {
    name: string;
    email: string;
    loginUrl?: string;
  };
  passwordReset: {
    name: string;
    email: string;
    resetToken: string;
    resetUrl: string;
  };
}

class EmailService {
  private apiKey: string;
  private baseUrl: string = 'https://api.resend.com';
  private fromEmail: string = 'noreply@fashionstyle.com'; // Configure this in Amplify environment variables

  constructor() {
    this.apiKey = import.meta.env.VITE_RESEND_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ Resend API key not found. Email functionality will be disabled.');
      console.log('📝 Set VITE_RESEND_API_KEY in your Amplify environment variables');
    }
  }

  private async sendEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Resend API key not configured'
        };
      }

      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: data.from || this.fromEmail,
          to: Array.isArray(data.to) ? data.to : [data.to],
          subject: data.subject,
          html: data.html,
          text: data.text,
          reply_to: data.replyTo,
          attachments: data.attachments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Email send failed:', errorData);
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`
        };
      }

      const result = await response.json();
      console.log('✅ Email sent successfully:', result.id);
      
      return {
        success: true,
        messageId: result.id
      };
    } catch (error: any) {
      console.error('❌ Email service error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Order confirmation email template
  async sendOrderConfirmation(data: EmailTemplate['orderConfirmation']): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { orderId, customerName, email, items, total, shippingAddress, paymentMethod } = data;

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : ''}
            <div>
              <div style="font-weight: 600; color: #333;">${item.name}</div>
              <div style="color: #666; font-size: 14px;">Qty: ${item.quantity}</div>
            </div>
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - ${orderId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0; }
          .logo { font-size: 24px; font-weight: bold; color: #333; }
          .content { padding: 30px 0; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #333; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .info-item { margin-bottom: 10px; }
          .info-label { font-weight: 600; color: #666; }
          .total-section { background: #f8f9fa; padding: 20px; border-radius: 8px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .total-final { font-size: 18px; font-weight: bold; color: #333; border-top: 2px solid #333; padding-top: 10px; }
          .footer { text-align: center; padding: 30px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">FashionStyle</div>
            <h1 style="margin: 10px 0 0 0; font-size: 28px; color: #333;">Order Confirmation</h1>
          </div>

          <div class="content">
            <div class="section">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hi ${customerName},<br>
                Thank you for your order! We've received your order and it's now being processed.
              </p>
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                <strong>Order ID:</strong> ${orderId}<br>
                <strong>Status:</strong> Processing
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">Order Items</h2>
              <table>
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid #333;">Product</th>
                    <th style="text-align: right; padding: 12px; border-bottom: 2px solid #333;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2 class="section-title">Order Details</h2>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <span class="info-label">Shipping Address:</span><br>
                    ${shippingAddress.fullName}<br>
                    ${shippingAddress.address}<br>
                    ${shippingAddress.city}, ${shippingAddress.postalCode}<br>
                    ${shippingAddress.phone}
                  </div>
                  <div class="info-item">
                    <span class="info-label">Payment Method:</span><br>
                    ${paymentMethod}
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <span class="info-label">Email:</span><br>
                    ${email}
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="total-section">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>$${total.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div class="total-row">
                  <span>Tax:</span>
                  <span>$0.00</span>
                </div>
                <div class="total-row total-final">
                  <span>Total:</span>
                  <span>$${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">What's Next?</h2>
              <ul style="line-height: 1.8;">
                <li>You'll receive an email when your order ships</li>
                <li>Track your order status in your account</li>
                <li>Expected delivery: 3-5 business days</li>
                <li>Questions? Reply to this email</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>© 2026 FashionStyle. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Order Confirmation - ${orderId}`,
      html,
      text: `Order Confirmation - ${orderId}\n\nThank you for your order! Your order ${orderId} is now being processed.\n\nTotal: $${total.toFixed(2)}\n\nWe'll send you updates when your order ships.`
    });
  }

  // Welcome email template
  async sendWelcomeEmail(data: EmailTemplate['welcomeEmail']): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { name, email, loginUrl } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to FashionStyle</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0; }
          .logo { font-size: 24px; font-weight: bold; color: #333; }
          .content { padding: 30px 0; }
          .welcome-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; text-align: center; margin: 30px 0; }
          .cta-button { display: inline-block; background: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 30px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">FashionStyle</div>
          </div>

          <div class="content">
            <div class="welcome-box">
              <h1 style="margin: 0 0 10px 0; font-size: 28px;">Welcome to FashionStyle!</h1>
              <p style="margin: 0; font-size: 18px;">Hi ${name}, your account has been created successfully.</p>
            </div>

            <div style="text-align: center;">
              <p>Your account is ready and you can start shopping right away.</p>
              ${loginUrl ? `<a href="${loginUrl}" class="cta-button">Login to Your Account</a>` : ''}
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="margin-top: 0;">Getting Started:</h3>
              <ul style="line-height: 1.8;">
                <li>Browse our collection of premium fashion</li>
                <li>Add items to your wishlist for later</li>
                <li>Enjoy fast and secure checkout</li>
                <li>Track your orders in real-time</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>© 2026 FashionStyle. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to FashionStyle!',
      html,
      text: `Welcome to FashionStyle!\n\nHi ${name},\n\nYour account has been created successfully. You can now start shopping and enjoy all the features of our platform.\n\nHappy shopping!\nFashionStyle Team`
    });
  }

  // Password reset email template
  async sendPasswordResetEmail(data: EmailTemplate['passwordReset']): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { name, email, resetUrl } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - FashionStyle</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0; }
          .logo { font-size: 24px; font-weight: bold; color: #333; }
          .content { padding: 30px 0; }
          .alert-box { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .reset-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 30px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">FashionStyle</div>
          </div>

          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your FashionStyle account.</p>

            <div class="alert-box">
              <strong>Security Notice:</strong> This password reset link will expire in 1 hour for your security. If you didn't request this reset, please ignore this email.
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="reset-button">Reset Your Password</a>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Having trouble?</strong></p>
              <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                ${resetUrl}
              </p>
            </div>

            <p style="color: #666; font-size: 14px;">
              If you didn't request this password reset, please contact our support team immediately.
            </p>
          </div>

          <div class="footer">
            <p>© 2026 FashionStyle. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset - FashionStyle',
      html,
      text: `Password Reset - FashionStyle\n\nHi ${name},\n\nWe received a request to reset your password. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this reset, please ignore this email.\n\nFashionStyle Team`
    });
  }

  // Generic email method for custom templates
  async sendCustomEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail(data);
  }

  // Test email configuration
  async testConfiguration(): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Resend API key not configured'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/domains`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        console.log('✅ Resend API configuration is valid');
        return { success: true };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Invalid API key'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const emailService = new EmailService();
export default emailService;
