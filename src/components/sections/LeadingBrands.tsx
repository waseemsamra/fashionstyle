import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

const API_URL = import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws';

export default function LeadingBrands() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products?limit=2000`);
        const data = await response.json();
        const allProducts = (data.items || []).filter((p: any) => p && p.id && p.name && p.name !== 'undefined' && p.price != null);
        const activeIds = getActiveProductIds(allProducts);
        let leading: any[] = [];

        if (activeIds.length > 0) {
          leading = allProducts.filter((p: any) => activeIds.includes(String(p.id)));
        }

        if (leading.length === 0) {
          leading = allProducts.filter((p: any) => p.isNew).slice(0, 20);
        }

        if (leading.length > 0) {
          setProducts(leading);
          const brandList = Array.from(new Set(leading.map((p: any) => p.brand).filter(Boolean)));
          setBrands(brandList);
          if (brandList.length > 0 && !selectedBrand) setSelectedBrand(brandList[0]);
        }
      } catch (error) {
        console.error('Error loading leading brands:', error);
        setProducts([]);
        setBrands([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [selectedBrand]);

  const brandProducts = products.filter((p: any) => p.brand === selectedBrand);
  const maxSlide = Math.max(0, brandProducts.length - 2);

  useEffect(() => {
    if (!isAutoPlaying || brandProducts.length <= 2) return;
    const maxSlide = Math.max(0, brandProducts.length - 2);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, brandProducts.length, selectedBrand]);

  const handleAddToCart = (product: any) => {
    addToCart(product);
    setIsCartOpen(true);
    toast.success(`${product.name && product.name !== 'undefined' ? product.name : 'Product'} added!`);
  };

  const scrollLeft = () => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlide : prev - 1));
    setIsAutoPlaying(false);
  };

  const scrollRight = () => {
    setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
    setIsAutoPlaying(false);
  };

  return (
    <section id="leading-brands" ref={sectionRef} className="section-padding bg-beige-100">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className={`lg:col-span-4 flex flex-col justify-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="lg:sticky lg:top-32">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-gold text-sm font-medium tracking-wide">Top Labels</span>
              </div>

              <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold text-black mb-4">Leading Brands</h2>

              <p className="text-gray-600 leading-relaxed mb-8">
                Discover products from our leading brand partners. Select a brand below to explore their featured collection.
              </p>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Loading brands...</p>
                </div>
              ) : brands.length === 0 ? (
                <p className="text-gray-500 text-sm mb-6">No brands available. Please add products in Admin → Leading Brands.</p>
              ) : (
                <div className="space-y-3 mb-8">
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => { setSelectedBrand(brand); setCurrentSlide(0); setIsAutoPlaying(true); }}
                      className={`w-full text-left px-5 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                        selectedBrand === brand ? 'bg-gold text-white shadow-lg' : 'bg-white text-black hover:bg-gold/10 hover:text-gold shadow-sm'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}

              <a href="/leading-brands" className="group inline-flex items-center gap-2 text-black font-medium hover:text-gold transition-colors duration-300">
                View All Brands
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
              </a>

              <div className="hidden lg:block mt-12">
                <div className="w-24 h-24 border-2 border-gold/20 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 border border-gold/40 rounded-full flex items-center justify-center">
                    <span className="font-dancing text-2xl text-gold">Top</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`lg:col-span-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4" />
                <p className="text-gray-600">Loading leading brands...</p>
              </div>
            ) : brandProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <p className="text-gray-600">No products found for {selectedBrand}. Please select products in Admin → Leading Brands.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="overflow-hidden">
                  <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * 50}%)` }}>
                    {brandProducts.map((product, index) => (
                      <div key={product.id} className="min-w-[50%] md:min-w-[25%] px-3">
                        <div
                          className={`group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2 ${
                            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                          }`}
                          style={{ transitionDelay: isVisible ? `${index * 100 + 300}ms` : '0ms' }}
                        >
                          <div className="relative aspect-[4/5] overflow-hidden bg-beige-50 cursor-pointer" onClick={() => navigate(getProductUrl(product))}>
                            <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e) => handleImageError(e, product.name)} />

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/brand/${encodeURIComponent(product.brand)}`); }} className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full font-bold uppercase text-sm tracking-wide shadow-lg whitespace-nowrap hover:bg-gray-100">
                                {product.brand || product.name || 'Product'}
                              </button>
                            </div>

                            {product.isSale && <span className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs rounded-full">Sale</span>}

                            <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                              <button onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }} className="w-full py-3 bg-white text-black text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold hover:text-white transition-colors duration-300 shadow-lg">
                                <ShoppingBag className="w-4 h-4" /> Quick Add
                              </button>
                            </div>
                          </div>

                          <div className="p-5">
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{product.brand}</p>
                            <h3 onClick={() => navigate(getProductUrl(product))} className="font-playfair text-lg font-semibold text-black mb-2 group-hover:text-gold transition-colors duration-300 cursor-pointer">{product.name || 'Unnamed Product'}</h3>
                            <p className="font-semibold text-lg">${product.price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {brandProducts.length > 2 && (
                  <>
                    <button onClick={() => { setCurrentSlide((prev) => (prev <= 0 ? Math.max(0, brandProducts.length - 2) : prev - 1)); setIsAutoPlaying(false); }} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -ml-6 lg:-ml-8">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={() => { setCurrentSlide((prev) => (prev >= Math.max(0, brandProducts.length - 2) ? 0 : prev + 1)); setIsAutoPlaying(false); }} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -mr-6 lg:-mr-8">
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

function getActiveProductIds(): string[] {
  try {
    const stored = localStorage.getItem('leadingBrandsProducts');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
