import { apiClient } from './api';

export interface OrderItem {
  id?: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  orderId: string;
  userId: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  customer: {
    fullName: string;
    email: string;
  };
  paymentMethod?: string;
  paymentStatus?: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  fullName: string;
  email: string;
  paymentMethod?: 'cod' | 'card';
}

export const ordersService = {
  // Create a new order
  createOrder: async (userId: string, orderData: CreateOrderRequest): Promise<{
    message: string;
    orderId: string;
    total: number;
    paymentMethod?: string;
    paymentStatus?: string;
  }> => {
    try {
      console.log('📦 Creating order for userId:', userId);
      console.log('📦 Order data:', orderData);
      
      const token = localStorage.getItem('jwt_token');
      console.log('📦 Token present:', !!token);
      
      // userId should be the Cognito sub (unique ID) or email-based ID
      const response = await apiClient.post(`/users/${userId}/orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Order created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Order creation failed:', error);
      console.error('❌ Response:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Headers:', error.response?.headers);
      throw error;
    }
  },

  // Get all orders for a user
  getUserOrders: async (userId: string): Promise<Order[]> => {
    const response = await apiClient.get(`/users/${userId}/orders`);
    return response.data.orders || [];
  },

  // Get current user's orders using stored email
  getCurrentUserOrders: async (): Promise<Order[]> => {
    const email = localStorage.getItem('user_email');
    if (!email) return [];
    
    // First get user by email to find userId
    const { userService } = await import('./user');
    const users = await userService.getUserByEmail(email);
    if (users.length === 0) return [];
    
    const userId = users[0].userId;
    return ordersService.getUserOrders(userId);
  }
};

export default ordersService;
