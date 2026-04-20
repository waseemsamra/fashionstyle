import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage } from '@/utils/productImage';
import LazyImage from '@/components/ui/LazyImage';
import { useCollection } from '@/hooks/useCollection';

export default function DesignersDiscount() {
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
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gold transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back</span>
            </button>
            
            <h1 className="text-xl font-bold text-gray-900">Designers On Discount</h1>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Showing {products.length} products
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Check back later for new arrivals</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="relative">
                  <LazyImage
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-t-lg"
                  />
                  
                  {/* Discount Badge */}
                  {product.discountPercentage && product.discountPercentage > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      {Math.round(product.discountPercentage)}% OFF
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-1">{product.brand}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {product.discountPercentage && product.discountPercentage > 0 ? (
                        <>
                          <span className="text-lg font-bold text-gray-400 line-through">
                            Rs. {product.originalPrice?.toLocaleString()}
                          </span>
                          <span className="text-lg font-bold text-gold">
                            Rs. {product.price?.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gold">
                          Rs. {product.price?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => navigate(getProductUrl(product))}
                      className="p-2 text-gold hover:bg-gold/50 rounded-lg transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
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
