import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useCollection } from '@/hooks/useCollection';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

export default function DesignersDiscount() 
{
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4); // Default to 4 cards for desktop
  
  const { products, loading } = useCollection('designersDiscount');

  // Calculate items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(4); // Desktop: 4 cards
      } else {
        setItemsPerView(1); // Mobile: 1 card (carousel shows 1.25 cards visually but we calculate with 1)
      }
    };
    
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Calculate total slides needed
  const totalSlides = Math.ceil(products.length / itemsPerView);
  
  // Ensure current slide is within bounds
  useEffect(() => {
    if (currentSlide >= totalSlides && totalSlides > 0) {
      setCurrentSlide(totalSlides - 1);
    }
  }, [currentSlide, totalSlides]);

  const scrollLeft = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const scrollRight = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchX = e.touches[0].clientX;
    const diff = touchStart - touchX;
    if (Math.abs(diff) > 20) {
      if (Math.abs(diff) > 60) return;
      if (diff > 0) {
        scrollRight();
      } else {
        scrollLeft();
      }
      setTouchStart(0);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(0);
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

      {/* Products Section */}
      <div className="container mx-auto px-4 pb-12">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Check back later for new arrivals</p>
          </div>
        ) : (
          <div>
            {/* Mobile Carousel - 1.25 cards visible */}
            <div className="lg:hidden">
              <div className="relative carousel-container">
                {/* Navigation Arrows */}
                <button 
                  onClick={scrollLeft} 
                  className="carousel-arrow carousel-arrow-left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={scrollRight} 
                  className="carousel-arrow carousel-arrow-right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Carousel Container */}
                <div className="overflow-hidden">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 80}%)` }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {products.map((product) => (
                      <div key={product.id} className="w-[80%] flex-shrink-0 px-2">
                        <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                          <div className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer" onClick={() => navigate(getProductUrl(product))}>
                            <img 
                              src={getProductImage(product)} 
                              alt={product.name} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                              onError={(e) => handleImageError(e, product.name)} 
                            />
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                              {product.discountPercentage && product.discountPercentage > 0 && (
                                <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                                  {product.discountPercentage}% OFF
                                </span>
                              )}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                              <button onClick={handleAddToCart} className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors">
                                <ShoppingBag className="w-4 h-4" />
                                Add to Cart
                              </button>
                            </div>
                          </div>
                          <div className="p-3 sm:p-4">
                            <p className="text-gray-500 text-xs uppercase mb-1">{product.category || 'Designer Discount'}</p>
                            <h3 className="font-playfair text-xs font-semibold mb-1 sm:mb-2 cursor-pointer hover:text-gold transition line-clamp-2">{product.name}</h3>
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-gold fill-gold' : 'text-gray-300'}`} />
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
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slide Indicators */}
                <div className="flex justify-center gap-2 mt-4">
                  {Array.from({ length: totalSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-opacity duration-300 ${
                        index === currentSlide ? 'bg-gold opacity-100' : 'bg-gold opacity-30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Carousel - 4 cards visible */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Left Arrow */}
                {totalSlides > 1 && (
                  <button 
                    onClick={scrollLeft} 
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                <div className="overflow-hidden px-8">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                      <div key={slideIndex} className="w-full flex-shrink-0">
                        <div className="grid grid-cols-4 gap-4">
                          {products.slice(slideIndex * 4, (slideIndex + 1) * 4).map((product) => (
                            <div key={product.id} className="px-2">
                              <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
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
                                    className="font-playfair text-sm font-semibold mb-1 sm:mb-2 cursor-pointer hover:text-gold transition line-clamp-2"
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
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Arrow */}
                {totalSlides > 1 && (
                  <button 
                    onClick={scrollRight} 
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Slide Indicators */}
              {totalSlides > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: totalSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide ? 'bg-gold w-4 opacity-100' : 'bg-gold opacity-30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}