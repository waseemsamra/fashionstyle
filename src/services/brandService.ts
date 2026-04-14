// services/brandService.ts
// Fetch brands from the dedicated brands API endpoint
const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

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
      console.log('🏷️ Fetching brands from brands API...');

      // Fetch brands from the dedicated brands endpoint
      const response = await fetch(`${API_URL}/admin/brands`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const brandsData = data.brands || data.items || [];

      // Convert to Brand objects
      const brands: Brand[] = brandsData.map((brand: any) => ({
        id: brand.id || `brand-${brand.name?.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: brand.name || 'Unknown',
        slug: brand.slug || brand.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || '',
        description: brand.description || '',
        logo: brand.logo || '',
        coverImage: brand.coverImage || '',
        productCount: brand.productCount || brand.products || 0,
        isFeatured: brand.isFeatured || false,
      })).sort((a: Brand, b: Brand) => a.name.localeCompare(b.name));

      console.log(`✅ Loaded ${brands.length} brands from database`);

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
