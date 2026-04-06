// services/apiGatewayClient.ts

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.warn('⚠️ VITE_API_URL not configured. Products API will not work.');
  console.warn('📝 Add VITE_API_URL to your .env file');
}

// Generic API Gateway request
export const apiRequest = async (
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> => {
  if (!API_BASE_URL) {
    throw new Error('API not configured. Add VITE_API_URL to your .env file');
  }

  const idToken = localStorage.getItem('idToken') || localStorage.getItem('jwt_token');

  if (!idToken) {
    throw new Error('No authentication token found. Please log in.');
  }

  console.log(`🌐 API Request: ${method} ${endpoint}`);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ API Error ${response.status}:`, errorData);

      if (response.status === 401) {
        console.error('❌ Authentication failed. Token may be expired.');
        throw new Error('Session expired. Please log in again.');
      }

      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    // Handle 204 No Content (common for DELETE operations)
    if (response.status === 204) {
      console.log(`✅ API Response: 204 No Content (operation successful)`);
      return { success: true };
    }

    // Only try to parse JSON if there's a body
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`✅ API Response:`, data);
      return data;
    }

    // Return success for other successful responses without JSON body
    console.log(`✅ API Response: ${response.status} ${response.statusText}`);
    return { success: true, status: response.status };
  } catch (error: any) {
    // Re-throw CORS/network errors so calling code can handle them
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.warn(`⚠️ API request failed (CORS or network): ${endpoint}`);
      throw error; // Re-throw instead of returning null
    }
    throw error;
  }
};

// Product endpoints
export const productsApi = {
  getAll: (_limit = 100, _page = 1) =>
    apiRequest(`/products`),

  getById: (id: string) =>
    apiRequest(`/products/${id}`),

  create: (product: any) =>
    apiRequest('/products', 'POST', product),

  update: (id: string, product: any) =>
    apiRequest('/products', 'POST', { ...product, id }),

  delete: (id: string) =>
    apiRequest(`/products/${id}`, 'DELETE'),
};

// Brand endpoints
export const brandsApi = {
  getAll: (_limit = 500, _featured?: boolean) => {
    return apiRequest(`/admin/brands`);
  },

  getById: (id: string) =>
    apiRequest(`/admin/brands/${id}`),
};

// Order endpoints
export const ordersApi = {
  getAll: (filters?: any) => {
    const params = new URLSearchParams(filters || {});
    return apiRequest(`/admin/orders?${params.toString()}`);
  },
  
  getById: (orderId: string) => 
    apiRequest(`/admin/orders/${orderId}`),
  
  updateStatus: (orderId: string, status: string) => 
    apiRequest(`/admin/orders/${orderId}/status`, 'PUT', { status }),
};

// User endpoints
export const usersApi = {
  getProfile: (userId: string) => 
    apiRequest(`/users/${userId}/profile`),
  
  getOrders: (userId: string, filters?: any) => {
    const params = new URLSearchParams(filters || {});
    return apiRequest(`/users/${userId}/orders?${params.toString()}`);
  },
  
  getAddresses: (userId: string) => 
    apiRequest(`/users/${userId}/addresses`),
};

// Admin endpoints
export const adminApi = {
  getStats: (period: string = '30d') => 
    apiRequest(`/admin/analytics/dashboard?period=${period}`),
  
  getOrders: (filters?: any) => 
    apiRequest(`/admin/orders`, 'GET', filters),
};
