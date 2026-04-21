import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalCarouselProps {
  children: ReactNode[];
  itemsPerView: number;
  className?: string;
  showArrows?: boolean;
  showIndicators?: boolean;
  onSlideChange?: (slideIndex: number) => void;
}

export default function HorizontalCarousel({
  children,
  itemsPerView,
  className = '',
  showArrows = true,
  showIndicators = true,
  onSlideChange
}: HorizontalCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const totalSlides = Math.ceil(children.length / itemsPerView);

  // Create infinite carousel by duplicating slides
  const infiniteChildren = [...children, ...children.slice(0, itemsPerView)];
  const infiniteTotalSlides = Math.ceil(infiniteChildren.length / itemsPerView);

  // Ensure current slide is valid
  useEffect(() => {
    if (currentSlide >= totalSlides && totalSlides > 0) {
      setCurrentSlide(totalSlides - 1);
    }
  }, [currentSlide, totalSlides]);

  const scrollLeft = () => {
    console.log('scrollLeft clicked, currentSlide:', currentSlide, 'totalSlides:', totalSlides);
    setCurrentSlide((currentSlide) => {
      const newSlide = (currentSlide - 1 + totalSlides) % totalSlides;
      console.log('scrollLeft newSlide:', newSlide);
      onSlideChange?.(newSlide);
      return newSlide;
    });
  };

  const scrollRight = () => {
    console.log('scrollRight clicked, currentSlide:', currentSlide, 'totalSlides:', totalSlides);
    setCurrentSlide((currentSlide) => {
      const newSlide = (currentSlide + 1) % totalSlides;
      console.log('scrollRight newSlide:', newSlide);
      onSlideChange?.(newSlide);
      return newSlide;
    });
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
            onClick={(e) => {
              console.log('Left button clicked');
              e.preventDefault();
              scrollLeft();
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 lg:w-12 lg:h-12"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
          <button
            onClick={(e) => {
              console.log('Right button clicked');
              e.preventDefault();
              scrollRight();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 lg:w-12 lg:h-12"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        </>
      )}

      {/* Carousel Track */}
      <div className="overflow-hidden px-8 lg:px-12">
        <div
          className={`flex transition-transform duration-500 ease-in-out carousel-track carousel-slide-${currentSlide}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {Array.from({ length: infiniteTotalSlides }).map((_, slideIndex) => {
            const slideChildren = infiniteChildren.slice(slideIndex * itemsPerView, (slideIndex + 1) * itemsPerView);
            
            // Only render slide if it has actual content
            if (slideChildren.length === 0) return null;
            
            return (
              <div key={slideIndex} className="w-full flex-shrink-0">
                {/* Responsive Grid */}
                <div 
                  className={`
                    grid gap-4 lg:gap-6
                    ${slideChildren.length === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : ''}
                    ${slideChildren.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''}
                    ${slideChildren.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : ''}
                    ${slideChildren.length === 1 ? 'grid-cols-1' : ''}
                  `}
                >
                  {children
                    .slice(slideIndex * itemsPerView, (slideIndex + 1) * itemsPerView)
                    .map((child, index) => (
                      <div key={index}>
                        {child}
                      </div>
                    ))}
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
                  index === (currentSlide % totalSlides) 
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
