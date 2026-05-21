// services/api.ts
import { cache, CACHE_KEYS, getCollectionCacheKey } from './cache';

import { API_CONFIG } from '../config/api';
const API_URL = API_CONFIG.baseApiUrl;
const PRODUCTS_API = API_CONFIG.productsApi;

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
      credentials: 'include',
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
      credentials: 'include',
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
      credentials: 'include',
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
      credentials: 'include',
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
      // Check cache first for unfiltered requests (unless bypass requested)
      const hasFilters = filters && (filters.isFeatured || filters.isNew || filters.isSale || filters.tag || filters.occasion || filters.brand || filters.category || filters._bypassCache);

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

      // Use new unified API endpoint for collections
      const response = await fetch(`${API_CONFIG.collectionsApi}`, {
        credentials: 'omit',
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Collections API not available, falling back to brands API`);
        return this.getCollectionFromBrands(name);
      }
      
      const data = await response.json();
      console.log(`📦 Collections data:`, data);
      
      // Extract specific collection from the response
      const specificCollection = data[name];
      if (!specificCollection) {
        console.warn(`⚠️ Collection ${name} not found in response`);
        return { collection: null, products: [], count: 0 };
      }
      
      const result = {
        collection: specificCollection.collection || specificCollection,
        products: specificCollection.products || [],
        count: specificCollection.products?.length || 0,
      };

      console.log(`✅ Collection ${name} extracted:`, result);

      // Cache collection for 5 minutes
      cache.set(cacheKey, result, 5 * 60 * 1000);

      return result;
    } catch (error) {
      console.error(`❌ API Error (getCollection ${name}):`, error);
      // Fallback to brands API
      return this.getCollectionFromBrands(name);
    }
  },

  // Fallback method to get collection from brands API
  async getCollectionFromBrands(name: string) {
    try {
      const response = await fetch(API_CONFIG.brandsApi, {
        credentials: 'omit',
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Brands API not available`);
        return { collection: null, products: [], count: 0 };
      }
      
      const brands = await response.json();
      console.log(`📦 Brands data:`, brands);
      
      // Filter featured products from brands
      const featuredProducts = brands.filter((brand: any) => brand.featured === true);
      
      const result = {
        collection: {
          id: name,
          name: name === 'featuredCollection' ? 'Featured Collection' : name,
        },
        products: featuredProducts,
        count: featuredProducts.length,
      };

      console.log(`✅ Collection ${name} extracted from brands:`, result);

      return result;
    } catch (error) {
      console.error(`❌ Brands API Error (getCollection ${name}):`, error);
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
      console.log(`💾 Saving collection ${name}:`, data.productIds.length, 'products');
      
      // For Featured Collection, update the featured flag on brands/products
      if (name === 'featuredCollection') {
        // Update featured status for each product ID
        const updatePromises = data.productIds.map(productId => 
          this.updateFeaturedStatus(productId, true)
        );
        
        const results = await Promise.all(updatePromises);
        console.log(`✅ Updated ${results.length} products as featured`);
        
        // Clear cache after successful update
        const cacheKey = getCollectionCacheKey(name);
        cache.remove(cacheKey);
        cache.remove(CACHE_KEYS.PRODUCTS);
        
        return { success: true, updated: data.productIds.length };
      }
      
      // For other collections, use collections API (if available)
      const collectionData = {
        [name]: {
          id: name,
          name: data.displayName || name,
          description: data.description,
          productIds: data.productIds,
          products: data.productIds,
          metadata: data.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      
      // Add authentication token
      const token = localStorage.getItem('jwt_token') || localStorage.getItem('idToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_CONFIG.collectionsApi}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(collectionData),
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

  // List all brands
  async listBrands() {
    try {
      const response = await fetch(API_CONFIG.brandsApi, {
        credentials: 'omit',
      });
      
      if (!response.ok) {
        console.error(`❌ Failed to fetch brands:`, response.status);
        return [];
      }
      
      const data = await response.json();
      console.log(`📦 Brands loaded:`, data);
      
      // Handle different response structures
      if (Array.isArray(data)) {
        return data;
      } else if (data && data.items && Array.isArray(data.items)) {
        return data.items;
      } else if (data && data.brands && Array.isArray(data.brands)) {
        return data.brands;
      } else if (data && data.data && Array.isArray(data.data)) {
        return data.data;
      }
      
      console.warn('⚠️ Unexpected brands API response structure:', data);
      return [];
    } catch (error) {
      console.error('❌ Failed to list brands:', error);
      return [];
    }
  },

  // Update featured status for a single product
  async updateFeaturedStatus(productId: string, isFeatured: boolean) {
    try {
      // Find the product in brands data and update its featured status
      const brands = await this.listBrands();
      const brand = brands.find((b: any) => b.id === productId);
      
      if (brand) {
        const response = await fetch(`${API_CONFIG.brandsApi}/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured: isFeatured }),
        });
        
        if (response.ok) {
          console.log(`✅ Updated featured status for ${productId}:`, isFeatured);
          return await response.json();
        }
      }
      
      throw new Error(`Product ${productId} not found`);
    } catch (error) {
      console.error(`❌ Failed to update featured status:`, error);
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
      const response = await fetch(`${API_CONFIG.collectionsApi}/${name}`, {
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
      const response = await fetch(`${productsApi}/?ids=${encodeURIComponent(id)}`, {
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

  async getProducts(params?: { limit?: number; page?: number; brand?: string; category?: string }) {
    try {
      const q = new URLSearchParams();
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.page) q.set('page', String(params.page));
      if (params?.brand) q.set('brand', params.brand);
      if (params?.category) q.set('category', params.category);
      const response = await fetch(`${productsApi}/?${q.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      console.error('❌ API Error (getProducts):', error);
      return { items: [], total: 0 };
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
  
  async updateOrderStatus(orderId: string, status: string) {
    console.log('🔄 API updateOrderStatus called:', { orderId, status });
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Note: cors-fixed stage doesn't require Authorization header
    
    const url = `${API_CONFIG.ordersApi}/orders/${orderId}`;
    console.log('🔄 Fetch URL:', url);
    console.log('🔄 Request method: PUT');
    console.log('🔄 Request headers:', headers);
    console.log('🔄 Request body:', { status });
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });
    
    console.log('🔄 Response status:', response.status);
    console.log('🔄 Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔄 API Error Response:', errorText);
      throw new Error(`Failed to update order status: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🔄 API Response:', result);
    return result;
  },
  
  async deleteOrder(orderId: string) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Note: cors-fixed stage doesn't require Authorization header
    
    const response = await fetch(`${API_CONFIG.ordersApi}/orders/${orderId}`, {
      method: 'DELETE',
      headers,
    });
    
    // DELETE returns 204 No Content on success
    if (response.status === 204) {
      console.log(`✅ Order ${orderId} deleted successfully`);
      return { success: true, message: 'Order deleted successfully' };
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete order: ${response.status} - ${errorText}`);
    }
    
    return response.json();
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
