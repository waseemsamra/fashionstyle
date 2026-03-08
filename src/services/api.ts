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
    const response = await apiClient.get('/filters');
    return response.data;
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
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  // Update user profile
  updateUserProfile: async (userId: string, profile: any) => {
    const response = await apiClient.put(`/users/${userId}/profile`, profile);
    return response.data;
  },

  // Create order
  createOrder: async (userId: string, orderData: any) => {
    const response = await apiClient.post(`/users/${userId}/orders`, orderData);
    return response.data;
  },

  // Get user orders
  getUserOrders: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/orders`);
    return response.data.orders || [];
  },

  // Get single order
  getOrder: async (userId: string, orderId: string) => {
    const response = await apiClient.get(`/users/${userId}/orders/${orderId}`);
    return response.data;
  }
};

// Export both apiClient and api for compatibility
export { apiClient, API_URL };
export default apiClient;
