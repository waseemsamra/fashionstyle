import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useCollection } from '@/hooks/useCollection';
import { getProductUrl } from '@/utils/productUrl';
import ProductCard from '@/components/products/ProductCard';

export default function WeddingTales() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // THE FORMULA: Fetch ONLY collection products - NO scanning!
  const { products, loading } = useCollection('weddingTales');

  useEffect(() => {
    if (!isAutoPlaying || products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length]);

  const scrollLeft = () => {
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
  };

  const scrollRight = () => {
    setCurrentSlide((prev) => (prev + 1) % products.length);
  };

  if (loading) {
    return (
      <section className="section-padding bg-beige-100">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="text-gold text-sm font-medium tracking-wider uppercase mb-2 block">Bridal Collection</span>
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold text-black mb-4">Wedding Tales</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Loading...</p>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="section-padding bg-beige-100">
      <div className="container-custom">
        <div className="text-center mb-12">
          <span className="text-gold text-sm font-medium tracking-wider uppercase mb-2 block">Bridal Collection</span>
          <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold text-black mb-4">Wedding Tales</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Exquisite bridal wear for your special day</p>
        </div>

        <div className="relative lg:hidden">
          {/* Left Arrow - Middle Left */}
          <button 
            onClick={scrollLeft} 
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -ml-6 lg:-ml-8"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="overflow-hidden">
            <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * 80}%)` }}>
              {products.map((product) => (
                <div key={product.id} className="min-w-[80%] px-2">
                  <ProductCard product={product} variant="compact" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Arrow - Middle Right */}
          <button 
            onClick={scrollRight} 
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -mr-6 lg:-mr-8"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="relative hidden lg:block">
          {/* Desktop Grid */}
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} variant="compact" />
            ))}
          </div>
        </div>

          {/* Slide Indicators */}
          <div className="flex justify-center mt-6 space-x-2 lg:hidden">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentSlide ? 'bg-gold' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

      <div className="text-center mt-12">
        <a href="#categories" className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-black rounded-full hover:bg-black hover:text-white">View All Products</a>
      </div>
    </section>
  );
}
