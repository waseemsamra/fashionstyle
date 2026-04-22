import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import HorizontalCarousel from '@/components/ui/HorizontalCarousel';

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
  const [itemsPerView, setItemsPerView] = useState(6);
  const [categories, setCategories] = useState<{slug: string, name: string, displayName: string, image: string, description: string, itemCount: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Update items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      let newItemsPerView = 6;
      
      if (width >= 1024) {
        newItemsPerView = 6;
      } else if (width >= 768) {
        newItemsPerView = 4;
      } else {
        newItemsPerView = 3;
      }
      
      setItemsPerView(newItemsPerView);
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

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

          {/* Right Categories Carousel */}
          <div className="lg:col-span-8">
            <HorizontalCarousel
              itemsPerView={itemsPerView}
              showArrows={true}
              showIndicators={false}
            >
              {categories.map((category, index) => (
                <div
                  key={category.slug || category.name}
                  onClick={() => navigate(`/category/${category.slug || category.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
                  className={`group relative cursor-pointer px-2 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${index * 50 + 300}ms` : '0ms',
                  }}
                >
                  {/* Circular Category Card */}
                  <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mx-auto">
                    {/* Circle Image */}
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-white shadow-lg">
                      <img
                        src={category.image}
                        alt={category.displayName || category.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = '/product-placeholder.jpg';
                        }}
                      />
                    </div>

                    {/* Category Name */}
                    <div className="absolute -bottom-6 left-0 right-0 text-center">
                      <p className="text-xs font-medium text-gray-700 group-hover:text-gold transition-colors">
                        {category.displayName || category.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </HorizontalCarousel>
          </div>
        </div>
      </div>
    </section>
  );
}
