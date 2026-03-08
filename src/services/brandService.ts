import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';

export interface Brand {
  id: string;
  name: string;
  description?: string;
  products?: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get all brands
 */
export const getAllBrands = async (): Promise<Brand[]> => {
  try {
    console.log('🏷️ Fetching all brands...');
    
    const token = localStorage.getItem('jwt_token');
    
    const response = await axios.get(
      `${API_URL}/admin/brands`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );
    
    console.log('✅ Brands fetched:', response.data);
    return response.data.items || response.data;
  } catch (error: any) {
    console.error('❌ Failed to fetch brands:', error);
    return [];
  }
};

/**
 * Create a new brand
 */
export const createBrand = async (brand: Brand): Promise<Brand> => {
  try {
    console.log('🏷️ Creating brand:', brand.name);
    
    const token = localStorage.getItem('jwt_token');
    
    const response = await axios.post(
      `${API_URL}/admin/brands`,
      brand,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );
    
    console.log('✅ Brand created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to create brand:', error);
    throw error;
  }
};

/**
 * Update an existing brand
 */
export const updateBrand = async (brand: Brand): Promise<Brand> => {
  try {
    console.log('🏷️ Updating brand:', brand.id, brand.name);
    
    const token = localStorage.getItem('jwt_token');
    
    const response = await axios.put(
      `${API_URL}/admin/brands/${brand.id}`,
      brand,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );
    
    console.log('✅ Brand updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to update brand:', error);
    throw error;
  }
};

/**
 * Delete a brand
 */
export const deleteBrand = async (brandId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting brand:', brandId);
    
    const token = localStorage.getItem('jwt_token');
    
    await axios.delete(
      `${API_URL}/admin/brands/${brandId}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );
    
    console.log('✅ Brand deleted');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to delete brand:', error);
    return false;
  }
};
