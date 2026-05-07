import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Heart, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useCollection } from '@/hooks/useCollection';
import { useToggleWishlist } from '@/hooks/useWishlist';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';
import { currencyService } from '@/services/currencyService';

export default function SummerSaleDetail() 
{
  const navigate = useNavigate();
  const { toggleWishlist } = useToggleWishlist();
  const { products, loading } = useCollection('summerSale');

  const handleWishlist = (product: any) => {
    if (!localStorage.getItem('jwt_token')) {
      toast.error('Please login', { action: { label: 'Login', onClick: () => navigate('/login') } });
      return;
    }
    toggleWishlist({ productId: product.id, product });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info('Add to cart coming soon');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading summer sale...</p>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-600">No summer sale items available at the moment.</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-gold text-white rounded-full hover:bg-gold/90 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gold transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back to Home</span>
          </button>
          
          <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900">
            Summer Sale
          </h1>
          
          <div className="w-24"></div> {/* Spacer */}
        </div>

        {/* Description */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <p className="text-gray-600 text-lg">
            Hot summer deals - Up to 50% off on selected items
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2">
              <div 
                className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer" 
                onClick={() => navigate(getProductUrl(product))}
              >
                <img 
                  src={getProductImage(product)} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  onError={(e) => handleImageError(e, product.name)} 
                />
                
                {/* Sale Badge */}
                {product.isSale && (
                  <span className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs rounded-full">
                    Sale
                  </span>
                )}

                {/* Quick Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlist(product);
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-white hover:bg-gold hover:text-white transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart Button - Shows on Hover */}
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(e);
                    }}
                    className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <p className="text-gray-500 text-xs uppercase mb-1">
                  {product.category || 'Summer Sale'}
                </p>
                
                <h3
                  onClick={() => navigate(getProductUrl(product))}
                  className="font-playfair font-semibold text-lg mb-2 cursor-pointer hover:text-gold transition line-clamp-2"
                >
                  {product.name}
                </h3>
                
                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 0)
                          ? 'text-gold fill-gold'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">
                    ({product.rating || 0})
                  </span>
                </div>
                
                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg md:text-xl">
                    {currencyService.formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-gray-400 line-through text-sm md:text-base">
                      {currencyService.formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
