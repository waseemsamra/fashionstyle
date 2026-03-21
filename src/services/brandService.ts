// services/brandService.ts
import { brandsApi } from './apiGatewayClient';

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

  async getAllBrands(options?: { featured?: boolean; limit?: number }): Promise<Brand[]> {
    // Check cache first
    if (this.cachedBrands && Date.now() - this.lastFetch < this.cacheTime) {
      console.log('📦 Using cached brands');
      return this.cachedBrands;
    }

    try {
      console.log('🏷️ Fetching ALL brands from API Gateway...');
      
      const response = await brandsApi.getAll(options?.limit || 500, options?.featured);
      console.log('📦 Raw brands response:', response);

      // Handle different response structures
      let items = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response.items && Array.isArray(response.items)) {
        items = response.items;
      } else if (response.brands && Array.isArray(response.brands)) {
        items = response.brands;
      } else if (response.data && Array.isArray(response.data)) {
        items = response.data;
      } else if (response.body) {
        const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        items = body.items || body.brands || body.data || [];
      }

      console.log('📦 Extracted items:', items.length);

      const brands = items.map(this.transformBrand);

      console.log('✅ Brands fetched:', brands.length, 'brands');
      if (brands.length > 0) {
        console.log('✅ First brand:', brands[0].name);
      }

      // Cache the results
      this.cachedBrands = brands;
      this.lastFetch = Date.now();

      return brands;
    } catch (error: any) {
      console.error('❌ Brands fetch error:', error.name, error.message);
      throw error;
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
