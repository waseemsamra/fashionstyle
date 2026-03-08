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
    
    const response = await axios.post(
      `${API_URL}/admin/products`,
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
    
    const token = localStorage.getItem('jwt_token');
    
    const response = await axios.put(
      `${API_URL}/admin/products/${product.id}`,
      product,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );
    
    console.log('✅ Product updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to update product:', error);
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
    
    await axios.delete(
      `${API_URL}/admin/products/${productId}`,
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
    
    const response = await axios.get(
      `${API_URL}/admin/products`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );
    
    return response.data.items || response.data;
  } catch (error: any) {
    console.error('❌ Failed to get products:', error);
    return [];
  }
};
