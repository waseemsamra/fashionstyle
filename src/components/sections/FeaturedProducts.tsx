import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

export default function FeaturedProducts() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const { addToCart, setIsCartOpen } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const totalSlides = products.length > 0 ? Math.ceil(products.length / 4) : 1;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('Loading featured products...');
        const data = await api.listProducts();
        
        let productsArray = [];
        if (Array.isArray(data)) {
          productsArray = data;
        } else if (data && typeof data === 'object') {
          if (data.items && Array.isArray(data.items)) productsArray = data.items;
          else if (data.products && Array.isArray(data.products)) productsArray = data.products;
          else if (data.data && Array.isArray(data.data)) productsArray = data.data;
        }

        // Filter to show only featured products (max 20)
        const featuredProducts = productsArray.filter((p: any) => p.isFeatured).slice(0, 20);
        const displayProducts = featuredProducts.length > 0 ? featuredProducts : productsArray.slice(0, 8);

        console.log('Featured products loaded:', displayProducts.length);
        setProducts(displayProducts);
      } catch (error) {
        console.error('Failed to load featured products:', error);
        setProducts([]);
      }
    };

    loadProducts();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (!isAutoPlaying || products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        const next = prev + 1;
        if (next >= totalSlides) {
          return 0; // Loop back to start
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length, totalSlides]);

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

  const scrollLeft = () => {
    setCurrentSlide(prev => {
      const next = prev - 1;
      return next < 0 ? totalSlides - 1 : next;
    });
    setIsAutoPlaying(false);
  };

  const scrollRight = () => {
    setCurrentSlide(prev => {
      const next = prev + 1;
      return next >= totalSlides ? 0 : next;
    });
    setIsAutoPlaying(false);
  };

  // Mouse/Touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoPlaying(false);
    setStartX(e.pageX - carouselRef.current?.offsetLeft!);
    setScrollLeft(currentSlide);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current?.offsetLeft!;
    const walk = (x - startX) / 300; // Calculate drag distance
    if (walk > 0.5) {
      scrollLeft();
      setIsDragging(false);
    } else if (walk < -0.5) {
      scrollRight();
      setIsDragging(false);
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setIsAutoPlaying(false);
    setStartX(e.touches[0].pageX - carouselRef.current?.offsetLeft!);
    setScrollLeft(currentSlide);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - carouselRef.current?.offsetLeft!;
    const walk = (x - startX) / 300;
    if (walk > 0.5) {
      scrollLeft();
      setIsDragging(false);
    } else if (walk < -0.5) {
      scrollRight();
      setIsDragging(false);
    }
  };

  const handleToggleWishlist = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('jwt_token');
    const email = localStorage.getItem('user_email');

    if (!token || !email) {
      toast.error('Please login to add items to wishlist', {
        description: 'Create an account to save your favorite products',
        action: {
          label: 'Login',
          onClick: () => navigate('/login', {
            state: { from: location.pathname, message: 'Login to save items to your wishlist' }
          }),
        },
      });
      return;
    }

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success(`Removed ${product.name} from wishlist`);
    } else {
      addToWishlist(product);
      toast.success(`Added ${product.name} to wishlist`);
    }
  };

  return (
    <section id="featured" ref={sectionRef} className="section-padding bg-beige-100 overflow-hidden">
      <div className="container-custom">
        {/* Section Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-gold text-sm font-medium tracking-wider uppercase mb-2 block">
            Curated Selection
          </span>
          <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold text-black mb-4">
            Featured Collection
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of the finest Pakistani dresses
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Left Arrow */}
          {products.length > 4 && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -ml-6"
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Carousel Track */}
          <div
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 25}%)` }}
          >
            {products.map((product) => (
              <div key={product.id} className="w-full sm:w-1/2 lg:w-1/4 flex-shrink-0 px-3">
                <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2">
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer" onClick={() => navigate(getProductUrl(product))}>
                    <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e) => handleImageError(e, product.name)} />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.isNew && <span className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">New</span>}
                      {product.isSale && <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">Sale</span>}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <button onClick={(e) => handleToggleWishlist(product, e)} className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${isInWishlist(product.id) ? 'bg-gold text-white' : 'bg-white text-gray-700 hover:bg-gold hover:text-white'}`}>
                        <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button onClick={() => navigate(getProductUrl(product))} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gold hover:text-white">
                        <Star className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Add to Cart */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <button onClick={() => { addToCart(product); setIsCartOpen(true); toast.success(`${product.name} added to cart!`); }} className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold">
                        <ShoppingBag className="w-4 h-4" /> Add to Cart
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{product.category}</p>
                    <h3 onClick={() => navigate(getProductUrl(product))} className="font-playfair text-lg font-semibold text-black mb-2 group-hover:text-gold transition-colors duration-300 cursor-pointer">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (<Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-gold fill-gold' : 'text-gray-300'}`} />))}
                      <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">${product.price}</span>
                      {product.originalPrice && <span className="text-gray-400 line-through text-sm">${product.originalPrice}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          {products.length > 4 && (
            <button onClick={scrollRight} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -mr-6" disabled={currentSlide >= totalSlides - 1}>
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Indicators */}
        {products.length > 4 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button key={index} onClick={() => { setCurrentSlide(index); setIsAutoPlaying(false); }} className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-gold w-8' : 'bg-gray-300'}`} />
            ))}
          </div>
        )}

        {/* View All */}
        <div className={`text-center mt-12 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <a href="#categories" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-black border border-black font-medium text-sm tracking-wide rounded-full transition-all duration-300 hover:bg-black hover:text-white">
            View All Products
          </a>
        </div>
      </div>
    </section>
  );
}
