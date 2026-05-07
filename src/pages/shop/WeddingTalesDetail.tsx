import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';
import { useCollection } from '@/hooks/useCollection';
import { useToggleWishlist } from '@/hooks/useWishlist';
import { currencyService } from '@/services/currencyService';

export default function WeddingTalesDetail() {
  const navigate = useNavigate();
  const { toggleWishlist } = useToggleWishlist();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  // Handle carousel navigation
  const scrollLeft = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const scrollRight = () => {
    const maxSlide = Math.max(0, collectionProducts.length - Math.min(1.25, collectionProducts.length));
    setCurrentSlide(prev => Math.min(maxSlide, prev + 1));
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchX = e.touches[0].clientX;
    const diff = touchStart - touchX;
    
    // Lower threshold for better responsiveness
    if (Math.abs(diff) > 15) {
      // Prevent multiple triggers during same gesture
      if (Math.abs(diff) > 60) {
        return;
      }
      
      if (diff > 0) {
        scrollRight();
      } else {
        scrollLeft();
      }
      
      // Reset touch start to prevent multiple triggers
      setTouchStart(0);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(0);
  };
  
  // Handle wishlist toggle
  const handleWishlist = (product: any) => {
    if (!localStorage.getItem('jwt_token')) {
      toast.error('Please login', { action: { label: 'Login', onClick: () => navigate('/login') } });
      return;
    }
    toggleWishlist({ productId: product.id, product });
  };
  
  // Fetch wedding tales products
  const { products: collectionProducts, loading, error } = useCollection('weddingTales');
  
  // Handle loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading wedding tales...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-600">Error loading wedding tales. Please try again.</p>
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

  if (collectionProducts.length === 0) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-600">No wedding tales available at the moment.</p>
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
            className="flex items-center gap-2 text-gray-600 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
          
          <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900">
            Wedding Tales
          </h1>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Description */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <p className="text-gray-600 text-lg">
            Discover our curated collection of wedding essentials, from elegant bridal wear to sophisticated accessories. 
            Each piece is carefully selected to make your special day unforgettable.
          </p>
        </div>

        {/* Products Grid */}
        <div className="relative">
          {/* Mobile Carousel */}
          <div className="md:hidden">
            <div 
              className="overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {collectionProducts.map((product) => (
                  <div key={product.id} className="w-full flex-shrink-0 px-4">
                    <ProductCard 
                      product={product} 
                      onWishlist={() => handleWishlist(product)}
                      onNavigate={() => navigate(getProductUrl(product))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Navigation */}
            {collectionProducts.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={scrollLeft}
                  disabled={currentSlide === 0}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gold hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="text-sm text-gray-600">
                  {currentSlide + 1} / {collectionProducts.length}
                </span>
                
                <button
                  onClick={scrollRight}
                  disabled={currentSlide === collectionProducts.length - 1}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gold hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collectionProducts.map((product) => (
              <ProductCard 
                key={product.id}
                product={product} 
                onWishlist={() => handleWishlist(product)}
                onNavigate={() => navigate(getProductUrl(product))}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onWishlist, onNavigate }: any) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2">
      <div 
        className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer"
        onClick={onNavigate}
      >
        <img
          src={getProductImage(product)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => handleImageError(e, product.name)}
        />

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWishlist();
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
              toast.info('Add to cart coming soon');
            }}
            className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="text-gray-500 text-xs uppercase mb-1">
          {product.category || 'Wedding Wear'}
        </p>
        
        <h3
          onClick={onNavigate}
          className="font-playfair font-semibold text-sm mb-2 cursor-pointer hover:text-gold transition line-clamp-2"
        >
          {product.name}
        </h3>
        
        {/* Rating Stars */}
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
          <span className="text-xs text-gray-500 ml-1">
            ({product.rating || 0})
          </span>
        </div>
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">
            {currencyService.formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-gray-400 line-through text-sm">
              {currencyService.formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
