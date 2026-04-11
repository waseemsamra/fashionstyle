// services/api.ts
import { cache, CACHE_KEYS, getCollectionCacheKey } from './cache';

const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

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

// Simple API methods for products with tag-based filtering
export const api = {
  async listProducts(filters?: { 
    limit?: number; 
    page?: number; 
    isFeatured?: boolean; 
    isNew?: boolean; 
    isSale?: boolean;
    tag?: string;
    occasion?: string;
    brand?: string;
    category?: string;
    nextToken?: string;
    [key: string]: any;
  }) {
    try {
      // Check cache first for unfiltered requests
      const hasFilters = filters && (filters.isFeatured || filters.isNew || filters.isSale || filters.tag || filters.occasion || filters.brand || filters.category);
      
      if (!hasFilters) {
        const cached = cache.get<any[]>(CACHE_KEYS.PRODUCTS);
        if (cached) {
          console.log('⚡ Products from cache');
          return {
            items: cached,
            products: cached,
            data: cached,
            count: cached.length,
            total: cached.length,
          };
        }
      }

      // Build query string with filters
      const queryParams = new URLSearchParams();
      if (filters?.limit) queryParams.append('limit', String(filters.limit));
      if (filters?.page) queryParams.append('page', String(filters.page));
      if (filters?.isFeatured) queryParams.append('isFeatured', 'true');
      if (filters?.isNew) queryParams.append('isNew', 'true');
      if (filters?.isSale) queryParams.append('isSale', 'true');
      if (filters?.tag) queryParams.append('tag', filters.tag);
      if (filters?.occasion) queryParams.append('occasion', filters.occasion);
      if (filters?.brand) queryParams.append('brand', filters.brand);
      if (filters?.category) queryParams.append('category', filters.category);
      if (filters?.nextToken) queryParams.append('nextToken', filters.nextToken);

      // Pass through any additional query parameters
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (!['limit', 'page', 'isFeatured', 'isNew', 'isSale', 'tag', 'occasion', 'brand', 'category', 'nextToken'].includes(key)) {
            queryParams.append(key, String(filters[key]));
          }
        });
      }

      const queryString = queryParams.toString();
      const url = `${API_URL}/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        credentials: 'omit',
        cache: 'force-cache',
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const products = data.items || data.products || [];

      // Cache unfiltered products for 5 minutes
      if (!hasFilters && products.length > 0) {
        cache.set(CACHE_KEYS.PRODUCTS, products, 5 * 60 * 1000);
      }
      
      return {
        items: products,
        products,
        data: products,
        count: data.count || products.length,
        total: data.total || products.length,
        nextToken: data.nextToken,
        lastEvaluatedKey: data.lastEvaluatedKey,
        LastEvaluatedKey: data.LastEvaluatedKey,
        paginationToken: data.paginationToken,
      };
    } catch (error) {
      console.error('❌ API Error (listProducts):', error);
      // Return cached data on error if available
      const cached = cache.get<any[]>(CACHE_KEYS.PRODUCTS);
      if (cached) {
        console.log('⚠️ Returning cached products due to API error');
        return {
          items: cached,
          products: cached,
          data: cached,
          count: cached.length,
          total: cached.length,
        };
      }
      return {
        items: [],
        products: [],
        data: [],
        count: 0,
        total: 0,
        nextToken: null,
        lastEvaluatedKey: null,
        LastEvaluatedKey: null,
        paginationToken: null,
      };
    }
  },

  // ===== COLLECTIONS API - Unified system for home page sections =====
  
  // Get collection with all its products (FAST - direct fetch)
  async getCollection(name: string) {
    try {
      // Check cache first
      const cacheKey = getCollectionCacheKey(name);
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        console.log(`⚡ Collection ${name} from cache`);
        return cached;
      }

      const response = await fetch(`${API_URL}/collections/${name}`, {
        credentials: 'omit',
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Collection ${name} not found`);
        return { collection: null, products: [], count: 0 };
      }
      
      const data = await response.json();
      const result = {
        collection: data.collection || null,
        products: data.products || [],
        count: data.count || 0,
      };

      // Cache collection for 5 minutes
      cache.set(cacheKey, result, 5 * 60 * 1000);

      return result;
    } catch (error) {
      console.error(`❌ API Error (getCollection ${name}):`, error);
      // Try cache on error
      const cacheKey = getCollectionCacheKey(name);
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        console.log(`⚠️ Returning cached collection ${name} due to error`);
        return cached;
      }
      return { collection: null, products: [], count: 0 };
    }
  },

  // Save collection (create/update with product IDs)
  async saveCollection(name: string, data: { 
    productIds: string[]; 
    displayName?: string;
    description?: string;
    metadata?: any;
  }) {
    try {
      console.log(`💾 Saving collection ${name}:`, data);
      
      const response = await fetch(`${API_URL}/collections/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log(`📡 Response status:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Save failed:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Save successful:`, result);

      // Clear collection cache after successful save
      const cacheKey = getCollectionCacheKey(name);
      cache.remove(cacheKey);

      // Also clear products cache since it may have changed
      cache.remove(CACHE_KEYS.PRODUCTS);
      
      return result;
    } catch (error: any) {
      console.error(`❌ API Error (saveCollection ${name}):`, error);
      throw error;
    }
  },

  // List all collections
  async listCollections() {
    try {
      const response = await fetch(`${API_URL}/collections`, {
        credentials: 'omit',
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.collections || [];
    } catch (error) {
      console.error('❌ API Error (listCollections):', error);
      return [];
    }
  },

  // Delete collection
  async deleteCollection(name: string) {
    try {
      const response = await fetch(`${API_URL}/collections/${name}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`❌ API Error (deleteCollection ${name}):`, error);
      throw error;
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
