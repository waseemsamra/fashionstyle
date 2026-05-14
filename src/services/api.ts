import axios from 'axios';

// Use correct API URLs from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws';
const USERS_API_URL = import.meta.env.VITE_USERS_API_URL || 'https://3rctw6carzadrs3okoemb4ccvi0rzxqy.lambda-url.us-east-1.on.aws';
const ORDERS_API_URL = import.meta.env.VITE_ORDERS_API_URL || 'https://r7pc3n32db.execute-api.us-east-1.amazonaws.com/prod';
const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL || 'https://wpswtrwvil.execute-api.us-east-1.amazonaws.com/prod/generate-upload-url';

// Log the API URLs being used (for debugging)
console.log('🔧 Products API URL:', API_URL);
console.log('🔧 Users API URL:', USERS_API_URL);
console.log('🔧 Orders API URL:', ORDERS_API_URL);
console.log('🔧 Upload API URL:', UPLOAD_API_URL);

// In-memory cache for products
let productsCache: any = null;
let productsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Create axios instances for each API base URL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const usersApiClient = axios.create({
  baseURL: USERS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const ordersApiClient = axios.create({
  baseURL: ORDERS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add JWT token to requests for users API
usersApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle CORS errors for users API
usersApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
      console.warn('CORS error detected on Users API.');
    }
    return Promise.reject(error);
  }
);

// Add JWT token to requests for orders API
ordersApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API service methods (legacy - for backward compatibility)
export const api = {
  // Get filters
  getFilters: async () => {
    try {
      const response = await apiClient.get('/filters', { timeout: 3000 });
      return response.data;
    } catch (error) {
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
    if (!params.nextToken && !params.category && !params.brand) {
      const now = Date.now();
      if (productsCache && (now - productsCacheTime) < CACHE_DURATION) {
        return productsCache;
      }
    }

    const response = await apiClient.get('/products', { params });
    const data = response.data;

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

  // Get user profile (uses Users API)
  getUserProfile: async (userId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    const response = await fetch(`${USERS_API_URL}/users/${userId}/profile`, {
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

  // Update user profile (uses Users API)
  updateUserProfile: async (userId: string, profile: any) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    const response = await fetch(`${USERS_API_URL}/users/${userId}/profile`, {
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

  // Create user profile (uses Users API)
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

    const response = await fetch(`${USERS_API_URL}/users/${userId}/profile`, {
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

  // Get payment methods (uses Users API)
  getPaymentMethods: async (userId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${USERS_API_URL}/users/${userId}/payment-methods`, {
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

  // Add payment method (uses Users API)
  addPaymentMethod: async (userId: string, paymentData: any) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${USERS_API_URL}/users/${userId}/payment-methods`, {
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

  // Update payment method (uses Users API)
  updatePaymentMethod: async (userId: string, paymentId: string, paymentData: any) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${USERS_API_URL}/users/${userId}/payment-methods/${paymentId}`, {
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

  // Delete payment method (uses Users API)
  deletePaymentMethod: async (userId: string, paymentId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${USERS_API_URL}/users/${userId}/payment-methods/${paymentId}`, {
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

  // Set default payment method (uses Users API)
  setDefaultPaymentMethod: async (userId: string, paymentId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${USERS_API_URL}/users/${userId}/payment-methods/${paymentId}/default`, {
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

  // Get admin settings (uses Products API)
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

  // Update admin settings (uses Products API)
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

  // Get categories (uses Products API)
  getCategories: async () => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${API_URL}/admin/settings-v2/categories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch categories');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  },

  // Save categories (uses Products API)
  saveCategories: async (categories: any[]) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${API_URL}/admin/settings-v2/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({ items: categories })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save categories');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to save categories:', error);
      throw error;
    }
  },

  // Get all settings (uses Products API)
  getAllSettings: async () => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${API_URL}/admin/settings-v2`, {
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
      console.error('Failed to get settings:', error);
      throw error;
    }
  },

  // Save settings section (uses Products API)
  saveSettingsSection: async (section: string, data: any) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${API_URL}/admin/settings-v2/${section}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  },

  // Create order (uses Orders API)
  createOrder: async (userId: string, orderData: any) => {
    const response = await ordersApiClient.post(`/users/${userId}/orders`, orderData);
    return response.data;
  },

  // Get user orders (uses Orders API)
  getUserOrders: async (userId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    console.log('📋 getUserOrders - userId:', userId);
    console.log('📋 getUserOrders - Token present:', !!token);

    try {
      const response = await fetch(`${ORDERS_API_URL}/users/${userId}/orders?t=${Date.now()}`, {
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

  // Get single order (uses Orders API)
  getOrder: async (userId: string, orderId: string) => {
    const response = await ordersApiClient.get(`/users/${userId}/orders/${orderId}`);
    return response.data;
  },

  // Get all users (admin - uses Users API)
  getUsers: async () => {
    const response = await usersApiClient.get('/users');
    return response.data;
  },

  // Get single user (admin - uses Users API)
  getUser: async (userId: string) => {
    const response = await usersApiClient.get(`/users/${userId}`);
    return response.data;
  },

  // Create user (admin - uses Users API)
  createUser: async (userData: { email: string; name: string; role?: string; status?: string }) => {
    const response = await usersApiClient.post('/users', userData);
    return response.data;
  },

  // Update user (admin - uses Users API)
  updateUser: async (userId: string, userData: any) => {
    const response = await usersApiClient.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user (admin - uses Users API)
  deleteUser: async (userId: string) => {
    const response = await usersApiClient.delete(`/users/${userId}`);
    return response.data;
  },

  // Get all orders (admin - uses Orders API)
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
      console.log('📡 API getAllOrders - Fetching from:', `${ORDERS_API_URL}/admin/orders`);

      const response = await fetch(`${ORDERS_API_URL}/admin/orders`, {
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

  // Get single order by id (admin - uses Orders API)
  getOrderById: async (orderId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    const email = localStorage.getItem('user_email') || 'admin@fashionstore.com';
    const userId = email.replace(/[^a-zA-Z0-9]/g, '-');

    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      const response = await fetch(`${ORDERS_API_URL}/users/${userId}/orders/${orderId}`, {
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

  // Update order status (admin - uses Orders API)
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
      console.log('📡 API updateOrderStatus - Updating order:', orderId, 'to status:', status);

      const response = await fetch(`${ORDERS_API_URL}/users/${userId}/orders/${orderId}`, {
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

  // Delete order (admin - uses Orders API)
  deleteOrder: async (orderId: string) => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
    const email = localStorage.getItem('user_email') || 'admin@fashionstore.com';
    const userId = email.replace(/[^a-zA-Z0-9]/g, '-');

    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      const response = await fetch(`${ORDERS_API_URL}/users/${userId}/orders/${orderId}`, {
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

export { apiClient, usersApiClient, ordersApiClient, API_URL, USERS_API_URL, ORDERS_API_URL };
export default apiClient;