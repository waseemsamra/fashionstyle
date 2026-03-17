// services/api.ts
const API_URL = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';

// API Client with all methods for backwards compatibility
export const apiClient = {
  async get(endpoint: string, token?: string | null) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
      credentials: 'omit',
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  async post(endpoint: string, data?: any, token?: string | null) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'omit',
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  async put(endpoint: string, data?: any, token?: string | null) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'omit',
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  async delete(endpoint: string, token?: string | null) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      credentials: 'omit',
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  async patch(endpoint: string, data?: any, token?: string | null) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'omit',
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};

// Simple API methods for products
export const api = {
  async listProducts(_filters?: any) {
    try {
      const response = await fetch(`${API_URL}/products`, {
        credentials: 'omit',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.items || data.products || data || [];
    } catch (error) {
      console.error('❌ API Error (listProducts):', error);
      return [];
    }
  },

  async getProduct(id: string) {
    try {
      const response = await fetch(`${API_URL}/products`, {
        credentials: 'omit',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const items = data.items || [];
      return items.find((p: any) => String(p.id) === String(id)) || null;
    } catch (error) {
      console.error('❌ API Error (getProduct):', error);
      return null;
    }
  },
  
  // User methods
  async getUserProfile(userId: string, token: string | null) {
    return apiClient.get(`/users/${userId}`, token);
  },
  
  async updateUserProfile(userId: string, data: any, token: string | null) {
    return apiClient.put(`/users/${userId}`, data, token);
  },
  
  async createUserProfile(userId: string, email: string) {
    const token = localStorage.getItem('jwt_token');
    return apiClient.post(`/users/${userId}`, { email }, token);
  },
  
  async getUserOrders(userId: string, token: string | null) {
    return apiClient.get(`/users/${userId}/orders`, token);
  },
  
  async getPaymentMethods(userId: string, token: string | null) {
    return apiClient.get(`/users/${userId}/payment-methods`, token);
  },
  
  async addPaymentMethod(userId: string, data: any, token: string | null) {
    return apiClient.post(`/users/${userId}/payment-methods`, data, token);
  },
  
  async updatePaymentMethod(userId: string, methodId: string, data: any, token: string | null) {
    return apiClient.put(`/users/${userId}/payment-methods/${methodId}`, data, token);
  },
  
  async deletePaymentMethod(userId: string, methodId: string, token: string | null) {
    return apiClient.delete(`/users/${userId}/payment-methods/${methodId}`, token);
  },
  
  async setDefaultPaymentMethod(userId: string, methodId: string, token: string | null) {
    return apiClient.patch(`/users/${userId}/payment-methods/${methodId}/default`, { isDefault: true }, token);
  },
  
  // User management (admin)
  async createUser(data: any, token: string | null) {
    return apiClient.post('/admin/users', data, token);
  },
  
  async updateUser(userId: string, data: any, token: string | null) {
    return apiClient.put(`/admin/users/${userId}`, data, token);
  },
  
  async deleteUser(userId: string, token: string | null) {
    return apiClient.delete(`/admin/users/${userId}`, token);
  },
  
  async getUsers(token: string | null) {
    return apiClient.get('/admin/users', token);
  },
  
  // Order management (admin)
  async getAllOrders(token: string | null, params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient.get(`/admin/orders${queryString}`, token);
  },
  
  async updateOrderStatus(orderId: string, status: string, token: string | null) {
    return apiClient.patch(`/admin/orders/${orderId}`, { status }, token);
  },
  
  async deleteOrder(orderId: string, token: string | null) {
    return apiClient.delete(`/admin/orders/${orderId}`, token);
  },
  
  // Dashboard stats
  async getStats(period: string, token: string | null) {
    return apiClient.get(`/admin/analytics/dashboard?period=${period}`, token);
  },
  
  async getOrders(token: string | null, params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient.get(`/admin/orders${queryString}`, token);
  },
  
  // Settings
  async getAllSettings(token: string | null) {
    return apiClient.get('/admin/settings', token);
  },
  
  async saveSettingsSection(section: string, data: any, token: string | null) {
    return apiClient.put(`/admin/settings/${section}`, data, token);
  },
  
  // Order details
  async getOrderById(orderId: string, token: string | null) {
    return apiClient.get(`/admin/orders/${orderId}`, token);
  },
};

export default api;
