import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

export default function DesignersOnDiscount() {
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
        const data = await api.getAllProducts();
        let productsArray = (data.items || []).filter((p: any) => p && p.id);
        
        let discount = productsArray.filter((p: any) => p.isDesignersDiscount);
        
        if (discount.length === 0) {
          const savedProductIds = localStorage.getItem('designersDiscountProducts');
          if (savedProductIds) {
            const ids = JSON.parse(savedProductIds);
            discount = productsArray.filter((p: any) => ids.includes(p.id));
          }
        }
        
        if (discount.length === 0) {
          discount = productsArray.filter((p: any) => p && (p.isSale === true || p.originalPrice)).slice(0, 20);
        }
        
        setProducts(discount.slice(0, 20));
      } catch (error) {
        console.error('Error loading designers discount:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const cardsPerView = typeof window !== 'undefined' ? (window.innerWidth < 768 ? 2 : 4) : 2;
  const duplicatedProducts = useMemo(() => {
    if (products.length <= cardsPerView) return products;
    return [...products, ...products, ...products, ...products, ...products];
  }, [products]);

  const maxSlide = products.length * 4;

  useEffect(() => {
    if (!isAutoPlaying || products.length <= cardsPerView) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev >= maxSlide) return 0;
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length, maxSlide]);

  const scrollLeft = useCallback(() => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlide : prev - 1));
    setIsAutoPlaying(false);
  }, [maxSlide]);

  const scrollRight = useCallback(() => {
    setCurrentSlide((prev) => {
      if (prev >= maxSlide) return 0;
      return prev + 1;
    });
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
            <span className="text-gold text-sm font-medium tracking-wider uppercase block mb-1">Designer Deals</span>
            <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-black">Designers On Discount</h2>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="text-gold font-medium hover:text-gold/80 transition-colors flex items-center gap-2"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4" />
            <p className="text-gray-600">Loading discounted brands...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No discounted products found yet. Please add products in Admin → Designers Discount.
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
                  <div key={`${product.id}-${idx}`} className={`flex-shrink-0 ${cardsPerView === 4 ? 'w-1/4' : 'w-1/2'} px-3`}>
                    <ProductCard
                      product={product}
                      onWishlist={(e: any) => handleWishlist(product, e)}
                      isInWishlist={isInWishlist(product.id)}
                      onNavigate={() => navigate(getProductUrl(product))}
                      onBrandNavigate={() => navigate(`/brand/${encodeURIComponent(product.brand)}`)}
                      onAddToCart={() => { addToCart(product); setIsCartOpen(true); toast.success(`${product.name} added!`); }}
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
            {product.brand || product.name || 'Product'}
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
         <h3 onClick={onNavigate} className="text-xs sm:text-sm font-semibold text-black mb-2 group-hover:text-gold transition-colors duration-300 cursor-pointer line-clamp-2">{product.name}</h3>
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
