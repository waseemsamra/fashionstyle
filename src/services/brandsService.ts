// Brands service - fetches brands from products API

export interface Brand {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  logo?: string;
  coverImage?: string;
  description?: string;
  shortDescription?: string;
  isFeatured?: boolean;
  establishedYear?: number;
  country?: string;
  collections?: Collection[];
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount: number;
  isSeasonal?: boolean;
  season?: string;
  year?: number;
}

class BrandsService {
  private baseUrl = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';
  private productsUrl = `${this.baseUrl}/products`;
  private cache = new Map<string, Brand>();

  /**
   * Fetch brands by extracting from products API
   * This works without authentication!
   */
  async getBrands(options?: { featured?: boolean; limit?: number }): Promise<Brand[]> {
    console.log('🏷️ Fetching brands from products API...');

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(this.productsUrl, {
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📥 Products response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Raw products response:', data);

      const products = data.items || data.products || data.data || [];
      console.log('📦 Total products:', products.length);

      // Group products by brand
      const brandMap = new Map<string, Brand>();

      products.forEach((product: any) => {
        const brandName = product.brand;
        if (!brandName) return;

        const brandId = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        if (!brandMap.has(brandId)) {
          brandMap.set(brandId, {
            id: brandId,
            name: brandName,
            slug: brandId,
            productCount: 1,
            logo: `https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brands/${brandId}.jpg`,
            coverImage: `https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brands/${brandId}-cover.jpg`,
            description: `Discover the latest collection from ${brandName}`,
            shortDescription: `Shop ${brandName} collection`,
            isFeatured: false,
            collections: [],
            seo: {
              title: brandName,
              description: `Shop ${brandName} collection`,
              keywords: [brandName.toLowerCase()]
            }
          });
        } else {
          const existing = brandMap.get(brandId)!;
          existing.productCount++;
        }
      });

      // Convert map to array and sort by product count
      let brands = Array.from(brandMap.values())
        .sort((a, b) => b.productCount - a.productCount);

      console.log(`📊 Extracted ${brands.length} brands from ${products.length} products`);

      // Apply limit if specified
      if (options?.limit) {
        brands = brands.slice(0, options.limit);
      }

      // If featured only, return top brands (you can add isFeatured logic later)
      if (options?.featured) {
        brands = brands.slice(0, 10);
      }

      console.log('✅ Brands fetched:', brands.length, 'brands');
      if (brands.length > 0) {
        console.log('✅ First brand:', brands[0].name, 'with', brands[0].productCount, 'products');
      }

      return brands;

    } catch (error: any) {
      console.error('❌ Brands fetch error:', error.name, error.message);

      if (error.name === 'AbortError') {
        console.error('⏱️ Request timed out after 15 seconds');
        throw new Error('Request timed out - please check your internet connection');
      }

      if (error.message.includes('Failed to fetch')) {
        console.error('🌐 Network error - likely CORS or offline');
        throw new Error('Network error - please check your connection');
      }

      throw error;
    }
  }

  async getFeaturedBrands(limit: number = 10): Promise<Brand[]> {
    const brands = await this.getBrands();
    return brands.filter(b => b.isFeatured).slice(0, limit);
  }

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    console.log('🏷️ Fetching brand by slug:', slug);

    // Try to get from cache first
    const cached = this.cache.get(`brand-${slug}`);
    if (cached) {
      console.log('📦 Using cached brand data for', slug);
      return cached;
    }

    // Get all brands and find by slug
    const allBrands = await this.getBrands();
    const brand = allBrands.find(b => b.slug === slug) || null;

    if (brand) {
      // Cache for future requests
      this.cache.set(`brand-${slug}`, brand);
      console.log('✅ Brand found:', brand.name);
    } else {
      console.warn('⚠️ Brand not found:', slug);
    }

    return brand;
  }

  async getBrandProducts(brandName: string, params?: { page?: number; limit?: number }) {
    console.log('📦 Fetching products for brand:', brandName);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const url = new URL(this.productsUrl);
      url.searchParams.append('brand', brandName);
      if (params?.page) url.searchParams.append('page', params.page.toString());
      if (params?.limit) url.searchParams.append('limit', params.limit.toString());

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch brand products: ${response.status}`);
      }

      const data = await response.json();
      const products = data.items || data.products || [];

      console.log('✅ Brand products fetched:', products.length);

      return {
        products,
        totalPages: 1,
        currentPage: 1,
        nextPage: undefined
      };
    } catch (error: any) {
      console.error('❌ Brand products error:', error.message);
      return {
        products: [],
        totalPages: 0,
        currentPage: 0,
        nextPage: undefined
      };
    }
  }

  async getBrandCollections(_brandId: string) {
    // Collections not implemented yet - return empty array
    return [];
  }

  // Clear cache (useful for admin updates)
  clearCache(slug?: string) {
    if (slug) {
      this.cache.delete(`brand-${slug}`);
      console.log('🗑️ Cleared cache for brand:', slug);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all brand cache');
    }
  }
}

export const brandsService = new BrandsService();
