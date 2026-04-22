import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORY_IMAGES: Record<string, string> = {
  'Bridal Wear': '/category-bridal.jpg',
  'Casual Wear': '/category-casual.jpg',
  'Formal Wear': '/category-formal.jpg',
  'Accessories': '/category-accessories.jpg',
  'Festive Collection': '/category-festive.jpg',
  'Kids Wear': '/category-kids.jpg',
  'Men Wear': '/category-men.jpg',
  'Footwear': '/category-footwear.jpg',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Bridal Wear': 'Exquisite wedding ensembles',
  'Casual Wear': 'Everyday elegance',
  'Formal Wear': 'Special occasion dresses',
  'Accessories': 'Complete your look',
  'Festive Collection': 'Celebrate in style',
};

import { API_CONFIG } from '../../config/api';
const CATEGORIES_API_URL = API_CONFIG.categoriesApi;

export default function Categories() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [categories, setCategories] = useState<{slug: string, name: string, displayName: string, image: string, description: string, itemCount: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('📦 Loading categories from API...');
        setError(null);

        const response = await fetch(`${CATEGORIES_API_URL}?limit=1000`, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} - Failed to fetch categories`);
        }
        
        const data = await response.json();
        const categoriesData = data.categories || data.items || [];
        
        console.log('Categories API Response:', data);
        console.log('Categories Data:', categoriesData);

        if (!categoriesData || categoriesData.length === 0) {
          setError('No categories found');
          setCategories([]);
          setLoading(false);
          return;
        }

        console.log('Loaded categories:', categoriesData);

        // Build categories array with images and descriptions from simple strings
        const cats = categoriesData
          .map((categoryName: string) => ({
            slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: categoryName,
            displayName: categoryName,
            image: CATEGORY_IMAGES[categoryName] || '/product-placeholder.jpg',
            description: CATEGORY_DESCRIPTIONS[categoryName] || 'Explore this category',
            itemCount: 0, // Backend doesn't provide counts for simple string array
          }))
          .slice(0, 8);

        console.log(`Showing ${cats.length} categories`);
        console.log('Final categories:', cats.map((category: { displayName: string, itemCount: number }) => `${category.displayName}(${category.itemCount})`).join(', '));
        
        if (cats.length === 0) {
          setError('No categories found');
          setCategories([]);
        } else {
          setCategories(cats);
          setError(null);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        setError(error instanceof Error ? error.message : 'Failed to load categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();

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

  if (loading) {
    return (
      <section id="categories" ref={sectionRef} className="section-padding bg-beige-100">
        <div className="container-custom">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || categories.length === 0) {
    return (
      <section id="categories" ref={sectionRef} className="section-padding bg-beige-100">
        <div className="container-custom">
          <div className="text-center py-12">
            <p className="text-red-600 font-semibold text-lg mb-2">❌ {error || 'No categories found'}</p>
            <p className="text-gray-600 text-sm">Unable to load categories at this time. Please try refreshing the page.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categories" ref={sectionRef} className="section-padding bg-beige-100">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Content */}
          <div className={`lg:col-span-4 flex flex-col justify-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
          }`}
          style={{
            transitionDelay: isVisible ? '200ms' : '0ms',
          }}
          >
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold text-black mb-4">
              CATEGORIES
            </h2>
            
            <p className="text-gray-600 text-lg mb-8">
              Explore Our Collection
            </p>

            <button
              onClick={() => navigate('/categories')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white font-semibold rounded-full hover:bg-gold/90 transition-all transform hover:scale-105 shadow-md w-fit"
            >
              View All Categories
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Categories Horizontal Scroll */}
          <div className="lg:col-span-8">
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  const container = document.getElementById('categories-scroll');
                  if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Right Arrow */}
              <button
                onClick={() => {
                  const container = document.getElementById('categories-scroll');
                  if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Horizontal Scroll Container */}
              <div 
                id="categories-scroll"
                className="overflow-x-auto scrollbar-hide px-10 py-4"
              >
                <div className="flex gap-6 items-center">
                  {categories.map((category, index) => (
                    <div
                      key={category.slug || category.name}
                      onClick={() => navigate(`/category/${category.slug || category.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
                      className={`group relative cursor-pointer flex-shrink-0 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
                      }`}
                      style={{
                        transitionDelay: isVisible ? `${index * 50 + 300}ms` : '0ms',
                      }}
                    >
                      {/* Circular Category Card */}
                      <div className="flex flex-col items-center">
                        {/* Small Circle Image */}
                        <div className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16">
                          <div className="w-full h-full rounded-full overflow-hidden border border-gray-200 shadow-sm">
                            <img
                              src={category.image}
                              alt={category.displayName || category.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => {
                                e.currentTarget.src = '/product-placeholder.jpg';
                              }}
                            />
                          </div>
                        </div>

                        {/* Category Name */}
                        <p className="text-xs text-gray-600 mt-2 text-center max-w-[80px] truncate">
                          {category.displayName || category.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
