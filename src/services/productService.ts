import { productsApi } from '../config/api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category?: string;
  brand?: string;
  image?: string;
  images?: string[];
  stock?: number;
  sku?: string;
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  patterns?: string[];
  occasions?: string[];
  genders?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isSale?: boolean;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Load ALL products from API with progress tracking
 * Fetches in batches and calls onProgress callback
 */
export const loadAllProducts = async (
  filters?: { brand?: string; category?: string; isSale?: boolean; isNew?: boolean },
  onProgress?: (loaded: number, total: number, hasMore: boolean) => void
): Promise<Product[]> => {
  let allProducts: Product[] = [];
  let page = 1;
  const limit = 500; // Fetch 500 per batch for speed
  let hasMore = true;
  let totalProducts = 0;

  try {
    // Build query params for first request
    const firstParams = new URLSearchParams();
    firstParams.append('limit', '1');
    firstParams.append('page', '1');
    if (filters?.brand) firstParams.append('brand', filters.brand);
    if (filters?.category) firstParams.append('category', filters.category);
    if (filters?.isSale) firstParams.append('isSale', 'true');
    if (filters?.isNew) firstParams.append('isNew', 'true');

    // First request to get total count
    const firstResponse = await fetch(
      `${import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod'}/products?${firstParams.toString()}`
    );
    const firstData = await firstResponse.json();
    totalProducts = firstData.total || firstData.count || 0;

    console.log(`📊 Total products available (with filters): ${totalProducts}`);

    if (totalProducts === 0) {
      return [];
    }

    // Now fetch all products in batches with filters
    while (hasMore) {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('page', String(page));
      if (filters?.brand) params.append('brand', filters.brand);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.isSale) params.append('isSale', 'true');
      if (filters?.isNew) params.append('isNew', 'true');

      const url = `${import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod'}/products?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const items: Product[] = data.items || [];

      allProducts = [...allProducts, ...items];

      // Check if we have more pages
      hasMore = items.length === limit && allProducts.length < totalProducts;
      page++;

      // Report progress
      if (onProgress) {
        onProgress(allProducts.length, totalProducts, hasMore);
      }

      console.log(`📦 Loaded page ${page - 1}: ${items.length} products (total: ${allProducts.length}/${totalProducts})`);
    }

    console.log(`✅ All products loaded: ${allProducts.length}`);
    return allProducts;
  } catch (error) {
    console.error('❌ Failed to load products:', error);
    return allProducts; // Return what we have so far
  }
};

/**
 * Get all products (alias for backward compatibility)
 */
export const getAllProducts = loadAllProducts;

/**
 * Get product by ID via API Gateway
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    console.log('📦 Fetching product:', id);

    const response = await productsApi.getById(id);
    console.log('✅ Product fetched:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch product:', error.message);
    return null;
  }
};

/**
 * Create a new product via API Gateway
 */
export const createProduct = async (product: Product): Promise<Product> => {
  try {
    console.log('📦 Creating product:', product.name);

    const response = await productsApi.create(product);
    console.log('✅ Product created:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Failed to create product:', error.message);
    throw error;
  }
};

/**
 * Update an existing product via API Gateway
 */
export const updateProduct = async (product: Product): Promise<Product> => {
  try {
    console.log('📦 Updating product:', product.id, product.name);

    if (!product.id) {
      throw new Error('Product ID is required for update');
    }

    const response = await productsApi.update(product.id, product);
    console.log('✅ Product updated:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Failed to update product:', error.message);
    throw error;
  }
};

/**
 * Delete a product via API Gateway
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Attempting to delete product:', productId);

    const result = await productsApi.delete(productId);
    
    // 204 = success, 404 = already deleted (treat as success)
    if (result?.success) {
      if (result.status === 404) {
        console.log('⚠️ Product', productId, 'not found (may already be deleted)');
      } else {
        console.log('✅ Product deleted successfully:', productId);
      }
      return true;
    }
    
    console.error('❌ Delete did not return success for:', productId);
    return false;
  } catch (error: any) {
    // Network/CORS errors
    console.error('❌ Failed to delete product:', productId);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error name:', error.name);
    
    // Check if this is a 404 that got caught as an error
    if (error.message?.includes('404')) {
      console.log('⚠️ Product', productId, 'not found (404) - treating as success');
      return true;
    }
    
    return false;
  }
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
