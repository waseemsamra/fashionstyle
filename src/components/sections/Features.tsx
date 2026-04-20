import { useEffect, useRef, useState } from 'react';
import { Truck, RotateCcw, Shield, Headphones } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'Complimentary delivery on orders over $100',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day hassle-free return policy',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% secure checkout experience',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Dedicated customer service team',
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scrollLeft = () => {
    setCurrentSlide(prev => prev <= 0 ? Math.max(0, features.length - 1.25) : prev - 1);
  };

  const scrollRight = () => {
    setCurrentSlide(prev => prev >= features.length - 1.25 ? 0 : prev + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchX = e.touches[0].clientX;
    const diff = touchStart - touchX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        scrollRight();
      } else {
        scrollLeft();
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(0);
  };

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-beige-100">
      <div className="container-custom">
        {/* Section Title */}
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-black mb-3">
            Why Choose Us
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            We are committed to providing you with the best shopping experience
          </p>
        </div>

        {/* Features Grid - Desktop */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative bg-white rounded-2xl p-6 md:p-8 shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{
                transitionDelay: isVisible ? `${index * 100 + 200}ms` : '0ms',
              }}
            >
              {/* Icon */}
              <div className="w-14 h-14 bg-beige-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-gold/10 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-gold group-hover:scale-110 transition-transform duration-300" />
              </div>

              {/* Content */}
              <h3 className="font-playfair text-xl font-semibold text-black mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Border Effect */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gold/20 transition-colors duration-300" />
            </div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden">
          <div className="relative">
            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500"
                style={{ transform: `translateX(-${currentSlide * 80}%)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {features.map((feature, index) => (
                  <div
                    key={feature.title}
                    className="min-w-[80%] px-3"
                  >
                    <div
                      className={`group relative bg-white rounded-2xl p-6 shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                      }`}
                      style={{
                        transitionDelay: isVisible ? `${index * 100 + 200}ms` : '0ms',
                      }}
                    >
                      {/* Icon */}
                      <div className="w-14 h-14 bg-beige-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-gold/10 transition-colors duration-300">
                        <feature.icon className="w-6 h-6 text-gold group-hover:scale-110 transition-transform duration-300" />
                      </div>

                      {/* Content */}
                      <h3 className="font-playfair text-xl font-semibold text-black mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {feature.description}
                      </p>

                      {/* Hover Border Effect */}
                      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gold/20 transition-colors duration-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-colors duration-300"
              aria-label="Previous feature"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-colors duration-300"
              aria-label="Next feature"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    Math.floor(currentSlide) === index ? 'bg-gold' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to feature ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
