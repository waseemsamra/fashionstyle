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
    
    // Prepare headers
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    // Only add Authorization if token exists
    if (token) {
      // Make sure token doesn't have extra quotes or formatting
      const cleanToken = token.replace(/^["']|["']$/g, '');
      headers['Authorization'] = `Bearer ${cleanToken}`;
      console.log('🔑 Authorization header:', `Bearer ${cleanToken.substring(0, 20)}...`);
    }
    
    // Use correct endpoint: PUT /products/{id}
    const response = await axios.put(
      url,
      product,
      {
        headers
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
