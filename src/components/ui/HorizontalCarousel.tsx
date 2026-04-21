import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Heart, ShoppingBag, Star } from 'lucide-react';

interface HorizontalCarouselProps {
  children: ReactNode[];
  itemsPerView: number;
  className?: string;
  showArrows?: boolean;
  showIndicators?: boolean;
  onSlideChange?: (slideIndex: number) => void;
  // Card properties for consistency
  cardClassName?: string;
  showWishlist?: boolean;
  showAddToCart?: boolean;
  onWishlist?: (product: any, e: React.MouseEvent) => void;
  onAddToCart?: (product: any, e: React.MouseEvent) => void;
  onNavigate?: (product: any) => void;
}

export default function HorizontalCarousel({
  children,
  itemsPerView,
  className = '',
  showArrows = true,
  showIndicators = true,
  onSlideChange,
  cardClassName = '',
  showWishlist = true,
  showAddToCart = true,
  onWishlist,
  onAddToCart,
  onNavigate
}: HorizontalCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const totalSlides = Math.ceil(children.length / itemsPerView);

  // Ensure current slide is valid
  useEffect(() => {
    if (currentSlide >= totalSlides && totalSlides > 0) {
      setCurrentSlide(totalSlides - 1);
    }
  }, [currentSlide, totalSlides]);

  const scrollLeft = () => {
    setCurrentSlide((currentSlide) => (currentSlide - 1 + totalSlides) % totalSlides);
    onSlideChange?.((currentSlide - 1 + totalSlides) % totalSlides);
  };

  const scrollRight = () => {
    setCurrentSlide((currentSlide) => (currentSlide + 1) % totalSlides);
    onSlideChange?.((currentSlide + 1) % totalSlides);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchX = e.touches[0].clientX;
    const diff = touchStart - touchX;
    
    if (Math.abs(diff) > 30) {
      if (Math.abs(diff) > 100) return;
      
      if (diff > 0) {
        scrollLeft();
      } else {
        scrollRight();
      }
      setTouchStart(0);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(0);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Navigation Arrows */}
      {showArrows && totalSlides > 1 && (
        <>
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 lg:w-12 lg:h-12"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 lg:w-12 lg:h-12"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        </>
      )}

      {/* Carousel Track */}
      <div className="overflow-hidden px-8 lg:px-12">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {Array.from({ length: totalSlides }).map((_, slideIndex) => {
            const slideChildren = children.slice(slideIndex * itemsPerView, (slideIndex + 1) * itemsPerView);
            
            // Only render slide if it has actual content
            if (slideChildren.length === 0) return null;
            
            return (
              <div key={slideIndex} className="w-full flex-shrink-0">
                {/* Responsive Grid */}
                <div 
                  className={`
                    grid gap-4 lg:gap-6
                    ${itemsPerView === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : ''}
                    ${itemsPerView === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''}
                    ${itemsPerView === 2 ? 'grid-cols-1 sm:grid-cols-2' : ''}
                    ${itemsPerView === 1 ? 'grid-cols-1' : ''}
                  `}
                  style={{
                    gridTemplateColumns: slideChildren.length < itemsPerView 
                      ? `repeat(${slideChildren.length}, minmax(0, 1fr))`
                      : undefined
                  }}
                >
                  {slideChildren
                    .map((child, index) => {
                      const product = (child as any)?.props?.product || child;
                      return (
                        <div key={index} className={cardClassName}>
                          <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                            <div
                              className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer"
                              onClick={() => onNavigate?.(product)}
                            >
                              <img
                                src={product.image || product.imageUrl || ''}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.jpg';
                                }}
                              />

                              {/* Badge */}
                              {product.discountPercentage && product.discountPercentage > 0 && (
                                <div className="absolute top-3 left-3">
                                  <span className="px-2 py-1 md:px-3 md:py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                                    {Math.round(product.discountPercentage)}% OFF
                                  </span>
                                </div>
                              )}

                              {/* Quick Actions */}
                              {showWishlist && (
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                  <button
                                    onClick={(e) => onWishlist?.(product, e)}
                                    className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-all"
                                  >
                                    <Heart className="w-4 h-4" />
                                  </button>
                                </div>
                              )}

                              {/* Add to Cart Button - Shows on Hover */}
                              {showAddToCart && (
                                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                  <button
                                    onClick={(e) => onAddToCart?.(product, e)}
                                    className="w-full py-2 md:py-3 bg-black text-white text-xs md:text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors"
                                  >
                                    <ShoppingBag className="w-3 h-3 md:w-4 md:h-4" />
                                    Add to Cart
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="p-3 md:p-4">
                              <p className="text-gray-500 text-xs uppercase mb-1">
                                {product.category || 'Product'}
                              </p>

                              <h3
                                onClick={() => onNavigate?.(product)}
                                className="font-semibold text-xs md:text-sm mb-2 cursor-pointer hover:text-gold transition line-clamp-2"
                              >
                                {product.name}
                              </h3>

                              {/* Rating Stars */}
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-2.5 h-2.5 md:w-3 md:h-3 ${
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
                                <span className="font-semibold text-sm md:text-lg">
                                  Rs. {product.price?.toLocaleString()}
                                </span>
                                {product.originalPrice && (
                                  <span className="text-gray-400 line-through text-xs md:text-sm">
                                    Rs. {product.originalPrice?.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide Indicators */}
      {showIndicators && totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-6 lg:mt-8">
          {Array.from({ length: totalSlides }).map((_, index) => {
            const slideChildren = children.slice(index * itemsPerView, (index + 1) * itemsPerView);
            
            // Only show indicator if slide has actual content
            if (slideChildren.length === 0) return null;
            
            return (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlide(index);
                  onSlideChange?.(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-6 lg:w-8 bg-gold' 
                    : 'w-2 bg-gold/30 hover:bg-gold/50'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
