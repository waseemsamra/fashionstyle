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
      console.log('🏷️ Fetching brands from products API...');

      // Fetch products and extract brands from them
      const response = await fetch(`${API_URL}/products?limit=1000`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const products = data.products || data.items || [];

      // Extract unique brands from products
      const brandMap = new Map<string, number>();
      products.forEach((product: any) => {
        if (product.brand) {
          const brand = String(product.brand);
          brandMap.set(brand, (brandMap.get(brand) || 0) + 1);
        }
      });

      const brandsData = Array.from(brandMap.entries()).map(([name, count]) => ({
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: name,
        slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: `${count} products`,
        logo: '',
        coverImage: '',
        productCount: count,
        isFeatured: false,
      }));

      // Convert to Brand objects
      const brands: Brand[] = brandsData.map((brand: any) => ({
        id: brand.id || `brand-${brand.name?.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: brand.name || 'Unknown',
        slug: brand.slug || brand.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || '',
        description: brand.description || '',
        logo: brand.logo || '',
        coverImage: brand.coverImage || '',
        productCount: brand.productCount || 0,
        isFeatured: brand.isFeatured || false,
      })).sort((a: Brand, b: Brand) => a.name.localeCompare(b.name));

      console.log(`✅ Extracted ${brands.length} brands from products`);

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
