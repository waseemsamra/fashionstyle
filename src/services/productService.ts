import { productsApi } from './apiGatewayClient';

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
 * Get all products via API Gateway
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    console.log('📦 Fetching ALL products from API Gateway...');

    const response = await productsApi.getAll({ limit: 100, page: 1 });
    console.log('✅ Products response received');
    console.log('📊 Raw response:', response);

    // Handle null/undefined responses (CORS or network errors)
    if (!response) {
      console.warn('⚠️ No response from products API');
      return [];
    }

    // Handle different response formats
    let products = [];
    if (Array.isArray(response)) {
      products = response;
    } else if (response.items && Array.isArray(response.items)) {
      products = response.items;
    } else if (response.products && Array.isArray(response.products)) {
      products = response.products;
    } else if (response.data && Array.isArray(response.data)) {
      products = response.data;
    } else if (response.body) {
      const body = typeof response.body === 'string'
        ? JSON.parse(response.body)
        : response.body;
      products = body.items || body.products || body.data || [];
    }

    console.log('✅ Extracted', products.length, 'products');

    return products;
  } catch (error: any) {
    console.error('❌ Failed to fetch products:', error.message);
    return []; // Return empty array instead of throwing
  }
};

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
