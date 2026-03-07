import { apiClient } from './api';

export interface User {
  userId: string;
  email: string;
  name: string;
  role?: string;
}

export const userService = {
  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  // Get user by email
  getUserByEmail: async (email: string): Promise<User[]> => {
    const response = await apiClient.get(`/users`, {
      params: { email }
    });
    return response.data.users || [];
  },

  // Get current user from stored email
  getCurrentUser: async (): Promise<User | null> => {
    const email = localStorage.getItem('user_email');
    if (!email) return null;
    
    try {
      const users = await userService.getUserByEmail(email);
      return users[0] || null;
    } catch {
      return null;
    }
  }
};

export default userService;
