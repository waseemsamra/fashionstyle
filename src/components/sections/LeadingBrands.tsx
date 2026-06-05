import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

const API_URL = import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws';

export default function LeadingBrands() {
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products?limit=2000`);
        const data = await response.json();
        let productsArray = (data.items || []).filter((p: any) => p && p.id && p.name && p.name !== 'undefined' && p.price != null);
        
        let leading = productsArray.filter((p: any) => p.isLeadingBrands && p.name && p.name !== 'undefined');
        
        if (leading.length === 0) {
          leading = productsArray.filter((p: any) => p && p.isNew).slice(0, 20);
        }
        
        setProducts(leading);
        
        const brandList = (Array.from(new Set(leading.map((p: any) => p.brand).filter(Boolean))) as string[]).filter((b: string) => b.length > 0);
        setBrands(brandList);
        if (brandList.length > 0) setSelectedBrand(brandList[0]);
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

  useEffect(() => {
    if (!isAutoPlaying || products.length === 0) return;
    const brandProducts = getBrandProducts();
    if (brandProducts.length <= 3) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        const maxSlide = brandProducts.length - 3;
        return prev >= maxSlide ? 0 : prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, products, selectedBrand]);

  const getBrandProducts = () => {
    return products.filter((p: any) => p.brand === selectedBrand);
  };

  const getCardsPerView = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 1;
    return 3;
  };

  const scrollLeft = () => {
    const brandProducts = getBrandProducts();
    const cardsPerView = getCardsPerView();
    const maxSlide = Math.max(0, brandProducts.length - cardsPerView);
    setCurrentSlide(prev => prev <= 0 ? maxSlide : prev - cardsPerView);
    setIsAutoPlaying(false);
  };

  const scrollRight = () => {
    const brandProducts = getBrandProducts();
    const cardsPerView = getCardsPerView();
    const maxSlide = Math.max(0, brandProducts.length - cardsPerView);
    setCurrentSlide(prev => prev >= maxSlide ? 0 : prev + cardsPerView);
    setIsAutoPlaying(false);
  };

  const handleWishlist = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!localStorage.getItem('jwt_token')) {
      toast.error('Please login', { action: { label: 'Login', onClick: () => navigate('/login') } });
      return;
    }
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success(`Removed ${product.name}`);
    } else {
      addToWishlist(product);
      toast.success(`Added ${product.name}`);
    }
  };

  const brandProducts = getBrandProducts();
  const maxSlide = Math.max(0, brandProducts.length - 1);

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-gold text-sm font-medium tracking-wider uppercase block mb-1">Top Labels</span>
            <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-black">Leading Brands</h2>
          </div>
          <button
            onClick={() => navigate('/leading-brands')}
            className="text-gold font-medium hover:text-gold/80 transition-colors flex items-center gap-2"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4" />
            <p className="text-gray-600">Loading leading brands...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No brands found yet. Please add products in Admin → Leading Brands.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Brand Names */}
            <div className="bg-beige-50 rounded-2xl p-6">
              <h3 className="font-playfair text-2xl font-semibold text-black mb-6">Select Brand</h3>
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
            </div>

            {/* Right Column: Product Carousel */}
            <div>
              {brandProducts.length === 0 ? (
                <div className="text-center py-12 bg-beige-50 rounded-2xl">
                  <p className="text-gray-600">No products found for {selectedBrand}</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="overflow-hidden">
                    <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                      {brandProducts.map((product) => (
                        <div key={product.id} className="min-w-full md:min-w-[33.333%] flex-shrink-0 px-1">
                          <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2 mx-1">
                            <div className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer" onClick={() => navigate(getProductUrl(product))}>
                              <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e) => handleImageError(e, product.name)} />
                              
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/brand/${encodeURIComponent(product.brand)}`); }}
                                  className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full font-bold uppercase text-sm tracking-wide shadow-lg whitespace-nowrap hover:bg-gray-100"
                                >
                                  {product.brand || product.name || 'Product'}
                                </button>
                              </div>
                              
                              {product.isSale && <span className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs rounded-full">Sale</span>}
                              
                              <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                <button onClick={(e) => handleWishlist(product, e)} className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${isInWishlist(product.id) ? 'bg-gold text-white' : 'bg-white text-gray-700 hover:bg-gold hover:text-white'}`}>
                                  <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                                </button>
                                <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gold hover:text-white">
                                  <Star className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                <button onClick={(e) => { e.stopPropagation(); addToCart(product); setIsCartOpen(true); toast.success(`${product.name && product.name !== 'undefined' ? product.name : 'Product'} added!`); }} className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors duration-300">
                                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                                </button>
                              </div>
                            </div>

                            <div className="p-4">
                              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/brand/${encodeURIComponent(product.brand)}`); }} className="underline hover:text-gold">
                                  {product.brand || ''}
                                </button>
                              </p>
                              <h3 onClick={() => navigate(getProductUrl(product))} className="text-xs sm:text-sm font-semibold text-black mb-2 group-hover:text-gold transition-colors duration-300 cursor-pointer line-clamp-2">{product.name || 'Unnamed Product'}</h3>
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-gold fill-gold' : 'text-gray-300'}`} />
                                ))}
                                <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">${product.price}</span>
                                {product.originalPrice && (
                                  <span className="text-gray-400 line-through text-sm">${product.originalPrice}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Left Arrow */}
                  <button
                    onClick={scrollLeft}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -ml-4"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  {/* Right Arrow */}
                  <button
                    onClick={scrollRight}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -mr-4"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Indicators */}
                  {brandProducts.length > 3 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {Array.from({ length: maxSlide + 1 }).map((_, i) => (
                        <button key={i} onClick={() => { setCurrentSlide(i); setIsAutoPlaying(false); }} className={`w-3 h-3 rounded-full transition-all ${currentSlide === i ? 'bg-gold w-8' : 'bg-gray-300'}`} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
