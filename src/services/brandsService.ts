import type { Brand, Collection } from '@/hooks/useBrands';

class BrandsService {
  private baseUrl = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';
  private cache = new Map<string, Brand>();

  async getBrands(options?: { featured?: boolean; limit?: number }): Promise<Brand[]> {
    const token = localStorage.getItem('jwt_token');

    let url = `${this.baseUrl}/brands`;
    const params = new URLSearchParams();

    if (options?.featured) params.append('featured', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());

    if (params.toString()) url += `?${params.toString()}`;

    console.log('🏷️ Fetching brands from:', url);
    console.log('🔑 Token exists:', !!token);

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Brands response status:', response.status);

      if (!response.ok) {
        console.warn('⚠️ Failed to fetch brands (status:', response.status, '), using fallback data');
        // Return mock brands as fallback
        return getMockBrands();
      }

      const data = await response.json();
      console.log('📦 Raw brands response:', data);
      
      const brands = data.items?.map(this.transformBrand) || [];

      console.log('✅ Brands fetched:', brands.length, 'brands');

      return brands;
    } catch (error) {
      console.error('❌ Brands fetch error:', error);
      console.log('🔄 Returning mock brands due to error');
      return getMockBrands();
    }
  }

  async getBrandBySlug(slug: string): Promise<Brand> {
    const token = localStorage.getItem('jwt_token');
    
    // Try to get from cache first (memory cache for instant navigation)
    const cached = this.cache.get(`brand-${slug}`);
    if (cached) {
      console.log('📦 Using cached brand data for', slug);
      return cached;
    }

    console.log('🏷️ Fetching brand by slug:', slug);

    const response = await fetch(`${this.baseUrl}/brands/${slug}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch brand: ${slug}`);
    }

    const data = await response.json();
    const brand = this.transformBrand(data);
    
    // Store in memory cache
    this.cache.set(`brand-${slug}`, brand);
    console.log('✅ Brand fetched and cached:', brand.name);
    
    return brand;
  }

  async getBrandProducts(brandId: string, params: {
    page?: number;
    limit?: number;
    category?: string;
    sortBy?: string;
  }): Promise<{
    products: any[];
    totalPages: number;
    currentPage: number;
    nextPage: number | undefined;
  }> {
    const token = localStorage.getItem('jwt_token');
    
    const url = new URL(`${this.baseUrl}/brands/${brandId}/products`);
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] !== undefined) {
        url.searchParams.append(key, params[key as keyof typeof params]!.toString());
      }
    });

    console.log('📦 Fetching brand products:', url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch brand products');
    }

    const data = await response.json();
    
    console.log('✅ Brand products fetched:', data.items?.length || 0, 'products');
    
    return {
      products: data.items || [],
      totalPages: data.totalPages || 1,
      currentPage: data.currentPage || 1,
      nextPage: data.currentPage < data.totalPages ? data.currentPage + 1 : undefined
    };
  }

  async getBrandCollections(brandId: string): Promise<Collection[]> {
    const token = localStorage.getItem('jwt_token');
    
    console.log('🎯 Fetching collections for brand:', brandId);
    
    const response = await fetch(`${this.baseUrl}/brands/${brandId}/collections`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('⚠️ Failed to fetch collections');
      return [];
    }

    const data = await response.json();
    const collections = data.items?.map(this.transformCollection) || [];
    
    console.log('✅ Collections fetched:', collections.length, 'collections');
    
    return collections;
  }

  private transformBrand = (data: any): Brand => {
    return {
      id: data.id || data.PK || '',
      name: data.name || '',
      slug: data.slug || this.createSlug(data.name),
      logo: data.logo || 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brands/default-logo.png',
      coverImage: data.coverImage || data.cover || 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brands/default-cover.jpg',
      description: data.description || '',
      shortDescription: data.shortDescription || data.description?.substring(0, 150) || '',
      establishedYear: data.establishedYear,
      country: data.country,
      isFeatured: Boolean(data.isFeatured),
      productCount: data.productCount || 0,
      collections: data.collections?.map(this.transformCollection) || [],
      seo: data.seo || {
        title: data.name,
        description: data.description,
        keywords: []
      }
    };
  };

  private transformCollection = (data: any): Collection => {
    return {
      id: data.id || '',
      name: data.name || '',
      slug: data.slug || this.createSlug(data.name),
      description: data.description || '',
      image: data.image || 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/collections/default.jpg',
      productCount: data.productCount || 0,
      isSeasonal: data.isSeasonal || false,
      season: data.season,
      year: data.year
    };
  };

  private createSlug = (name: string): string => {
    if (!name) return '';
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

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

// Mock brands fallback (when API is unavailable)
function getMockBrands(): Brand[] {
  return [
    {
      id: '1',
      name: 'Gucci',
      slug: 'gucci',
      logo: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-gucci.jpg',
      coverImage: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-gucci-cover.jpg',
      description: 'Italian luxury fashion house known for high-quality leather goods and ready-to-wear apparel.',
      shortDescription: 'Italian luxury fashion',
      establishedYear: 1921,
      country: 'Italy',
      isFeatured: true,
      productCount: 156,
      collections: [],
      seo: {
        title: 'Gucci - Luxury Fashion',
        description: 'Shop Gucci luxury fashion',
        keywords: ['gucci', 'luxury', 'italian fashion']
      }
    },
    {
      id: '2',
      name: 'Prada',
      slug: 'prada',
      logo: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-prada.jpg',
      coverImage: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-prada-cover.jpg',
      description: 'Luxury fashion house specializing in leather handbags, travel accessories, shoes, and more.',
      shortDescription: 'Luxury leather goods',
      establishedYear: 1913,
      country: 'Italy',
      isFeatured: true,
      productCount: 142,
      collections: [],
      seo: {
        title: 'Prada - Luxury Leather Goods',
        description: 'Shop Prada luxury items',
        keywords: ['prada', 'luxury', 'leather']
      }
    },
    {
      id: '3',
      name: 'Chanel',
      slug: 'chanel',
      logo: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-chanel.jpg',
      coverImage: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-chanel-cover.jpg',
      description: 'French luxury fashion house known for timeless elegance and the iconic Chanel No. 5 perfume.',
      shortDescription: 'French luxury & elegance',
      establishedYear: 1910,
      country: 'France',
      isFeatured: true,
      productCount: 189,
      collections: [],
      seo: {
        title: 'Chanel - French Luxury Fashion',
        description: 'Shop Chanel luxury fashion',
        keywords: ['chanel', 'luxury', 'french fashion']
      }
    },
    {
      id: '4',
      name: 'Louis Vuitton',
      slug: 'louis-vuitton',
      logo: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-lv.jpg',
      coverImage: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-lv-cover.jpg',
      description: 'French luxury fashion house and company known for its LV monogram and leather goods.',
      shortDescription: 'Iconic LV monogram',
      establishedYear: 1854,
      country: 'France',
      isFeatured: true,
      productCount: 234,
      collections: [],
      seo: {
        title: 'Louis Vuitton - Luxury Fashion',
        description: 'Shop Louis Vuitton luxury items',
        keywords: ['louis vuitton', 'lv', 'luxury']
      }
    },
    {
      id: '5',
      name: 'Hermès',
      slug: 'hermes',
      logo: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-hermes.jpg',
      coverImage: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-hermes-cover.jpg',
      description: 'French luxury goods manufacturer specializing in leather, lifestyle accessories, and perfumes.',
      shortDescription: 'Ultimate luxury craftsmanship',
      establishedYear: 1837,
      country: 'France',
      isFeatured: true,
      productCount: 98,
      collections: [],
      seo: {
        title: 'Hermès - Luxury Craftsmanship',
        description: 'Shop Hermès luxury goods',
        keywords: ['hermes', 'luxury', 'craftsmanship']
      }
    },
    {
      id: '6',
      name: 'Dior',
      slug: 'dior',
      logo: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-dior.jpg',
      coverImage: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brand-dior-cover.jpg',
      description: 'French luxury goods company known for haute couture, ready-to-wear, and accessories.',
      shortDescription: 'French haute couture',
      establishedYear: 1946,
      country: 'France',
      isFeatured: false,
      productCount: 167,
      collections: [],
      seo: {
        title: 'Dior - Haute Couture',
        description: 'Shop Dior fashion',
        keywords: ['dior', 'haute couture', 'luxury']
      }
    }
  ];
}

export const brandsService = new BrandsService();
