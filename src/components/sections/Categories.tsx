import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const S3 = 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images';

const CATEGORY_IMAGES: Record<string, string> = {
  'Bridal Wear': `${S3}/category-bridal.jpg`,
  'Casual Wear': `${S3}/category-casual.jpg`,
  'Formal Wear': `${S3}/category-formal.jpg`,
  'Accessories': `${S3}/category-accessories.jpg`,
  'Festive Collection': `${S3}/category-festive.jpg`,
  'Kids Wear': `${S3}/category-casual.jpg`,
  'Men Wear': `${S3}/category-formal.jpg`,
  'Footwear': `${S3}/category-accessories.jpg`,
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
        const categoriesData = Array.isArray(data) ? data : data.categories || data.items || [];
        
        console.log('Categories API Response:', data);
        console.log('Categories Data:', categoriesData);

        if (!categoriesData || categoriesData.length === 0) {
          setError('No categories found');
          setCategories([]);
          setLoading(false);
          return;
        }

        console.log('Loaded categories:', categoriesData);

        // Build categories array with images and descriptions
        const cats = categoriesData
          .map((category: any) => {
            const categoryName = typeof category === 'string' ? category : category.name;
            if (!categoryName || typeof categoryName !== 'string') {
              console.warn('Invalid category data:', category);
              return null;
            }
            return {
              slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              name: categoryName,
              displayName: categoryName,
              image: CATEGORY_IMAGES[categoryName] || `${S3}/category-casual.jpg`,
              description: CATEGORY_DESCRIPTIONS[categoryName] || 'Explore this category',
              itemCount: category.count || 0, // Use count from backend if available
            };
          })
          .filter(Boolean) // Remove null entries
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
    <section id="categories" ref={sectionRef} className="py-8 bg-beige-100">
      <div className="container-custom">
        {/* Full Width Categories Carousel */}
        <div className={`transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{
          transitionDelay: isVisible ? '200ms' : '0ms',
        }}
        >
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
                <div className="flex gap-6 items-center justify-center">
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
                        {/* Enlarged Circle Image */}
                        <div className="relative w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32">
                          <div className="w-full h-full rounded-full overflow-hidden border border-gray-200 shadow-sm">
                            <img
                              src={category.image}
                              alt={category.displayName || category.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => { e.currentTarget.src = `${S3}/category-casual.jpg`; }}
                            />
                          </div>
                        </div>

                        {/* Category Name */}
                        <p className="text-sm text-gray-600 mt-3 text-center max-w-[120px] truncate">
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
    </section>
  );
}
