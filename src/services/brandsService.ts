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

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Brands response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`Failed to fetch brands: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Raw brands response:', data);
      
      // Handle different response structures
      const items = data.items || data.brands || data.data || [];
      const brands = Array.isArray(items) ? items.map(this.transformBrand) : [];

      console.log('✅ Brands fetched:', brands.length, 'brands');

      return brands;
    } catch (error) {
      console.error('❌ Brands fetch error:', error);
      throw error;
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

export const brandsService = new BrandsService();
