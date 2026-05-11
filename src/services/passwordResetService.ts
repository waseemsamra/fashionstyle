// Password Reset Service for Admin functionality

interface PasswordResetData {
  to: string;
  name: string;
  resetLink: string;
}

class PasswordResetService {
  private static readonly RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
  private static readonly FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'noreply@fashionstore.com';

  static async sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
    try {
      console.log('📧 Sending password reset email:', data);

      // Check if Resend API key is available
      if (!this.RESEND_API_KEY) {
        console.error('❌ Resend API key not found');
        throw new Error('Resend API key not configured');
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.FROM_EMAIL,
          to: [data.to],
          subject: 'Password Reset Request - Fashion Store',
          html: this.generatePasswordResetTemplate(data),
          text: this.generatePasswordResetText(data),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Resend API error:', errorData);
        throw new Error(errorData.message || 'Failed to send email');
      }

      const result = await response.json();
      console.log('✅ Password reset email sent via Resend:', result);
      return true;
    } catch (error) {
      console.error('❌ Password reset email failed:', error);
      throw error;
    }
  }

  private static generatePasswordResetTemplate(data: PasswordResetData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Fashion Store</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #4b5563;
          }
          .reset-button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
          }
          .reset-button:hover {
            background-color: #1d4ed8;
          }
          .security-note {
            font-size: 14px;
            color: #6b7280;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Fashion Store</div>
          </div>
          
          <h1 class="title">Password Reset Request</h1>
          
          <p class="message">
            Hi ${data.name},<br><br>
            We received a request to reset your password for your Fashion Store account. 
            Click the button below to reset your password:
          </p>
          
          <div style="text-align: center;">
            <a href="${data.resetLink}" class="reset-button">
              Reset Password
            </a>
          </div>
          
          <div class="security-note">
            <strong>Security Notice:</strong><br>
            • This link will expire in 24 hours<br>
            • If you didn't request this reset, please ignore this email<br>
            • For your security, please don't share this link with anyone
          </div>
          
          <div class="footer">
            <p>&copy; 2026 Fashion Store. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static generatePasswordResetText(data: PasswordResetData): string {
    return `
Password Reset Request - Fashion Store

Hi ${data.name},

We received a request to reset your password for your Fashion Store account.

Click the link below to reset your password:
${data.resetLink}

Security Notice:
• This link will expire in 24 hours
• If you didn't request this reset, please ignore this email
• For your security, please don't share this link with anyone

© 2026 Fashion Store. All rights reserved.
This is an automated message, please do not reply to this email.
    `;
  }
}

export default PasswordResetService;
