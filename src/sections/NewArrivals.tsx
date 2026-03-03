import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { api } from '@/services/api';

export default function NewArrivals() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const { addToCart, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.listProducts().then(data => setProducts(data.items?.slice(0, 4) || []));
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
    <section id="new-arrivals" ref={sectionRef} className="section-padding bg-beige-100">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Content */}
          <div className={`lg:col-span-4 flex flex-col justify-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="lg:sticky lg:top-32">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-gold text-sm font-medium tracking-wide">
                  Just Arrived
                </span>
              </div>
              
              <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold text-black mb-4">
                New Arrivals
              </h2>
              
              <p className="text-gray-600 leading-relaxed mb-8">
                Be the first to discover our latest collection of exquisite Pakistani fashion. 
                From elegant casual wear to stunning formal pieces, find your perfect style.
              </p>
              
              <a
                href="/new-arrivals"
                className="group inline-flex items-center gap-2 text-black font-medium hover:text-gold transition-colors duration-300"
              >
                View All New Arrivals
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
              </a>

              {/* Decorative Element */}
              <div className="hidden lg:block mt-12">
                <div className="w-24 h-24 border-2 border-gold/20 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 border border-gold/40 rounded-full flex items-center justify-center">
                    <span className="font-dancing text-2xl text-gold">New</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Products Grid */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map((product: any, index) => (
                <div
                  key={product.id}
                  className={`group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${index * 100 + 300}ms` : '0ms',
                  }}
                >
                  {/* Image */}
                  <div 
                    className="relative aspect-[4/5] overflow-hidden bg-beige-50 cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* New Badge */}
                    <span className="absolute top-3 left-3 px-3 py-1 bg-gold text-white text-xs font-medium rounded-full">
                      New Arrival
                    </span>

                    {/* Quick Add */}
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="w-full py-3 bg-white text-black text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold hover:text-white transition-colors duration-300 shadow-lg"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Quick Add
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                      {product.category}
                    </p>
                    <h3 className="font-playfair text-lg font-semibold text-black mb-2 group-hover:text-gold transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="font-semibold text-lg">${product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
