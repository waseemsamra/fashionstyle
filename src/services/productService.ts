import axios from 'axios';

// Public API for reading products/brands (read-only)
const API_URL = import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws';
// Admin API for write operations (create/update/delete)
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'https://l7u50xa9j4.execute-api.us-east-1.amazonaws.com/prod';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
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
}

/**
 * Create a new product
 */
export const createProduct = async (product: Product): Promise<Product> => {
  try {
    console.log('📦 Creating product:', product.name);
    
    const token = localStorage.getItem('jwt_token');
    const cleanToken = token ? token.replace(/^["']|["']$/g, '') : null;
    
    const response = await axios.post(
      `${ADMIN_API_URL}/products`,
      product,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(cleanToken && { 'Authorization': `Bearer ${cleanToken}` })
        }
      }
    );
    
    console.log('✅ Product created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to create product:', error);
    throw error;
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (product: Product): Promise<Product> => {
  try {
    console.log('📦 Updating product:', product.id, product.name);
    console.log('📸 Images:', product.images);
    console.log('💲 Price being sent:', product.price);
    console.log('📝 Full product data:', product);
    
    const token = localStorage.getItem('jwt_token');
    const cleanToken = token ? token.replace(/^["']|["']$/g, '') : null;
    
    const url = `${ADMIN_API_URL}/products/${product.id}`;
    console.log('🌐 PUT URL (Admin API):', url);
    console.log('🔑 Token exists:', !!cleanToken);
    
    const response = await axios.put(
      url,
      product,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(cleanToken && { 'Authorization': `Bearer ${cleanToken}` })
        }
      }
    );
    
    console.log('✅ API Response:', response.data);
    console.log('✅ Price in response:', response.data.price);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to update product:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    throw error;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting product:', productId);
    
    const token = localStorage.getItem('jwt_token');
    const cleanToken = token ? token.replace(/^["']|["']$/g, '') : null;
    
    await axios.delete(
      `${ADMIN_API_URL}/products/${productId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(cleanToken && { 'Authorization': `Bearer ${cleanToken}` })
        }
      }
    );
    
    console.log('✅ Product deleted');
  } catch (error: any) {
    console.error('❌ Failed to delete product:', error);
    throw error;
  }
};

/**
 * Get all products
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const token = localStorage.getItem('jwt_token');
    
    try {
      const response = await axios.get(
        `${API_URL}/admin/products`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );
      
      return response.data.items || response.data;
    } catch (adminErr: any) {
      console.log('Admin endpoint not available, using regular endpoint');
      // Fallback to regular products endpoint
      const response = await axios.get(API_URL + '/products');
      return response.data.items || response.data;
    }
  } catch (error: any) {
    console.error('❌ Failed to get products:', error);
    return [];
  }
};
