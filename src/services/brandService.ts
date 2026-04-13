// services/brandService.ts
// Use NEW API - extract brands from products
const API_URL = 'https://tmdoc0q5ij.execute-api.us-east-1.amazonaws.com';

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
      console.log('🏷️ Fetching brands from NEW API (extracted from products)...');

      // Fetch products and extract unique brands
      const response = await fetch(`${API_URL}/products?limit=1000`);
      const data = await response.json();
      const products = data.items || [];

      // Extract unique brands with product counts
      const brandMap: Record<string, number> = {};
      products.forEach((p: any) => {
        if (p.brand) {
          brandMap[p.brand] = (brandMap[p.brand] || 0) + 1;
        }
      });

      // Convert to Brand objects
      const brands: Brand[] = Object.entries(brandMap).map(([name, count]) => ({
        id: `brand-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: `${name} collection`,
        logo: '',
        coverImage: '',
        productCount: count,
        isFeatured: false,
      })).sort((a, b) => a.name.localeCompare(b.name));

      console.log(`✅ Extracted ${brands.length} unique brands from ${products.length} products`);

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
