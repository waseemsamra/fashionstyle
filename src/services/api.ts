import axios from 'axios';

// Use correct API URLs from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws';
const USERS_API_URL = import.meta.env.VITE_USERS_API_URL || 'https://7uymscqv6xcutr5f6b2yvcgqri0wnkuj.lambda-url.us-east-1.on.aws';
const ORDERS_API_URL = import.meta.env.VITE_ORDERS_API_URL || 'https://ooii1l1zf9.execute-api.us-east-1.amazonaws.com/prod/orders';
const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL || 'https://4dzwj3v7m4mm2ij7q5eibkbdlq0tynyd.lambda-url.us-east-1.on.aws';
const CATEGORIES_API = import.meta.env.VITE_CATEGORIES_API || 'https://8wzvwch1pi.execute-api.us-east-1.amazonaws.com/prod/categories';
const SETTINGS_API = import.meta.env.VITE_SETTINGS_API || 'https://c1ntcc0rt6.execute-api.us-east-1.amazonaws.com/prod/settings';

// Log the API URLs being used (for debugging)
console.log('🔧 Products API URL:', API_URL);
console.log('🔧 Users API URL:', USERS_API_URL);
console.log('🔧 Orders API URL:', ORDERS_API_URL);
console.log('🔧 Upload API URL:', UPLOAD_API_URL);

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

usersApiClient.interceptors.request.use(
  (config) => {
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
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

ordersApiClient.interceptors.request.use(
  (config) => {
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
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
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

// Get all products (handles pagination)
   getAllProducts: async () => {
     try {
       console.log('🔄 getAllProducts: Fetching all products...');
       
       // Try public API first (for frontend sections)
       const response = await fetch(`${API_URL}/products?limit=2000`);
       
       if (!response.ok) {
         throw new Error(`HTTP ${response.status}`);
       }
       
       const data = await response.json();
       console.log('📦 getAllProducts: Response received, items:', data.items?.length || 0, 'total:', data.total);
       
       const allItems = data.items || [];
       console.log('✅ getAllProducts: Returning all', allItems.length, 'products');
       return { items: allItems, total: allItems.length };
     } catch (error: any) {
       console.error('❌ Error fetching all products:', error);
       return { items: [], total: 0 };
     }
   },

  // Get single product
  getProduct: async (id: string) => {
    const data = await api.getAllProducts();
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.find((p: any) => String(p.id) === String(id) || String(p.PK) === String(id)) || null;
  },

  // Search products
  searchProducts: async (params: { q: string; page?: number }) => {
    const response = await apiClient.get('/search', { params });
    return response.data;
  },

// Get user profile (uses Users API) - userId is actually email
  getUserProfile: async (email: string) => {
    const response = await fetch(`${USERS_API_URL}/users/${encodeURIComponent(email)}/profile`, {
      method: 'GET',
      headers: {
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
  updateUserProfile: async (email: string, profile: any) => {
    const response = await fetch(`${USERS_API_URL}/users/${encodeURIComponent(email)}/profile`, {
      method: 'POST',
      headers: {
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
  createUserProfile: async (email: string, emailParam: string) => {
    const defaultProfile = {
      userId: email,
      firstName: '',
      lastName: '',
      dob: '',
      contact: '',
      whatsapp: '',
      email: emailParam,
      role: 'customer',
      status: 'active'
    };

    const response = await fetch(`${USERS_API_URL}/users/${encodeURIComponent(email)}/profile`, {
      method: 'POST',
      headers: {
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
    try {
      const response = await fetch(`${USERS_API_URL}/users/${userId}/payment-methods`, {
        method: 'GET',
        headers: {
          
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
    try {
      const response = await fetch(`${USERS_API_URL}/users/${userId}/payment-methods`, {
        method: 'POST',
        headers: {
          
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
    try {
      const response = await fetch(`${USERS_API_URL}/users/${userId}/payment-methods/${paymentId}`, {
        method: 'PUT',
        headers: {
          
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
    try {
      const response = await fetch(`${USERS_API_URL}/users/${userId}/payment-methods/${paymentId}`, {
        method: 'DELETE',
        headers: {
          
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
    try {
      const response = await fetch(`${USERS_API_URL}/users/${userId}/payment-methods/${paymentId}/default`, {
        method: 'PUT',
        headers: {
          
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

// Get admin settings (uses Settings API)
   getAdminSettings: async () => {
    try {
      const response = await fetch(`${SETTINGS_API}`, {
        method: 'GET',
        headers: {
          
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

// Update admin settings (uses Settings API)
   updateAdminSettings: async (settings: any) => {
    try {
      const response = await fetch(`${SETTINGS_API}`, {
        method: 'POST',
        headers: {
          
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

// Get categories (uses Categories API)
   getCategories: async () => {
     try {
       const response = await fetch(`${CATEGORIES_API}`, {
         method: 'GET',
         headers: {
           
           'Content-Type': 'application/json'
         },
         mode: 'cors'
       });

       if (!response.ok) {
         const error = await response.text();
         throw new Error(error || 'Failed to fetch categories');
       }

       const data = await response.json();
       
       // Support both array of strings and array of category objects
       if (Array.isArray(data)) {
         if (typeof data[0] === 'string') {
           // It's an array of category names, convert to objects
           return (data as string[]).map((name: string, index: number) => ({
             id: index + 1,
             name,
             description: '',
             products: 0,
             image: ''
           }));
         }
         return data;
       }
       
       return data.items || [];
     } catch (error) {
       console.error('Failed to get categories:', error);
       // Return fallback categories array instead of throwing
       return [
         'Accessories', 'Bridal Wear', 'Casual Wear', 'Footwear', 'Formal Wear',
         'Kids Wear', 'Men Wear', 'New Arrivals', 'Party Wear', 'Summer Collection', 'Winter Collection'
       ].map((name: string, index: number) => ({
         id: index + 1,
         name,
         description: '',
         products: 0,
         image: ''
       }));
     }
   },

// Save categories (uses Categories API)
  saveCategories: async (categories: any[]) => {
    try {
      const response = await fetch(`${CATEGORIES_API}`, {
        method: 'POST',
        headers: {
          
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

// Get all settings (uses Settings API)
   getAllSettings: async () => {
    try {
      const response = await fetch(`${SETTINGS_API}`, {
        method: 'GET',
        headers: {
          
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

// Save settings section (uses Settings API)
   saveSettingsSection: async (section: string, data: any) => {
    try {
      const response = await fetch(`${SETTINGS_API}/${section}`, {
        method: 'POST',
        headers: {
          
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
    try {
      const response = await fetch(`${ORDERS_API_URL}/users/${userId}/orders?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          
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

  // Get single user (admin - uses Users API) - userId is actually email
  getUser: async (email: string) => {
    const response = await usersApiClient.get(`/users/${encodeURIComponent(email)}`);
    return response.data;
  },

  // Create user (admin - uses Users API)
  createUser: async (userData: { email: string; name: string; role?: string; status?: string }) => {
    const response = await usersApiClient.post('/users', userData);
    return response.data;
  },

  // Update user (admin - uses Users API) - userId is actually email
  updateUser: async (email: string, userData: any) => {
    const response = await usersApiClient.put(`/users/${encodeURIComponent(email)}`, userData);
    return response.data;
  },

  // Delete user (admin - uses Users API) - userId is actually email
  deleteUser: async (email: string) => {
    const response = await usersApiClient.delete(`/users/${encodeURIComponent(email)}`);
    return response.data;
  },

  // Get all orders (admin - uses Orders API)
  getAllOrders: async () => {
    try {
      console.log('📡 API getAllOrders - Fetching from:', `${ORDERS_API_URL}/admin/orders`);

      const response = await fetch(`${ORDERS_API_URL}/admin/orders`, {
        method: 'GET',
        headers: {
          
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
    const email = localStorage.getItem('user_email') || 'admin@fashionstore.com';
    const userId = email.replace(/[^a-zA-Z0-9]/g, '-');

    try {
      const response = await fetch(`${ORDERS_API_URL}/users/${userId}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          
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
    const email = localStorage.getItem('user_email') || 'admin@fashionstore.com';
    const userId = email.replace(/[^a-zA-Z0-9]/g, '-');

    try {
      console.log('📡 API updateOrderStatus - Updating order:', orderId, 'to status:', status);

      const response = await fetch(`${ORDERS_API_URL}/users/${userId}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          
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
    const email = localStorage.getItem('user_email') || 'admin@fashionstore.com';
    const userId = email.replace(/[^a-zA-Z0-9]/g, '-');

    try {
      const response = await fetch(`${ORDERS_API_URL}/users/${userId}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          
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