import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';

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
    
    // Use correct endpoint: POST /products
    const response = await axios.post(
      `${API_URL}/products`,
      product,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
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
    
    const url = `${API_URL}/products/${product.id}`;
    console.log('🌐 PUT URL:', url);
    console.log('🔑 Token exists:', !!token);
    
    // Try WITHOUT Authorization header first (public API)
    const response = await axios.put(
      url,
      product,
      {
        headers: {
          'Content-Type': 'application/json'
          // No Authorization header - test if API is public
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
    
    // If 403, try with Authorization header
    if (error.response?.status === 403) {
      console.log('🔑 403 detected, trying with Authorization header...');
      const token = localStorage.getItem('jwt_token');
      if (token) {
        const cleanToken = token.replace(/^["']|["']$/g, '');
        
        const retryResponse = await axios.put(
          `${API_URL}/products/${product.id}`,
          product,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cleanToken}`
            }
          }
        );
        
        console.log('✅ Retry successful:', retryResponse.data);
        return retryResponse.data;
      }
    }
    
    throw error;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting product:', productId);
    
    const token = localStorage.getItem('jwt_token');
    
    // Use correct endpoint: DELETE /products/{id}
    await axios.delete(
      `${API_URL}/products/${productId}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );
    
    console.log('✅ Product deleted');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to delete product:', error);
    return false;
  }
};

/**
 * Get all products
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    console.log('📦 Fetching products from API...');
    
    const token = localStorage.getItem('jwt_token');
    
    // Use the working endpoint: GET /products
    const response = await axios.get(
      `${API_URL}/products`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );

    console.log('✅ Products response:', response.data);
    
    // Handle different response formats
    const products = response.data.items || response.data.products || response.data || [];
    console.log('✅ Extracted', products.length, 'products');
    
    return products;
  } catch (error: any) {
    console.error('❌ Failed to get products:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    return [];
  }
};
