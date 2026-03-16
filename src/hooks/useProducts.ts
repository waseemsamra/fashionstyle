import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { adaptProduct } from '../utils/productAdapter';

// Products query with caching
export const useProducts = (category?: string, brand?: string) => {
  return useQuery({
    queryKey: ['products', category, brand].filter(Boolean),
    queryFn: () => api.listProducts({ category, brand }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Single product query with caching
export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('No product ID');
      
      const token = localStorage.getItem('jwt_token');
      console.log(`🔍 Fetching product with ID: ${id}`);
      
      try {
        const response = await fetch(
          `https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/products`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        console.log('📦 Raw API response:', data);
        
        // Handle the response which is an array of products
        const items = data.items || data.products || data || [];
        if (Array.isArray(items)) {
          // Find the product with matching ID
          const foundProduct = items.find((item: any) => 
            String(item.id) === String(id) || 
            String(item.PK) === String(id)
          );
          
          if (!foundProduct) {
            throw new Error(`Product with ID ${id} not found`);
          }
          
          console.log('✅ Found product:', foundProduct);
          return adaptProduct(foundProduct);
        }
        
        // If it's a single product object
        if (items.id || items.PK) {
          return adaptProduct(items);
        }
        
        throw new Error('Unexpected API response format');
      } catch (error) {
        console.error('❌ Error fetching product:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
    retry: 1
  });
};

// All products for filtering (cached)
export const useAllProducts = () => {
  return useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      console.log('useAllProducts: Fetching products...');
      try {
        const allItems: any[] = [];
        let nextToken: string | undefined;

        do {
          const data = await api.listProducts(nextToken ? { nextToken } : {});
          console.log('useAllProducts: Received data:', data);
          if (Array.isArray(data?.items)) {
            allItems.push(...data.items);
          }
          nextToken = data?.nextToken;
        } while (nextToken);

        console.log('useAllProducts: Total items:', allItems.length);
        return allItems;
      } catch (error) {
        console.error('useAllProducts: Failed to load products:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    retry: 2,
    retryDelay: 1000,
  });
};

// Filters query
export const useFilters = () => {
  return useQuery({
    queryKey: ['filters'],
    queryFn: async () => {
      const products = await api.listProducts();
      const items = Array.isArray(products?.items) ? products.items : [];
      
      return {
        categories: [...new Set(items.map((p: any) => p.category).filter(Boolean))],
        brands: [...new Set(items.map((p: any) => p.brand).filter(Boolean))],
        priceRange: {
          min: Math.min(...items.map((p: any) => p.price || 0)),
          max: Math.max(...items.map((p: any) => p.price || 0)),
        },
      };
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Search query
export const useSearch = (query: string, filters = {}, page = 1) => {
  return useQuery({
    queryKey: ['search', query, filters, page].filter(Boolean),
    queryFn: () => api.searchProducts({ q: query, ...filters, page }),
    enabled: query.length >= 3,
    staleTime: 2 * 60 * 1000,
  });
};
