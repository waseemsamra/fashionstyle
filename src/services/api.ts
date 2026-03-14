import axios from 'axios';

// ALWAYS use the correct API URL - no proxy in production
const API_URL = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';

// Log the API URL being used (for debugging)
console.log('🔧 API Client initialized with URL:', API_URL);

// In-memory cache for products
let productsCache: any = null;
let productsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Create axios instance with CORS handling
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add Content-Type header for all requests
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle CORS errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
      console.warn('CORS error detected. The API Gateway may need CORS configuration.');
    }
    return Promise.reject(error);
  }
);

// API service methods
export const api = {
  // Get filters (if endpoint exists)
  getFilters: async () => {
    try {
      const response = await apiClient.get('/filters', { timeout: 3000 });
      return response.data;
    } catch (error) {
      // Silently fail - filters are optional
      return { 
        categories: [], 
        brands: [], 
        genders: [], 
        occasions: [], 
        patterns: [], 
        materials: [], 
        colors: [], 
        sizes: [] 
      };
    }
  },

  // List products with caching
  listProducts: async (params: { category?: string; brand?: string; nextToken?: string } = {}) => {
    // Only use cache for requests without pagination
    if (!params.nextToken && !params.category && !params.brand) {
      const now = Date.now();
      if (productsCache && (now - productsCacheTime) < CACHE_DURATION) {
        return productsCache;
      }
    }

    const response = await apiClient.get('/products', { params });
    const data = response.data;

    // Cache the response
    if (!params.nextToken && !params.category && !params.brand) {
      productsCache = data;
      productsCacheTime = Date.now();
    }

    return data;
  },

  // Get single product
  getProduct: async (id: string) => {
    const products = await api.listProducts();
    return products.find((p: any) => p.id === id) || null;
  },

  // Search products
  searchProducts: async (params: { q: string; page?: number }) => {
    const response = await apiClient.get('/search', { params });
    return response.data;
  },

  // Get user profile
  getUserProfile: async (userId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_URL}/users/${userId}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch profile');
    }
    
    return await response.json();
  },

  // Update user profile
  updateUserProfile: async (userId: string, profile: any) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_URL}/users/${userId}/profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify(profile)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update profile');
    }
    
    return await response.json();
  },

  // Create user profile (auto-created on signup)
  createUserProfile: async (userId: string, email: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    
    const defaultProfile = {
      userId: userId,
      firstName: '',
      lastName: '',
      dob: '',
      contact: '',
      whatsapp: '',
      email: email,
      role: 'customer',
      status: 'active'
    };
    
    const response = await fetch(`${API_URL}/users/${userId}/profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify(defaultProfile)
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create profile:', error);
      return { success: true };
    }
    
    return await response.json();
  },

  // Get payment methods
  getPaymentMethods: async (userId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    
    try {
      const response = await fetch(`${API_URL}/users/${userId}/payment-methods`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch payment methods');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      throw error;
    }
  },

  // Add payment method
  addPaymentMethod: async (userId: string, paymentData: any) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    
    try {
      const response = await fetch(`${API_URL}/users/${userId}/payment-methods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to add payment method');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to add payment method:', error);
      throw error;
    }
  },

  // Update payment method
  updatePaymentMethod: async (userId: string, paymentId: string, paymentData: any) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    
    try {
      const response = await fetch(`${API_URL}/users/${userId}/payment-methods/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update payment method');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update payment method:', error);
      throw error;
    }
  },

  // Delete payment method
  deletePaymentMethod: async (userId: string, paymentId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    
    try {
      const response = await fetch(`${API_URL}/users/${userId}/payment-methods/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete payment method');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      throw error;
    }
  },

  // Set default payment method
  setDefaultPaymentMethod: async (userId: string, paymentId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    
    try {
      const response = await fetch(`${API_URL}/users/${userId}/payment-methods/${paymentId}/default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to set default payment method');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      throw error;
    }
  },

  // Get admin settings
  getAdminSettings: async () => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    
    try {
      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch settings');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get admin settings:', error);
      throw error;
    }
  },

  // Update admin settings
  updateAdminSettings: async (settings: any) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    
    try {
      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update settings');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update admin settings:', error);
      throw error;
    }
  },

  // Create order
  createOrder: async (userId: string, orderData: any) => {
    const response = await apiClient.post(`/users/${userId}/orders`, orderData);
    return response.data;
  },

  // Get user orders
  getUserOrders: async (userId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    
    console.log('📋 getUserOrders - userId:', userId);
    console.log('📋 getUserOrders - Token present:', !!token);

    try {
      const response = await fetch(`${API_URL}/users/${userId}/orders?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'include',
        cache: 'no-store'
      });

      console.log('📋 getUserOrders - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ getUserOrders - Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📋 getUserOrders - Response:', data);
      console.log('📋 getUserOrders - Orders count:', data.orders?.length || 0);
      
      return data.orders || [];
    } catch (error) {
      console.error('❌ getUserOrders - Fetch error:', error);
      throw error;
    }
  },

  // Get single order
  getOrder: async (userId: string, orderId: string) => {
    const response = await apiClient.get(`/users/${userId}/orders/${orderId}`);
    return response.data;
  },

  // List all users (admin)
  getUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  // Get single user (admin)
  getUser: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  // Create user (admin)
  createUser: async (userData: { email: string; name: string; role?: string; status?: string }) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  // Update user (admin)
  updateUser: async (userId: string, userData: any) => {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user (admin)
  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  // Get all orders (admin)
  getAllOrders: async () => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');

    console.log('🔑 API getAllOrders - Token present:', !!token);
    console.log('🔑 API getAllOrders - Token type:', token ? (token.startsWith('ey') ? 'JWT' : 'Other') : 'None');
    console.log('🔑 API getAllOrders - Token length:', token?.length || 0);

    if (!token) {
      console.error('❌ API getAllOrders - No authentication token found!');
      throw new Error('No authentication token');
    }

    try {
      console.log('📡 API getAllOrders - Fetching from:', `${API_URL}/admin/orders`);
      
      const response = await fetch(`${API_URL}/admin/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });

      console.log('📡 API getAllOrders - Response status:', response.status);
      
      const responseText = await response.text();
      console.log('📡 API getAllOrders - Raw response:', responseText);

      if (!response.ok) {
        console.error('❌ API getAllOrders - HTTP error:', response.status);
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      try {
        const data = JSON.parse(responseText);
        console.log('✅ Orders fetched:', data);
        return data;
      } catch (jsonErr) {
        console.error('❌ API getAllOrders - JSON parse error:', jsonErr);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  },

  // Get single order by id (admin)
  getOrderById: async (orderId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    const email = localStorage.getItem('user_email') || 'admin@fashionstore.com';
    const userId = email.replace(/[^a-zA-Z0-9]/g, '-');

    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      // Use user endpoint (admin endpoints require IAM auth)
      const response = await fetch(`${API_URL}/users/${userId}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Order ${orderId} fetched:`, data);
      return data;
    } catch (error) {
      console.error('❌ Fetch order error:', error);
      throw error;
    }
  },

  // Update order status (admin)
  updateOrderStatus: async (orderId: string, status: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    const email = localStorage.getItem('user_email') || 'admin@fashionstore.com';
    const userId = email.replace(/[^a-zA-Z0-9]/g, '-');

    console.log('🔑 API updateOrderStatus - Token present:', !!token);
    console.log('📡 API updateOrderStatus - Using userId:', userId);

    if (!token) {
      console.error('❌ API updateOrderStatus - No authentication token found!');
      throw new Error('No authentication token');
    }

    try {
      // Use user endpoint (admin endpoints require IAM auth)
      console.log('📡 API updateOrderStatus - Updating order:', orderId, 'to status:', status);
      
      const response = await fetch(`${API_URL}/users/${userId}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      const responseText = await response.text();
      console.log('📡 API updateOrderStatus - Response:', response.status, responseText);

      if (!response.ok) {
        console.error('❌ API updateOrderStatus - HTTP error:', response.status);
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      try {
        const data = JSON.parse(responseText);
        console.log('✅ Order status updated:', data);
        return data;
      } catch (jsonErr) {
        console.error('❌ API updateOrderStatus - JSON parse error:', jsonErr);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('❌ API updateOrderStatus - Fetch error:', error);
      throw error;
    }
  },

  // Delete order (admin)
  deleteOrder: async (orderId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    const email = localStorage.getItem('user_email') || 'admin@fashionstore.com';
    const userId = email.replace(/[^a-zA-Z0-9]/g, '-');

    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      // Use user endpoint (admin endpoints require IAM auth)
      const response = await fetch(`${API_URL}/users/${userId}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });

      const responseText = await response.text();
      console.log('📡 API deleteOrder - Response:', response.status, responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ Order deleted:', data);
      return data;
    } catch (error) {
      console.error('❌ Delete order error:', error);
      throw error;
    }
  }
};

// Export both apiClient and api for compatibility
export { apiClient, API_URL };
export default apiClient;
