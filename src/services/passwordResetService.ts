// Password Reset Service for Admin functionality
import { API_CONFIG } from '../config/api';

interface PasswordResetData {
  to: string;
  name: string;
  resetLink: string;
}

class PasswordResetService {
  private static readonly USERS_API_URL = API_CONFIG.usersApi;

  static async sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
    try {
      console.log('📧 Sending password reset via Lambda:', data);

      // Call backend Lambda for password reset
      const response = await fetch(`${this.USERS_API_URL}/users/${data.to}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.to,
          name: data.name,
          resetLink: data.resetLink,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Lambda password reset error:', errorData);
        throw new Error(errorData.message || 'Failed to send password reset email');
      }

      const result = await response.json();
      console.log('✅ Password reset sent via Lambda:', result);
      return true;
    } catch (error) {
      console.error('❌ Password reset email failed:', error);
      throw error;
    }
  }
}

export default PasswordResetService;
