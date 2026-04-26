export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'manager';
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
    language: string;
    currency: string;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  private baseUrl = import.meta.env.VITE_API_URL || 'https://zbdw3piterihfqm37o3swldeca0qitsj.lambda-url.us-east-1.on.aws';
  private refreshTimeout?: ReturnType<typeof setTimeout>;

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store tokens immediately
    localStorage.setItem('jwt_token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    this.setupTokenRefresh(data.expiresIn);

    return data;
  }

  async signup(data: any): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    const responseData = await response.json();
    this.setupTokenRefresh(responseData.expiresIn);
    
    return responseData;
  }

  async logout(): Promise<void> {
    const token = localStorage.getItem('jwt_token');
    
    if (token) {
      try {
        await fetch(`${this.baseUrl}/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.clearTokenRefresh();
  }

  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('jwt_token');
    const email = localStorage.getItem('user_email');

    if (!token) {
      throw new Error('Not authenticated');
    }

    // Try to get user from backend first
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      // Backend failed, use token decoding
      console.log('⚠️ Backend /auth/me failed, decoding token');
    }

    // Fallback: Decode JWT token to get user info
    try {
      const { getUserFromToken } = await import('@/utils/tokenDecoder');
      const userFromToken = getUserFromToken(token);
      
      if (userFromToken) {
        console.log('✅ User decoded from JWT token');
        return {
          id: userFromToken.id,
          email: userFromToken.email,
          name: userFromToken.name || 'User',
          role: (userFromToken.role as 'user' | 'admin' | 'manager') || 'user',
          createdAt: userFromToken.createdAt,
          updatedAt: new Date().toISOString(),
          emailVerified: true,
          phoneVerified: false,
          preferences: {
            newsletter: false,
            smsNotifications: false,
            emailNotifications: false,
            language: 'en',
            currency: 'USD',
          },
        };
      }
    } catch (error) {
      console.error('Failed to decode token:', error);
    }

    // Last resort: use localStorage
    return {
      id: email?.replace(/[^a-zA-Z0-9]/g, '-') || 'user',
      email: email || 'user@example.com',
      name: email?.split('@')[0] || 'User',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: true,
      phoneVerified: false,
      preferences: {
        newsletter: false,
        smsNotifications: false,
        emailNotifications: false,
        language: 'en',
        currency: 'USD',
      },
    };
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    localStorage.setItem('jwt_token', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    
    this.setupTokenRefresh(data.expiresIn);
    
    return data;
  }

  async verifyEmail(token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Email verification failed');
    }
  }

  async resendVerification(): Promise<void> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to resend verification');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to send reset email');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    if (!response.ok) {
      throw new Error('Password reset failed');
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!response.ok) {
      throw new Error('Password change failed');
    }
  }

  private setupTokenRefresh(expiresIn: number) {
    this.clearTokenRefresh();
    
    // Refresh token 5 minutes before expiry
    const refreshTime = (expiresIn - 300) * 1000;
    
    this.refreshTimeout = setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Redirect to login
        window.location.href = '/login';
      }
    }, refreshTime);
  }

  private clearTokenRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }
}

export const authService = new AuthService();
