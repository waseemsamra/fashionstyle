import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { getProductImage, handleImageError } from '@/utils/productImage';

const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

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

interface Brand {
  id: string;
  name: string;
  description?: string;
}

export default function BrandDetailPage() {
  const { slug } = useParams();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch brands to find current brand
        console.log('🔍 Fetching brands for slug:', slug);
        const brandsRes = await fetch(`${API_URL}/admin/brands`);
        const brandsData = await brandsRes.json();
        console.log('📦 Brands data:', brandsData);
        const allBrands = brandsData.brands || brandsData.items || [];

        const foundBrand = allBrands.find((b: Brand) => {
          const brandSlug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          console.log(`  Checking brand: "${b.name}" -> slug: "${brandSlug}" vs "${slug}"`);
          return brandSlug === slug;
        });
        console.log('✅ Found brand:', foundBrand);
        setBrand(foundBrand || null);

        // Fetch products and filter by brand
        console.log('🔍 Fetching products...');
        const productsRes = await fetch(`${API_URL}/products?limit=500`);
        const productsData = await productsRes.json();
        console.log('📦 Products data:', productsData);
        const allProducts = productsData.products || productsData.items || [];

        if (foundBrand) {
          const brandProducts = allProducts.filter((p: Product) => {
            const match = p.brand && p.brand.toLowerCase() === foundBrand.name.toLowerCase();
            if (match) console.log(`  ✅ Product match: ${p.name} (brand: ${p.brand})`);
            return match;
          });
          console.log(`✅ Found ${brandProducts.length} products for brand:`, foundBrand.name);
          setProducts(brandProducts);
        }
      } catch (error) {
        console.error('Failed to fetch brand data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-500">Brand not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <Link to="/brands" className="inline-flex items-center gap-2 text-gray-600 hover:text-gold mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Brands
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">{brand.name}</h1>
          {brand.description && (
            <p className="text-gray-600 max-w-2xl mx-auto">{brand.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">{products.length} Products</p>
        </div>

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
