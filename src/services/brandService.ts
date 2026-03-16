export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  coverImage: string;
  productCount: number;
  isFeatured: boolean;
  shortDescription?: string;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
  collections?: any[];
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
  establishedYear?: number;
  country?: string;
}

export interface BrandFilters {
  featured?: boolean;
  search?: string;
  minProducts?: number;
  limit?: number;
}

class BrandService {
  private productsUrl = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/products';
  private cachedBrands: Brand[] | null = null;
  private cacheTime: number = 5 * 60 * 1000; // 5 minutes
  private lastFetch: number = 0;

  async getAllBrands(filters?: BrandFilters): Promise<Brand[]> {
    // Check cache
    if (this.cachedBrands && Date.now() - this.lastFetch < this.cacheTime) {
      console.log('📦 Using cached brands');
      return this.applyFilters(this.cachedBrands, filters);
    }

    try {
      console.log('🔄 Fetching products to extract brands...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(this.productsUrl, {
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      const products = data.items || [];

      // Group products by brand
      const brandMap = new Map<string, Brand>();

      products.forEach((product: any) => {
        const brandName = product.brand;
        if (!brandName) return;

        const brandId = this.createSlug(brandName);

        if (!brandMap.has(brandId)) {
          brandMap.set(brandId, {
            id: brandId,
            name: brandName,
            slug: brandId,
            description: this.generateBrandDescription(brandName),
            shortDescription: `Shop ${brandName} collection`,
            logo: `https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brands/${brandId}.jpg`,
            coverImage: `https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brands/${brandId}-cover.jpg`,
            productCount: 1,
            isFeatured: product.isFeatured || false,
            products: [{
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image
            }],
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
          if (product.isFeatured) {
            existing.isFeatured = true;
          }
          // Add product to brand's product list (keep last 5 for preview)
          if (!existing.products) {
            existing.products = [];
          }
          if (existing.products.length < 5) {
            existing.products.push({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image
            });
          }
        }
      });

      // Convert map to array and sort
      let brands = Array.from(brandMap.values())
        .sort((a, b) => b.productCount - a.productCount);

      console.log(`📊 Extracted ${brands.length} brands from ${products.length} products`);

      // Update cache
      this.cachedBrands = brands;
      this.lastFetch = Date.now();

      return this.applyFilters(brands, filters);

    } catch (error: any) {
      console.error('❌ Error fetching brands:', error.name, error.message);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - please check your internet connection');
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error - please check your connection');
      }
      
      return [];
    }
  }

  async getFeaturedBrands(limit: number = 10): Promise<Brand[]> {
    const brands = await this.getAllBrands({ featured: true });
    return brands.slice(0, limit);
  }

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    const brands = await this.getAllBrands();
    return brands.find(b => b.slug === slug) || null;
  }

  async getBrandProducts(brandName: string, limit: number = 20) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const url = new URL(this.productsUrl);
      url.searchParams.append('brand', encodeURIComponent(brandName));
      url.searchParams.append('limit', limit.toString());

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
      return data.items || [];
    } catch (error: any) {
      console.error('❌ Error fetching brand products:', error.message);
      return [];
    }
  }

  async searchBrands(searchTerm: string): Promise<Brand[]> {
    const brands = await this.getAllBrands();
    return brands.filter(brand =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  private applyFilters(brands: Brand[], filters?: BrandFilters): Brand[] {
    if (!filters) return brands;

    let filtered = [...brands];

    if (filters.featured) {
      filtered = filtered.filter(b => b.isFeatured);
    }

    if (filters.minProducts) {
      filtered = filtered.filter(b => b.productCount >= filters.minProducts!);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  private createSlug(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private generateBrandDescription(brandName: string): string {
    const descriptions = [
      `Discover the latest collection from ${brandName}, featuring premium quality fabrics and contemporary designs.`,
      `Explore ${brandName}'s exclusive range of fashion apparel, crafted with attention to detail and style.`,
      `${brandName} brings you the perfect blend of tradition and modernity in every piece.`,
      `Shop the newest arrivals from ${brandName} and elevate your wardrobe with elegant designs.`
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  clearCache() {
    this.cachedBrands = null;
    this.lastFetch = 0;
  }
}

export const brandService = new BrandService();
