import { useParams, Link as RouterLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { getProductImage, handleImageError } from '@/utils/productImage';
import type { Brand } from '@/services/brandsService';

import { API_CONFIG } from '../../config/api';
const API_URL = API_CONFIG.baseApiUrl;

interface Product {
  id: string;
  name: string;
  price: number;
  brand: string;
  image?: string;
  images?: string[];
  category?: string;
  description?: string;
}

export default function BrandDetailPage() {
  const { name: slug } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [brandData, setBrandData] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);

  // Convert slug back to brand name
  const slugToName = (s: string) =>
    s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Fetch brands data using same API as Brands page
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        console.log('🔍 Fetching brands for BrandDetail page...');
        const response = await fetch(`${API_CONFIG.brandsApi}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        console.log('📊 Brands API Response:', data);
        const brands = data.brands || data.items || [];
        console.log(`📦 Total brands fetched: ${brands.length}`);
        
        // Use brands API response directly - API returns array of strings (brand names)
        const brandsData = brands.map((brand: any, index: number) => {
          const brandName = typeof brand === 'string' ? brand : (brand.name || brand.brand || brand.title || 'Unknown Brand');
          const createSlug = (name: string) =>
            name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          return {
            id: `${brandName.toLowerCase().replace(/\s+/g, '-')}-${index}`,
            name: brandName,
            slug: createSlug(brandName),
            active: true,
            products: 0
          };
        });
        
        setAllBrands(brandsData);
      } catch (error) {
        console.warn('Failed to fetch brands:', error);
        setAllBrands([]);
      }
    };

    fetchBrands();
  }, []);

  // Find brand data from all brands
  useEffect(() => {
    if (allBrands && allBrands.length > 0 && slug) {
      const brandName = slugToName(slug);
      const found = allBrands.find(b => b.slug === slug || b.name.toLowerCase() === brandName.toLowerCase());
      if (found) {
        setBrandData(found);
      } else {
        // Fallback: create minimal brand data
        setBrandData({
          id: '',
          name: brandName,
          slug: slug,
          description: `Explore our collection of ${brandName} products`,
          logo: '',
          coverImage: '',
          productCount: 0,
          isFeatured: false,
        });
      }
    }
  }, [allBrands, slug]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Extract brand name from slug
        const name = slugToName(slug || '');
        if (!brandData) {
          setBrandData({
            id: '',
            name,
            slug: slug || '',
            description: `Explore our collection of ${name} products`,
            logo: '',
            coverImage: '',
            productCount: 0,
            isFeatured: false,
          });
        }

        console.log('🔍 Looking for brand:', name, 'from slug:', slug);

        // Fetch ALL products first to check what brands exist
        console.log('📡 Fetching all products to check brands...');
        const allRes = await fetch(`${API_URL}/products?limit=100`);
        const allData = await allRes.json();
        const allProds = allData.items || allData.products || [];
        
        // Log unique brands
        const uniqueBrands = [...new Set(allProds.map((p: any) => p.brand).filter(Boolean))];
        console.log('🏷️ Unique brands in database:', uniqueBrands.slice(0, 20));
        
        // Check if target brand exists
        const brandExists = uniqueBrands.some((b: unknown) =>
          typeof b === 'string' && b.toLowerCase().trim() === name.toLowerCase().trim()
        );
        console.log('🏷️ Target brand exists:', brandExists, '(looking for:', name, ')');

        // Fetch ALL products and filter client-side since server filtering doesn't work
        console.log('Fetching all products for client-side filtering...');
        const productsRes = await fetch(`${API_URL}/products?limit=1000`);
        const productsData = await productsRes.json();
        console.log('Products response:', productsData);
        const allProducts = productsData.products || productsData.items || [];
        console.log(`📦 Products from API: ${allProducts.length}`);
        
        // Log what brands the returned products have
        if (allProducts.length > 0) {
          console.log('📦 First 5 products from API response:');
          allProducts.slice(0, 5).forEach((p: any) => {
            console.log(`  - ${p.name} | Brand: "${p.brand}"`);
          });
        }

        // Enhanced client-side filtering since API doesn't filter properly
        const brandProducts = allProducts.filter((p: Product) => {
          if (!p.brand) return false;
          const pBrand = p.brand.toLowerCase().trim();
          const targetBrand = name.toLowerCase().trim();
          
          // Exact match first
          if (pBrand === targetBrand) return true;
          
          // Handle case variations and spacing
          const normalizedPBrand = pBrand.replace(/\s+/g, ' ').trim();
          const normalizedTarget = targetBrand.replace(/\s+/g, ' ').trim();
          
          return normalizedPBrand === normalizedTarget;
        });

        // Log filtered results for debugging
        console.log(`All products received: ${allProducts.length}`);
        console.log(`Filtered products for "${name}": ${brandProducts.length}`);
        
        if (brandProducts.length > 0) {
          console.log('First 3 filtered products:');
          brandProducts.slice(0, 3).forEach((p: any) => {
            console.log(`  - ${p.name} | Brand: "${p.brand}"`);
          });
        } else {
          console.log('No products found after filtering. Available brands in response:');
          const brandsInResponse = [...new Set(allProducts.map((p: any) => p.brand).filter(Boolean))];
          console.log(brandsInResponse.slice(0, 10));
        }

        setProducts(brandProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  if (loading || !brandData) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        {/* Background Image */}
        {brandData.coverImage ? (
          <img
            src={brandData.coverImage}
            alt={brandData.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
          {/* Logo */}
          {brandData.logo && (
            <img
              src={brandData.logo}
              alt={brandData.name}
              className="w-24 h-24 object-contain mb-6 rounded-full bg-white/10 p-4 backdrop-blur-sm"
            />
          )}

          {/* Brand Name */}
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-center">
            {brandData.name}
          </h1>

          {/* Description */}
          {brandData.description && (
            <p className="text-lg md:text-xl text-white/90 max-w-2xl text-center mb-6">
              {brandData.description}
            </p>
          )}

          {/* Product Count */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
            <ShoppingBag className="w-5 h-5" />
            <span className="font-medium">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-12">
        {/* Back button */}
        <RouterLink to="/brands" className="inline-flex items-center gap-2 text-gray-600 hover:text-gold mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Brands
        </RouterLink>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found for this brand</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="group bg-white rounded-lg border border-gray-100 hover:border-gold/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-[3/4] overflow-hidden bg-gray-50">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => handleImageError(e, product.name)}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm text-gray-800 line-clamp-2 mb-2 group-hover:text-gold transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-gold">${product.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
