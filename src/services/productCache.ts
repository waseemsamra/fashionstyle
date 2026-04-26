// services/productCache.ts - Centralized product caching to prevent redundant API calls

const API_URL = import.meta.env.VITE_API_URL || 'https://zbdw3piterihfqm37o3swldeca0qitsj.lambda-url.us-east-1.on.aws';

interface CacheEntry {
  data: any[];
  timestamp: number;
  promise?: Promise<any[]>;
}

// Global cache to store products in memory
let productCache: CacheEntry | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch products with intelligent caching
 * Prevents redundant API calls across components
 * Returns data in same format as original API (with .items, .products, etc.)
 */
export async function getProducts(forceRefresh = false): Promise<any> {
  // Return cached data if still valid and not forcing refresh
  if (!forceRefresh && productCache && (Date.now() - productCache.timestamp) < CACHE_DURATION) {
    console.log('⚡ Using cached products data');
    return {
      items: productCache.data,
      products: productCache.data,
      data: productCache.data,
    };
  }

  // If there's already a promise in progress, return it to prevent duplicate calls
  if (productCache?.promise) {
    console.log('⏳ Waiting for in-progress API call');
    const data = await productCache.promise;
    return {
      items: data,
      products: data,
      data: data,
    };
  }

  console.log('📡 Fetching products from API...');
  
  // Create a new promise and store it in cache
  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/products?limit=500`, {
        // Add cache control headers for better performance
        cache: 'force-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const products = data.items || data.products || data || [];
      
      console.log(`✅ Fetched ${products.length} products from API`);
      
      // Update cache with fresh data
      productCache = {
        data: products,
        timestamp: Date.now(),
        promise: undefined,
      };
      
      return products;
    } catch (error) {
      console.error('❌ Failed to fetch products:', error);
      // Clear the promise so next call will retry
      if (productCache) {
        productCache.promise = undefined;
      }
      // Return cached data even if stale on error
      if (productCache?.data) {
        console.log('⚠️ Returning stale cached data due to error');
        return productCache.data;
      }
      return [];
    }
  })();

  // Store the promise in cache
  if (!productCache) {
    productCache = {
      data: [],
      timestamp: 0,
      promise: fetchPromise,
    };
  } else {
    productCache.promise = fetchPromise;
  }

  const data = await fetchPromise;
  return {
    items: data,
    products: data,
    data: data,
  };
}

/**
 * Get a single product by ID with caching
 */
export async function getProductById(id: string): Promise<any | null> {
  const response = await getProducts();
  const products = response.items || [];
  return products.find((p: any) => String(p.id) === String(id)) || null;
}

/**
 * Clear the product cache (useful after admin updates)
 */
export function clearProductCache() {
  if (productCache) {
    productCache.data = [];
    productCache.timestamp = 0;
    productCache.promise = undefined;
  }
  console.log('🗑️ Product cache cleared');
}
