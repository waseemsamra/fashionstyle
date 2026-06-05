import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

const API_URL = import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws';

export default function TrendingNow() {
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products?limit=2000`);
        const data = await response.json();
        let productsArray = (data.items || []).filter((p: any) => p && p.id && p.name && p.name !== 'undefined' && p.price != null);

        let trending = productsArray.filter((p: any) => p.isTrendingNow && p.name && p.name !== 'undefined');

        if (trending.length === 0) {
          trending = productsArray.filter((p: any) => p && p.isNew).slice(0, 20);
        }

        setProducts(trending.slice(0, 20));
      } catch (error) {
        console.error('Error loading trending now:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const cardsPerView = 2;
  const duplicatedProducts = useMemo(() => {
    if (products.length <= cardsPerView) return products;
    return [...products, ...products];
  }, [products]);

  const maxSlide = duplicatedProducts.length - cardsPerView;

  useEffect(() => {
    if (!isAutoPlaying || duplicatedProducts.length <= cardsPerView) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, duplicatedProducts.length, maxSlide]);

  const scrollLeft = useCallback(() => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlide : prev - 1));
    setIsAutoPlaying(false);
  }, [maxSlide]);

  const scrollRight = useCallback(() => {
    setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
    setIsAutoPlaying(false);
  }, [maxSlide]);

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

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-gold text-sm font-medium tracking-wider uppercase block mb-1">Hot Picks</span>
            <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-black">Trending Now</h2>
          </div>
          <button
            onClick={() => navigate('/trending-now')}
            className="text-gold font-medium hover:text-gold/80 transition-colors flex items-center gap-2"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4" />
            <p className="text-gray-600">Loading trending products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No trending products found yet. Please add products in Admin → Trending Now.
            </p>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -ml-6 lg:-ml-8"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="overflow-hidden">
              <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * (100 / cardsPerView)}%)` }}>
                {duplicatedProducts.map((product, idx) => (
                  <div key={`${product.id}-${idx}`} className={`flex-shrink-0 ${cardsPerView === 2 ? 'w-1/2' : 'w-1/3'} px-3`}>
                    <ProductCard
                      product={product}
                      onWishlist={(e: any) => handleWishlist(product, e)}
                      isInWishlist={isInWishlist(product.id)}
                      onNavigate={() => navigate(getProductUrl(product))}
                      onBrandNavigate={() => navigate(`/brand/${encodeURIComponent(product.brand)}`)}
                      onAddToCart={() => { addToCart(product); setIsCartOpen(true); toast.success(`${product.name && product.name !== 'undefined' ? product.name : 'Product'} added!`); }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -mr-6 lg:-mr-8"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product, onWishlist, isInWishlist, onNavigate, onBrandNavigate, onAddToCart }: any) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2">
      <div className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer" onClick={onNavigate}>
        <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e) => handleImageError(e, product.name)} />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onBrandNavigate(); }}
            className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full font-bold uppercase text-sm tracking-wide shadow-lg whitespace-nowrap hover:bg-gray-100"
          >
             {product.brand || ''}
          </button>
        </div>

        {product.isSale && <span className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs rounded-full">Sale</span>}

        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
          <button onClick={onWishlist} className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${isInWishlist ? 'bg-gold text-white' : 'bg-white text-gray-700 hover:bg-gold hover:text-white'}`}>
            <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
          <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gold hover:text-white">
            <Star className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <button onClick={onAddToCart} className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors duration-300">
            <ShoppingBag className="w-4 h-4" /> Add to Cart
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
          <button
            onClick={(e) => { e.stopPropagation(); onBrandNavigate(); }}
            className="underline hover:text-gold"
          >
            {product.brand || ''}
          </button>
        </p>
         <h3 onClick={onNavigate} className="text-xs sm:text-sm font-semibold text-black mb-2 group-hover:text-gold transition-colors duration-300 cursor-pointer line-clamp-2">{product.name || 'Unnamed Product'}</h3>
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
  );
}
