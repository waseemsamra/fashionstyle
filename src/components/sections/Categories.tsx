import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { categories } from '@/data/products';

export default function Categories() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="categories" ref={sectionRef} className="section-padding bg-beige-100">
      <div className="container-custom">
        {/* Section Header */}
        <div className={`flex flex-col md:flex-row md:items-end md:justify-between mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <span className="text-gold text-sm font-medium tracking-wider uppercase mb-2 block">
              Browse Collection
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold text-black">
              Shop by Category
            </h2>
          </div>
          <p className="text-gray-600 max-w-md mt-4 md:mt-0">
            Explore our wide range of categories and find the perfect outfit for every occasion
          </p>
        </div>

        {/* Categories Grid - Masonry Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((category, index) => (
            <div
              key={category.id}
              onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`)}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
                index % 3 === 0 ? 'lg:row-span-2' : ''
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
              style={{
                transitionDelay: isVisible ? `${index * 80 + 200}ms` : '0ms',
                transitionDuration: '700ms',
              }}
            >
              {/* Image */}
              <div className={`relative overflow-hidden ${index % 3 === 0 ? 'h-[400px] lg:h-[600px]' : 'h-[280px] lg:h-[290px]'}`}>
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  {/* Item Count Badge */}
                  <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium w-fit mb-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    {category.itemCount} Items
                  </span>
                  
                  {/* Title */}
                  <h3 className="font-playfair text-xl md:text-2xl font-semibold text-white mb-1 group-hover:-translate-y-1 transition-transform duration-300">
                    {category.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-white/70 text-sm mb-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    {category.description}
                  </p>
                  
                  {/* Arrow */}
                  <div className="flex items-center gap-2 text-gold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-100">
                    <span className="text-sm font-medium">Explore</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
