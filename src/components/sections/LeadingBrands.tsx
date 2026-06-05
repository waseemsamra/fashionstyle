import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

const API_URL = import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws';

export default function LeadingBrands() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, setIsCartOpen } = useCart();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products?limit=2000`);
        const data = await response.json();
        const allProducts = (data.items || []).filter((p: any) => p && p.id && p.name && p.name !== 'undefined' && p.price != null);

        let leading = allProducts.filter((p: any) => p.isLeadingBrand && p.name && p.name !== 'undefined');
        if (leading.length === 0) {
          leading = allProducts.filter((p: any) => p && p.isNew).slice(0, 20);
        }

        if (leading.length === 0) {
          setProducts([]);
          setSelectedBrand('');
          return;
        }

        setProducts(leading);
        const brandList = (Array.from(new Set(leading.map((p: any) => p.brand).filter(Boolean))) as string[]).filter((b: string) => b.length > 0);
        if (brandList.length > 0 && !selectedBrand) setSelectedBrand(brandList[0]);
      } catch (error) {
        console.error('Error loading leading brands:', error);
        setProducts([]);
        setSelectedBrand('');
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const brandProducts = products.filter((p: any) => p.brand === selectedBrand);
  const cardsPerView = 3;
  const maxSlide = Math.max(0, brandProducts.length - cardsPerView);

  useEffect(() => {
    if (!isAutoPlaying || brandProducts.length <= cardsPerView) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, brandProducts.length, selectedBrand, maxSlide]);

  const scrollLeft = useCallback(() => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlide : prev - 1));
    setIsAutoPlaying(false);
  }, [maxSlide]);

  const scrollRight = useCallback(() => {
    setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
    setIsAutoPlaying(false);
  }, [maxSlide]);

  const handleAddToCart = (product: any) => {
    addToCart(product);
    setIsCartOpen(true);
    toast.success(`${product.name && product.name !== 'undefined' ? product.name : 'Product'} added!`);
  };

  return (
    <section id="leading-brands" ref={sectionRef} className="section-padding bg-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Brand Name + Tagline + CTA */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="lg:sticky lg:top-32">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold mx-auto mb-3" />
                </div>
              ) : (
                <>
                  <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold text-black mb-4 leading-tight">
                    {selectedBrand || 'Leading Brands'}
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-8">
                    Where grace meets modernity.
                  </p>
                  <button
                    onClick={() => navigate('/leading-brands')}
                    className="group inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gold transition-colors duration-300"
                  >
                    Explore All
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: 3-card Carousel for Selected Brand */}
          <div className="lg:col-span-7">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4" />
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : brandProducts.length === 0 ? (
              <div className="text-center py-12 bg-beige-50 rounded-2xl">
                <p className="text-gray-600">No products found for {selectedBrand}</p>
              </div>
            ) : (
              <div className="relative">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-500"
                    style={{ transform: `translateX(-${currentSlide * (100 / cardsPerView)}%)` }}
                  >
                    {brandProducts.map((product) => (
                      <div key={product.id} className={`flex-shrink-0 ${cardsPerView === 3 ? 'w-1/3' : 'w-1/2'} px-2`}>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2 mx-1">
                          <div className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer" onClick={() => navigate(getProductUrl(product))}>
                            <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e) => handleImageError(e, product.name)} />
                            {product.isSale && <span className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs rounded-full">Sale</span>}
                            <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                              <button onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }} className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors duration-300">
                                Add to Cart
                              </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{product.brand}</p>
                            <h3 onClick={() => navigate(getProductUrl(product))} className="text-xs sm:text-sm font-semibold text-black mb-2 group-hover:text-gold transition-colors duration-300 cursor-pointer line-clamp-2">{product.name || 'Unnamed Product'}</h3>
                            <p className="font-semibold text-lg">${product.price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {brandProducts.length > cardsPerView && (
                  <>
                    <button onClick={scrollLeft} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -ml-4">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={scrollRight} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -mr-4">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
