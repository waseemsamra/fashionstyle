import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

export default function FeaturedCarousel() {
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.listProducts();
        let productsArray = Array.isArray(data) ? data : (data.items || data.products || data.data || []);
        const featured = productsArray.filter((p: any) => p.isFeatured).slice(0, 20);
        setProducts(featured.length > 0 ? featured : productsArray.slice(0, 8));
      } catch (error) {
        setProducts([]);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || products.length === 0) return;
    const maxSlide = Math.max(0, products.length - Math.min(4, products.length));
    const interval = setInterval(() => {
      setCurrentSlide(prev => prev >= maxSlide ? 0 : prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length]);

  const scrollLeft = () => {
    setCurrentSlide(prev => prev <= 0 ? Math.max(0, products.length - Math.min(4, products.length)) : prev - 1);
    setIsAutoPlaying(false);
  };

  const scrollRight = () => {
    const maxSlide = Math.max(0, products.length - Math.min(4, products.length));
    setCurrentSlide(prev => prev >= maxSlide ? 0 : prev + 1);
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

  if (products.length === 0) return null;

  return (
    <section className="section-padding bg-beige-100">
      <div className="container-custom">
        <div className="text-center mb-12">
          <span className="text-gold text-sm font-medium tracking-wider uppercase mb-2 block">Curated Selection</span>
          <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold text-black mb-4">Featured Collection</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Discover our handpicked selection</p>
        </div>

        <div className="relative">
          {/* Left Arrow - Middle Left */}
          <button 
            onClick={scrollLeft} 
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 -ml-6 lg:-ml-8"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="overflow-hidden">
            <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * (100 / Math.min(4, products.length))}%)` }}>
              {products.map((product) => (
                <div key={product.id} className="min-w-[50%] lg:min-w-[25%] px-3">
                  <ProductCard product={product} onWishlist={(e: any) => handleWishlist(product, e)} isInWishlist={isInWishlist(product.id)} onNavigate={() => navigate(getProductUrl(product))} onAddToCart={() => { addToCart(product); setIsCartOpen(true); toast.success(`${product.name} added!`); }} />
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

        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.max(1, products.length - 3) }).map((_, i) => (
            <button key={i} onClick={() => { setCurrentSlide(i); setIsAutoPlaying(false); }} className={`w-3 h-3 rounded-full transition-all ${currentSlide === i ? 'bg-gold w-8' : 'bg-gray-300'}`} />
          ))}
        </div>

        <div className="text-center mt-12">
          <a href="#categories" className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-black rounded-full hover:bg-black hover:text-white">View All Products</a>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, onWishlist, isInWishlist, onNavigate, onAddToCart }: any) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all hover:-translate-y-2">
      <div className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer" onClick={onNavigate}>
        <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" onError={(e) => handleImageError(e, product.name)} />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && <span className="px-3 py-1 bg-black text-white text-xs rounded-full">New</span>}
          {product.isSale && <span className="px-3 py-1 bg-red-500 text-white text-xs rounded-full">Sale</span>}
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
          <button onClick={onWishlist} className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ${isInWishlist ? 'bg-gold text-white' : 'bg-white hover:bg-gold hover:text-white'}`}>
            <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
          <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gold hover:text-white"><Star className="w-4 h-4" /></button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all">
          <button onClick={onAddToCart} className="w-full py-3 bg-black text-white text-sm rounded-full flex items-center justify-center gap-2 hover:bg-gold"><ShoppingBag className="w-4 h-4" /> Add to Cart</button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-gray-500 text-xs uppercase mb-1">{product.category}</p>
        <h3 onClick={onNavigate} className="font-playfair text-lg font-semibold mb-2 group-hover:text-gold cursor-pointer">{product.name}</h3>
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
  );
}
