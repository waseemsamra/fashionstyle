import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Star } from 'lucide-react';
import { toast } from 'sonner';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';
import { useCollection } from '@/hooks/useCollection';

export default function DesignersDiscount() {
  // Updated grid layout for larger card sizes - matches Shop page
  const navigate = useNavigate();
  
  // Use the same collection hook as the home page component
  const { products, loading } = useCollection('designersDiscount');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-gold/10 to-gold/20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <div className="relative z-20 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">Designers On Discount</h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
            Exclusive deals from top designers - Up to 70% off on selected items
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gold transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back</span>
            </button>
            
            <div className="flex-1 text-center">
              <span className="text-sm text-gray-500">
                Showing {products.length} products
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 pb-12">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Check back later for new arrivals</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2"
              >
                <div
                  className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-beige-50 cursor-pointer"
                  onClick={() => navigate(getProductUrl(product))}
                >
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => handleImageError(e, product.name)}
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.discountPercentage && product.discountPercentage > 0 && (
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                        {Math.round(product.discountPercentage)}% OFF
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info('Add to cart coming soon');
                      }}
                      className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <p className="text-gray-500 text-xs uppercase mb-1">{product.category || 'Designer Discount'}</p>
                  <h3
                    onClick={() => navigate(getProductUrl(product))}
                    className="font-playfair text-xs font-semibold mb-1 sm:mb-2 cursor-pointer hover:text-gold transition line-clamp-1"
                  >
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(product.rating || 0)
                            ? 'text-gold fill-gold'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">({product.rating || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">Rs. {product.price?.toLocaleString()}</span>
                    {product.originalPrice && (
                      <span className="text-gray-400 line-through text-sm">Rs. {product.originalPrice?.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
