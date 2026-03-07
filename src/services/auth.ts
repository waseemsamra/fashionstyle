import { apiClient } from './api';

// Auth service for handling authentication with the backend API
export const authService = {
  // Sign up a new user
  signup: async (email: string, password: string, name?: string) => {
    try {
      const response = await apiClient.post('/auth/signup', {
        email,
        password,
        name: name || email.split('@')[0]
      });
      return response.data;
    } catch (error: any) {
      // If CORS fails, throw error with helpful message
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
        throw new Error('Network error: CORS may be blocking the request. Please ensure API Gateway has CORS enabled.');
      }
      throw error;
    }
  },

  // Sign in and get JWT token
  signin: async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/signin', {
        email,
        password
      });

      // Store token in localStorage
      if (response.data.accessToken) {
        localStorage.setItem('jwt_token', response.data.accessToken);
        localStorage.setItem('user_email', email);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
      }

      return response.data;
    } catch (error: any) {
      // If CORS fails, throw error with helpful message
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
        throw new Error('Network error: CORS may be blocking the request. Please ensure API Gateway has CORS enabled.');
      }
      throw error;
    }
  },

  // Request password reset code
  forgotPassword: async (email: string) => {
    try {
      const response = await apiClient.post('/forgot-password', {
        email
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
        throw new Error('Network error: CORS may be blocking the request.');
      }
      throw error;
    }
  },

  // Confirm reset code and set new password
  confirmPassword: async (email: string, code: string, newPassword: string) => {
    try {
      const response = await apiClient.post('/confirm-password', {
        email,
        code,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
        throw new Error('Network error: CORS may be blocking the request.');
      }
      throw error;
    }
  },

  // Get stored JWT token
  getToken: (): string | null => {
    return localStorage.getItem('jwt_token');
  },

  // Get stored user email
  getUserEmail: (): string | null => {
    return localStorage.getItem('user_email');
  },

  // Sign out
  signOut: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user_email');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('jwt_token');
  }
};

export default authService;
