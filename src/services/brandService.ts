// services/brandService.ts
// Fetch brands from the dedicated brands API endpoint
import { API_CONFIG } from '../config/api';
const API_URL = API_CONFIG.brandsApi;

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  coverImage: string;
  productCount: number;
  isFeatured: boolean;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
}

class BrandService {
  private cachedBrands: Brand[] | null = null;
  private cacheTime: number = 5 * 60 * 1000; // 5 minutes
  private lastFetch: number = 0;

  async getAllBrands(_options?: { featured?: boolean; limit?: number }): Promise<Brand[]> {
    // Check cache first
    if (this.cachedBrands && Date.now() - this.lastFetch < this.cacheTime) {
      console.log('📦 Using cached brands');
      return this.cachedBrands;
    }

    try {
      console.log('🏷️ Fetching brands from dedicated brands API...');
      
      // Fetch brands directly from brands API
      const response = await fetch(`${API_URL}?limit=${_options?.limit || 500}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      let brands = data.brands || data.items || [];
      
      // Apply filters if provided
      if (_options?.featured) {
        brands = brands.filter((brand: Brand) => brand.isFeatured);
      }
      

      console.log(`✅ Fetched ${brands.length} brands from brands API`);

      // Cache the results
      this.cachedBrands = brands;
      this.lastFetch = Date.now();

      return brands;
    } catch (error: any) {
      console.error('❌ Brands fetch error:', error.name, error.message);
      return [];
    }
  }

  // Clear cache (useful for admin updates)
  clearCache() {
    this.cachedBrands = null;
    this.lastFetch = 0;
    console.log('🗑️ Cleared brands cache');
  }
}

export const brandService = new BrandService();
