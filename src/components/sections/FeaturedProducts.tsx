import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';
import HorizontalCarousel from '@/components/ui/HorizontalCarousel';

export default function FeaturedProducts() {
  const navigate = useNavigate();
  const [itemsPerView, setItemsPerView] = useState(4);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Update items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      let newItemsPerView = 4;
      
      console.log('📱 Featured Products Window width changed:', width);
      
      if (width >= 1024) {
        newItemsPerView = 4;
        console.log('✅ Featured Products Desktop mode - Showing 4 cards');
      } else if (width >= 768) {
        newItemsPerView = 2;
        console.log('✅ Featured Products Tablet mode - Showing 2 cards');
      } else {
        newItemsPerView = 1;
        console.log('✅ Featured Products Mobile mode - Showing 1 card');
      }
      
      console.log(`📊 Featured Products Setting itemsPerView to: ${newItemsPerView}`);
      setItemsPerView(newItemsPerView);
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('Loading featured products...');
        setLoading(true);
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
        
        // If no featured products, show all available products (up to 8)
        const displayProducts = featuredProducts.length > 0 
          ? featuredProducts 
          : productsArray.slice(0, 8);

        console.log('Featured products loaded:', displayProducts.length, '(featured:', featuredProducts.length, ', total:', productsArray.length, ')');
        console.log('Products to display:', displayProducts.map((p: any) => p.name));
        setProducts(displayProducts);
      } catch (error) {
        console.error('Failed to load featured products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!localStorage.getItem('jwt_token')) {
      toast.error('Please login', { action: { label: 'Login', onClick: () => navigate('/login') } });
      return;
    }
    toast.success('Added to wishlist');
  };

  if (loading) {
    console.log('⏳ Loading featured products...');
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (products.length === 0) {
    console.log('❌ No featured products found');
    return null;
  }

  console.log('✅ Rendering featured carousel with', itemsPerView, 'cards per view');

  return (
    <section className="py-12 bg-gray-50">
      {/* DEBUG: Visual indicator of current mode */}
      <div className="fixed top-0 right-0 bg-black text-white px-2 py-1 text-xs z-50 rounded-bl">
        Featured: {itemsPerView === 4 ? 'Desktop (4 cards)' : itemsPerView === 2 ? 'Tablet (2 cards)' : 'Mobile (1 card)'} | 
        Width: {window.innerWidth}px | 
        Products: {products.length}
      </div>

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Featured Collection
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Handpicked favorites from our exclusive collection
          </p>
        </div>

        {/* Carousel Container */}
        <HorizontalCarousel
          itemsPerView={itemsPerView}
          onSlideChange={(slideIndex) => console.log('🎯 Featured Products Jump to slide', slideIndex)}
        >
          {products.map((product) => (
            <ProductCard 
              key={product.id}
              product={product} 
              navigate={navigate} 
              onWishlist={handleWishlist}
              onNavigate={() => navigate(getProductUrl(product))}
              onAddToCart={() => toast.info('Add to cart coming soon')}
            />
          ))}
        </HorizontalCarousel>

        {/* View All Button */}
        <div className="text-center mt-10">
          <button
            onClick={() => {
              console.log('🔗 Featured Products Navigate to /shop?featured=true');
              navigate('/shop?featured=true');
            }}
            className="px-6 py-2.5 md:px-8 md:py-3 bg-gold text-white font-semibold rounded-full hover:bg-gold/90 transition-all transform hover:scale-105 shadow-md"
          >
            View All Featured Items
          </button>
        </div>
      </div>
    </section>
  );
}

// Product Card Component
function ProductCard({ product, onWishlist, onNavigate, onAddToCart }: any) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2">
      <div className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer" onClick={onNavigate}>
        <img 
          src={getProductImage(product)} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          onError={(e) => handleImageError(e, product.name)} 
        />
        
        {/* Featured Badge */}
        {product.isFeatured && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-gold text-white text-xs rounded-full font-semibold">
            Featured
          </span>
        )}

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
          <button
            onClick={onWishlist}
            className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-all"
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>

        {/* Add to Cart Button - Shows on Hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={onAddToCart}
            className="w-full py-2 md:py-3 bg-black text-white text-xs font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors"
          >
            <ShoppingBag className="w-3 h-3 md:w-4 md:h-4" />
            Add to Cart
          </button>
        </div>
      </div>

      <div className="p-3">
        <p className="text-gray-500 text-xs uppercase mb-1">
          {product.category || 'Featured'}
        </p>
        
        <h3
          onClick={onNavigate}
          className="font-semibold text-xs mb-2 cursor-pointer hover:text-gold transition line-clamp-2 featured-product-name"
        >
          {product.name}
        </h3>
        
        {/* Rating Stars */}
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-2.5 h-2.5 ${
                i < Math.floor(product.rating || 0) 
                  ? 'text-gold fill-gold' 
                  : 'text-gray-300'
              }`}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">
            ({product.rating || 0})
          </span>
        </div>
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs">
            Rs. {product.price?.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-gray-400 line-through text-xs">
              Rs. {product.originalPrice?.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
