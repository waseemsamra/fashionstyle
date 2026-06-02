import axios from 'axios';

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API || 'https://l7u50xa9j4.execute-api.us-east-1.amazonaws.com/prod';
const BRANDS_API = import.meta.env.VITE_BRANDS_API || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws/brands';

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
 * Get all brands - tries admin API first, falls back to public API
 */
export const getAllBrands = async (): Promise<Brand[]> => {
  try {
    console.log('🏷️ Fetching all brands...');
    
    const token = localStorage.getItem('jwt_token');
    
    // Try admin API first
    try {
      const response = await axios.get(
        `${ADMIN_API_URL}/brands`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );
      
      console.log('✅ Brands fetched from admin API:', response.data);
      return response.data.items || response.data;
    } catch (adminErr: any) {
      console.log('⚠️ Admin API failed, trying public brands endpoint...');
    }
    
    // Fallback to public brands API
    const response = await axios.get(BRANDS_API);
    console.log('✅ Brands fetched from public API:', response.data);
    return response.data.items || response.data;
  } catch (error: any) {
    console.error('❌ Failed to fetch brands:', error);
    return [];
  }
};

/**
 * Create a new brand - uses public API (no auth required)
 */
export const createBrand = async (brand: Brand): Promise<Brand> => {
  try {
    console.log('🏷️ Creating brand:', brand.name);
    
    // Use public brands endpoint for writes (no auth required based on API testing)
    const response = await axios.post(
      BRANDS_API,
      brand,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Brand created:', response.data);
    return response.data.brand || response.data;
  } catch (error: any) {
    console.error('❌ Failed to create brand:', error);
    throw error;
  }
};

/**
 * Update an existing brand - uses public API
 */
export const updateBrand = async (brand: Brand): Promise<Brand> => {
  try {
    console.log('🏷️ Updating brand:', brand.id, brand.name);
    
    const response = await axios.put(
      `${BRANDS_API}/${brand.id}`,
      brand,
      {
        headers: {
          'Content-Type': 'application/json'
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
 * Delete a brand - uses public API
 */
export const deleteBrand = async (brandId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting brand:', brandId);
    
    await axios.delete(
      `${BRANDS_API}/${brandId}`
    );
    
    console.log('✅ Brand deleted');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to delete brand:', error);
    return false;
  }
};
