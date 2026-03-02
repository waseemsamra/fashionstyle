import { useEffect, useRef, useState } from 'react';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { testimonials } from '@/data/products';

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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

  // Auto-advance testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section ref={sectionRef} className="section-padding bg-beige-100 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-10 text-gold/5">
        <Quote className="w-48 h-48" />
      </div>
      <div className="absolute bottom-20 right-10 text-gold/5 rotate-180">
        <Quote className="w-48 h-48" />
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-gold text-sm font-medium tracking-wider uppercase mb-2 block">
            Testimonials
          </span>
          <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold text-black">
            What Our Customers Say
          </h2>
        </div>

        {/* Testimonials Carousel */}
        <div className={`max-w-4xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="relative">
            {/* Main Testimonial */}
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-card">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`transition-all duration-500 ${
                    index === activeIndex
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 absolute inset-0 translate-x-8'
                  }`}
                >
                  {index === activeIndex && (
                    <>
                      {/* Rating */}
                      <div className="flex items-center justify-center gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < testimonial.rating
                                ? 'text-gold fill-gold'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Quote */}
                      <blockquote className="text-center mb-8">
                        <p className="font-playfair text-xl md:text-2xl text-black leading-relaxed italic">
                          "{testimonial.content}"
                        </p>
                      </blockquote>

                      {/* Author */}
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/20">
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-black">{testimonial.name}</p>
                          <p className="text-gray-500 text-sm">{testimonial.role}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={goToPrev}
                className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-black hover:bg-gold hover:text-white transition-colors duration-300"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`transition-all duration-300 ${
                      index === activeIndex
                        ? 'w-8 h-2 bg-gold rounded-full'
                        : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-gold/50'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={goToNext}
                className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-black hover:bg-gold hover:text-white transition-colors duration-300"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
