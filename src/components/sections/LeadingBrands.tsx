import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

const API_URL = import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws';

export default function LeadingBrands() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, setIsCartOpen } = useCart();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          
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
        const leading = allProducts.filter((p: any) => p.isLeadingBrand && p.name && p.name !== 'undefined');

        if (leading.length === 0) {
          setProducts([]);
          setBrands([]);
          setSelectedBrand('');
          return;
        }

        setProducts(leading);
        const brandList = (Array.from(new Set(leading.map((p: any) => p.brand).filter(Boolean))) as string[]).filter((b: string) => b.length > 0);
        setBrands(brandList);
        if (brandList.length > 0 && !selectedBrand) setSelectedBrand(brandList[0]);
      } catch (error) {
        console.error('Error loading leading brands:', error);
        setProducts([]);
        setBrands([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const brandProducts = products.filter((p: any) => p.brand === selectedBrand);
  const maxSlide = Math.max(0, brandProducts.length - 2);

  useEffect(() => {
    return () => {};
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || brandProducts.length <= 2) return;
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

  return (
    <section id="leading-brands" ref={sectionRef} className="section-padding bg-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Brand Names Only */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-black mb-6">Leading Brands</h2>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold mx-auto mb-3" />
              </div>
            ) : brands.length === 0 ? (
              <p className="text-gray-500 text-sm">No brands available.</p>
            ) : (
              <div className="space-y-3">
                {brands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => { setSelectedBrand(brand); setCurrentSlide(0); setIsAutoPlaying(true); }}
                    className={`w-full text-left px-6 py-4 rounded-xl text-lg font-medium transition-all duration-300 ${
                      selectedBrand === brand
                        ? 'bg-gold text-white shadow-lg'
                        : 'bg-white text-black hover:bg-gold/10 hover:text-gold shadow-sm'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Brand Products Carousel */}
          <div>
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
                  <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * 50}%)` }}>
                    {brandProducts.map((product) => (
                      <div key={product.id} className="min-w-[50%] md:min-w-[25%] px-3">
                        <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2">
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

                {brandProducts.length > 2 && (
                  <>
                    <button onClick={() => { setCurrentSlide((prev) => (prev <= 0 ? Math.max(0, brandProducts.length - 2) : prev - 1)); setIsAutoPlaying(false); }} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -ml-4">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={() => { setCurrentSlide((prev) => (prev >= Math.max(0, brandProducts.length - 2) ? 0 : prev + 1)); setIsAutoPlaying(false); }} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -mr-4">
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
