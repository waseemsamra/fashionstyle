import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, Star } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

export default function BrandDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const [products, setProducts] = useState<any[]>([]);

  const normalize = (value: unknown) =>
    String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const brandName = decodeURIComponent(name || '');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [name]);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        const data = await api.listProducts();
        if (isMounted) {
          setProducts(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (error) {
        console.error('Failed to load brand products:', error);
        if (isMounted) {
          setProducts([]);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const brandProducts = useMemo(
    () => products.filter((product) => normalize(product?.brand) === normalize(brandName)),
    [products, brandName]
  );

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`, {
      action: {
        label: 'View Cart',
        onClick: () => setIsCartOpen(true),
      },
    });
  };

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-r from-black to-gray-800">
        <div className="absolute inset-0 opacity-20">
          <img
            src="/hero-image.jpg"
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/brands')} 
            className="mb-6 text-white hover:text-gold w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Brands
          </Button>
          <h1 className="text-5xl font-bold text-white mb-4">{brandName}</h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Discover the latest collection from {brandName}. Premium quality and timeless designs.
          </p>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Products</h2>
          <p className="text-gray-600">
            Showing {brandProducts.length} products
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {brandProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
            >
              <div
                className="relative aspect-[3/4] overflow-hidden cursor-pointer"
                  onClick={() => navigate(getProductUrl(product))}
              >
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => handleImageError(e, product.name)}
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
                      New
                    </span>
                  )}
                  {product.isSale && (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                      Sale
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-500 text-xs uppercase mb-1">{product.category}</p>
                <h3
                  onClick={() => navigate(getProductUrl(product))}
                  className="font-semibold text-lg mb-2 cursor-pointer hover:text-gold transition"
                >
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(Number(product.rating || 0))
                          ? 'text-gold fill-gold'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-gray-400 line-through text-sm">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {brandProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found for this brand.</p>
            <Button onClick={() => navigate('/shop')} className="mt-4">
              Browse All Products
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
