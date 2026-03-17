// services/brandService.ts
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
  private productsUrl = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/products';
  private cachedBrands: Brand[] | null = null;
  private cacheTime: number = 5 * 60 * 1000; // 5 minutes
  private lastFetch: number = 0;

  async getAllBrands(): Promise<Brand[]> {
    // Check cache first
    if (this.cachedBrands && Date.now() - this.lastFetch < this.cacheTime) {
      console.log('📦 Using cached brands');
      return this.cachedBrands;
    }

    try {
      console.log('🔄 Fetching products to extract brands...');
      const response = await fetch(this.productsUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      const products = data.items || [];
      
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
            description: `Discover the latest collection from ${brandName}`,
            logo: `https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brands/${brandId}.jpg`,
            coverImage: `https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/brands/${brandId}-cover.jpg`,
            productCount: 1,
            isFeatured: product.isFeatured || false,
            products: [{
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image
            }]
          });
        } else {
          const existing = brandMap.get(brandId)!;
          existing.productCount++;
          if (product.isFeatured) existing.isFeatured = true;
          
          // Add product preview (keep last 5)
          if (!existing.products) existing.products = [];
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
      
      this.cachedBrands = Array.from(brandMap.values())
        .sort((a, b) => b.productCount - a.productCount);
      
      this.lastFetch = Date.now();
      
      console.log(`📊 Extracted ${this.cachedBrands.length} brands from ${products.length} products`);
      
      return this.cachedBrands;
    } catch (error) {
      console.error('❌ Error fetching brands:', error);
      return [];
    }
  }

  async getFeaturedBrands(limit: number = 10): Promise<Brand[]> {
    const brands = await this.getAllBrands();
    return brands.filter(b => b.isFeatured).slice(0, limit);
  }

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    const brands = await this.getAllBrands();
    return brands.find(b => b.slug === slug) || null;
  }

  async getBrandProducts(brandName: string, limit: number = 20) {
    try {
      const url = `${this.productsUrl}?brand=${encodeURIComponent(brandName)}&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching brand products:', error);
      return [];
    }
  }

  clearCache() {
    this.cachedBrands = null;
    this.lastFetch = 0;
  }
}

export const brandService = new BrandService();
