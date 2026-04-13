// services/brandService.ts
// Brands API is on the OLD endpoint (new API doesn't have brands endpoint)
const BRANDS_API_URL = 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

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
      console.log('🏷️ Fetching ALL brands from OLD API (brands not on new API)...');

      // Brands only exist on the OLD API
      const response = await fetch(`${BRANDS_API_URL}/admin/brands`);
      const data = await response.json();
      console.log('📦 Raw brands response:', data);

      // Handle different response structures
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.brands && Array.isArray(data.brands)) {
        items = data.brands;
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
      }

      if (!response || items.length === 0) {
        console.log('⚠️ No brands found in response');
        return [];
      }

      const brands = items.map(this.transformBrand);

      console.log('✅ Brands fetched:', brands.length, 'brands');

      // Cache the results
      this.cachedBrands = brands;
      this.lastFetch = Date.now();

      return brands;
    } catch (error: any) {
      console.error('❌ Brands fetch error:', error.name, error.message);
      return []; // Return empty array instead of throwing
    }
  }

  private transformBrand = (data: any): Brand => {
    return {
      id: data.id || data.PK || '',
      name: data.name || '',
      slug: data.slug || this.createSlug(data.name),
      description: data.description || '',
      logo: data.logo || 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brands/default-logo.png',
      coverImage: data.coverImage || data.cover || 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brands/default-cover.jpg',
      productCount: data.productCount || 0,
      isFeatured: Boolean(data.isFeatured),
      products: data.products || []
    };
  };

  private createSlug = (name: string): string => {
    if (!name) return '';
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Clear cache (useful for admin updates)
  clearCache() {
    this.cachedBrands = null;
    this.lastFetch = 0;
    console.log('🗑️ Cleared brands cache');
  }
}

export const brandService = new BrandService();
