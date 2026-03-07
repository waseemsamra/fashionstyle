import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star, Eye } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

export default function FeaturedProducts() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const { addToCart, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('Loading featured products...');
        const data = await api.listProducts();
        console.log('Featured products loaded:', data);
        const items = data.items || data;
        setProducts(Array.isArray(items) ? items.slice(0, 4) : []);
      } catch (error) {
        console.error('Failed to load featured products:', error);
        setProducts([]);
      }
    };
    loadProducts();
  }, []);

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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`, {
      action: {
        label: 'View Cart',
        onClick: () => setIsCartOpen(true),
      },
    });
  };

  return (
    <section id="featured" ref={sectionRef} className="section-padding bg-beige-100">
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
            Discover our handpicked selection of the finest Pakistani dresses, 
            each piece crafted with meticulous attention to detail
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product: any, index) => (
            <div
              key={product.id}
              className={`group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{
                transitionDelay: isVisible ? `${index * 80 + 200}ms` : '0ms',
              }}
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer" onClick={() => navigate(getProductUrl(product))}>
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => handleImageError(e, product.name)}
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
                      New
                    </span>
                  )}
                  {product.isSale && (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                      Sale
                    </span>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <button 
                    className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gold hover:text-white transition-colors duration-300"
                    aria-label="Add to wishlist"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => navigate(getProductUrl(product))}
                    className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gold hover:text-white transition-colors duration-300"
                    aria-label="Quick view"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors duration-300"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                  {product.category}
                </p>
                <h3 
                  onClick={() => navigate(getProductUrl(product))}
                  className="font-playfair text-lg font-semibold text-black mb-2 group-hover:text-gold transition-colors duration-300 cursor-pointer"
                >
                  {product.name}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(product.rating || 0)
                          ? 'text-gold fill-gold'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-gray-400 line-through text-sm">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className={`text-center mt-12 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <a
            href="#categories"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-black border border-black font-medium text-sm tracking-wide rounded-full transition-all duration-300 hover:bg-black hover:text-white"
          >
            View All Products
          </a>
        </div>
      </div>
    </section>
  );
}
