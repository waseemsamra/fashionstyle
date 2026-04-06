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

export default function BrandDetailPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(true);

  // Convert slug back to brand name
  const slugToName = (s: string) => 
    s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Extract brand name from slug
        const name = slugToName(slug || '');
        setBrandName(name);
        console.log('🔍 Looking for brand:', name, 'from slug:', slug);

        // Fetch products filtered by brand on server-side
        console.log('🔍 Fetching products for brand:', name);
        const productsRes = await fetch(`${API_URL}/products?limit=500&brand=${encodeURIComponent(name)}`);
        const productsData = await productsRes.json();
        console.log('📦 Products response:', productsData);
        const allProducts = productsData.products || productsData.items || [];
        console.log(`📦 Products from API: ${allProducts.length}`);

        // Additional client-side filter in case API doesn't support brand filter
        const brandProducts = allProducts.filter((p: Product) => {
          if (!p.brand) return false;
          const pBrand = p.brand.toLowerCase().trim();
          const targetBrand = name.toLowerCase().trim();
          return pBrand === targetBrand || pBrand.includes(targetBrand) || targetBrand.includes(pBrand);
        });

        console.log(`✅ Found ${brandProducts.length} products for "${name}"`);
        setProducts(brandProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!brandName) {
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
          <h1 className="text-4xl font-bold mb-2">{brandName}</h1>
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
