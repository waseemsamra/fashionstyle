import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, Star, ChevronLeft, ChevronRight, ChevronDown, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { getProductUrl } from '@/utils/productUrl';
import { toCDNUrl } from '@/utils/productImage';
import LazyImage from '@/components/ui/LazyImage';
import { useBrands } from '@/hooks/useBrands';
import type { Brand } from '@/services/brandsService';

import { API_CONFIG } from '../../config/api';
const API_URL = API_CONFIG.productsApi;
const PRODUCTS_PER_PAGE = 100;

// Map URL slugs to EXACT API category names (case-sensitive!)
const categoryMap: Record<string, string> = {
  'accessories': 'Accessories',
  'bridal-wear': 'Bridal Wear',
  'casual-wear': 'Casual Wear',
  'festive-collection': 'Festive Collection',
  'footwear': 'Footwear',
  'formal-wear': 'Formal Wear',
  'kids-wear': 'Kids Wear',
  'men-wear': 'Men Wear',
  'new-arrivals': 'New Arrivals',
  'party-wear': 'Party Wear',
  'summer-collection': 'Summer Collection',
  'winter-collection': 'Winter Collection'
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Bridal Wear': 'Exquisite wedding ensembles for your special day',
  'Casual Wear': 'Everyday elegance for effortless style',
  'Formal Wear': 'Sophisticated dresses for special occasions',
  'Accessories': 'Complete your look with stunning accessories',
  'Festive Collection': 'Celebrate in style with our festive picks',
  'Kids Wear': 'Adorable outfits for your little ones',
  'Men Wear': 'Sharp and stylish menswear collection',
  'Women Wear': 'Elegant and trendy womenswear',
  'Footwear': 'Stylish and comfortable shoes for every occasion',
  'Party Wear': 'Eye-catching party outfits',
  'Summer Collection': 'Light and breezy summer styles',
  'Winter Collection': 'Warm and cozy winter fashion',
  'New Arrivals': 'Fresh new arrivals for you',
};

export default function Category() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    brands: [] as string[],
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch brands from API
  const { brands: brandsData, loading: brandsLoading } = useBrands();
  
  // Extract brands from products as fallback
  const extractBrandsFromProducts = (products: any[]) => {
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return uniqueBrands.sort();
  };
  
  // Use brands from API, or fallback to extracting from products
  const apiBrands = (brandsData?.map((b: Brand) => b.name).filter(Boolean) || []);
  const productBrands = allProducts.length > 0 ? extractBrandsFromProducts(allProducts) : [];
  const brands = apiBrands.length > 0 ? apiBrands : productBrands;
  
  // Debug brands loading
  console.log('Category page brands debug:');
  console.log('- brandsData:', brandsData);
  console.log('- brandsLoading:', brandsLoading);
  console.log('- apiBrands:', apiBrands);
  console.log('- productBrands:', productBrands);
  console.log('- final brands:', brands);
  console.log('- brands length:', brands.length);

  // Convert slug to display name
  // "formal-wear" -> "Formal Wear"
  const slugToDisplayName = (slug: string): string => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const categorySlug = name || '';
  const exactCategoryName = categoryMap[categorySlug] || slugToDisplayName(categorySlug);
  const displayName = exactCategoryName;

  // Close brand dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) {
        setShowBrandDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch products with filters and pagination
  const fetchProducts = useCallback(async () => {
    const isFirstLoad = !allProducts.length;
    if (isFirstLoad) {
      setIsLoadingProducts(true);
    } else {
      setIsFiltering(true);
    }
    setError(null);

    try {
      console.log('Fetching category products for:', exactCategoryName, 'slug:', categorySlug, 'page:', currentPage);

      const params = new URLSearchParams();
      
      // Always fetch more products to get accurate total count
      const fetchLimit = filters.brands.length > 0 || filters.priceRange !== 'all' ? 500 : PRODUCTS_PER_PAGE;
      params.append('limit', String(fetchLimit));
      params.append('page', String(currentPage));
      params.append('category', exactCategoryName); // Send actual category name to API

      if (filters.brands.length > 0) {
        params.append('brands', filters.brands.join(','));
      }

      if (filters.priceRange !== 'all') {
        switch (filters.priceRange) {
          case 'under50': params.append('maxPrice', '50'); break;
          case '50-100': params.append('minPrice', '50'); params.append('maxPrice', '100'); break;
          case '100-200': params.append('minPrice', '100'); params.append('maxPrice', '200'); break;
          case 'over200': params.append('minPrice', '200'); break;
        }
      }

      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const url = `${API_URL}/products?${params.toString()}`;
      console.log('📡 Fetching:', url);

      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const products = data.products || data.items || [];
      const apiTotal = data.total || data.count || products.length;

      console.log(`📊 Raw API response: ${products.length} products, total: ${apiTotal}`);
      console.log(`🔍 Category filter used: "${exactCategoryName}", Normalized for filtering...`);
      
      // CLIENT-SIDE FILTERING FALLBACK (API may not filter properly)
      let filteredProducts = [...products];
      
      // Filter by Category (case-sensitive - use exact match)
      filteredProducts = filteredProducts.filter(p => {
        const productCategory = p.category || '';
        return productCategory === exactCategoryName;
      });
      console.log(`✅ After client-side category filter: ${products.length} -> ${filteredProducts.length} products`);

      // Filter by Brands (if any selected)
      if (filters.brands.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          filters.brands.includes(p.brand)
        );
        console.log(`✅ After brand filter: ${filteredProducts.length} products`);
      }

      // Filter by Price Range
      if (filters.priceRange !== 'all') {
        filteredProducts = filteredProducts.filter(p => {
          const price = p.price || 0;
          switch (filters.priceRange) {
            case 'under50': return price < 50;
            case '50-100': return price >= 50 && price <= 100;
            case '100-200': return price >= 100 && price <= 200;
            case 'over200': return price > 200;
            default: return true;
          }
        });
        console.log(`✅ After price filter: ${filteredProducts.length} products`);
      }

      // Apply Sorting
      filteredProducts.sort((a, b) => {
        let valA, valB;
        if (filters.sortBy === 'price') {
          valA = a.price || 0;
          valB = b.price || 0;
        } else if (filters.sortBy === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        } else {
          valA = new Date(a.createdAt || 0).getTime();
          valB = new Date(b.createdAt || 0).getTime();
        }

        if (filters.sortOrder === 'asc') {
          return valA < valB ? -1 : valA > valB ? 1 : 0;
        } else {
          return valA > valB ? -1 : valA < valB ? 1 : 0;
        }
      });

      setAllProducts(filteredProducts);
      // Use API total for pagination, but if we have filters, use filtered count
      const effectiveTotal = (filters.brands.length > 0 || filters.priceRange !== 'all') ? filteredProducts.length : apiTotal;
      setTotalProducts(effectiveTotal);
      console.log(`Final total products for pagination: ${effectiveTotal}`);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      console.error('API URL:', API_URL);
      console.error('Category name:', exactCategoryName);
      console.error('Category slug:', categorySlug);
      setError(err as Error);
    } finally {
      setIsLoadingProducts(false);
      setIsFiltering(false);
    }
  }, [categorySlug, exactCategoryName, filters.brands, filters.priceRange, filters.sortBy, filters.sortOrder, currentPage, allProducts.length]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentPage(1);
    setFilters({ priceRange: 'all', brands: [], sortBy: 'createdAt', sortOrder: 'desc' });
  }, [name]);

  const resetFilters = () => {
    setFilters({
      priceRange: 'all',
      brands: [],
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setCurrentPage(1);
  };

  const toggleBrand = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand],
    }));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setSearchParams(prev => {
      if (page > 1) prev.set('page', String(page));
      else prev.delete('page');
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayedCount = allProducts.length;
  const actualTotal = totalProducts;
  const totalPages = Math.max(1, Math.ceil(actualTotal / (filters.brands.length > 0 || filters.priceRange !== 'all' ? 500 : PRODUCTS_PER_PAGE)));
  const description = CATEGORY_DESCRIPTIONS[displayName] || `Explore our ${displayName} collection`;

  if (isLoadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Failed to Load Products</h3>
          <p className="text-gray-500 mb-6">Please try refreshing the page</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-beige-100 transition-opacity duration-200 ${isFiltering ? 'opacity-60' : 'opacity-100'}`}>
      {/* Hero Section - Clean Background */}
      <section className="relative bg-gradient-to-r from-gold/30 via-gold/20 to-gold/10 py-20 mb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="font-playfair text-5xl md:text-6xl font-bold text-black mb-4">{displayName}</h1>
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
              <div>
                <p className="text-gray-600 text-lg">{description}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gold">{actualTotal}</span>
                <span className="text-gray-600 text-lg">
                  {actualTotal === 1 ? 'Product' : 'Products'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Multi-Select Brand Filter */}
            <div ref={brandDropdownRef} className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Brands ({filters.brands.length})</label>
              <button
                type="button"
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:border-gold/50 bg-white hover:border-gold/50 transition"
              >
                <span className="truncate">{filters.brands.length === 0 ? 'All Brands' : filters.brands.slice(0, 2).join(', ') + (filters.brands.length > 2 ? '...' : '')}</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0 ml-1" />
              </button>

              {showBrandDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input type="checkbox" checked={filters.brands.length === 0} onChange={() => { setFilters(prev => ({ ...prev, brands: [] })); setCurrentPage(1); }} className="w-4 h-4" />
                      <span className="text-sm font-medium">All Brands</span>
                    </label>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {brandsLoading ? (
                      <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                    ) : brands.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No brands available</div>
                    ) : (
                      brands.map(brand => (
                        <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2">
                          <input type="checkbox" checked={filters.brands.includes(brand)} onChange={() => toggleBrand(brand)} className="w-4 h-4 rounded border-gray-300" />
                          <span className="text-sm">{brand}</span>
                          {filters.brands.includes(brand) && <Check className="w-3 h-3 ml-auto text-gold" />}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
              <select value={filters.priceRange} onChange={(e) => { setFilters(prev => ({ ...prev, priceRange: e.target.value })); setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50">
                <option value="all">All Prices</option>
                <option value="under50">Under $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-200">$100 - $200</option>
                <option value="over200">Over $200</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select value={filters.sortBy} onChange={(e) => { setFilters(prev => ({ ...prev, sortBy: e.target.value })); setCurrentPage(1); }} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50">
                  <option value="createdAt">Newest</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
                {filters.sortBy === 'price' && (
                  <select value={filters.sortOrder} onChange={(e) => { setFilters(prev => ({ ...prev, sortOrder: e.target.value })); setCurrentPage(1); }} className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50">
                    <option value="asc">↑</option>
                    <option value="desc">↓</option>
                  </select>
                )}
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <Button onClick={resetFilters} variant="outline" className="w-full h-10 text-sm hover:bg-gray-50 hover:border-gold">
                <X className="w-4 h-4 mr-1" /> Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Products Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {actualTotal > 0 ? `Showing ${displayedCount} products (Page ${currentPage} of ${totalPages})` : 'No products found'}
          </p>
          {isFiltering && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gold" />
              <span>Updating...</span>
            </div>
          )}
        </div>

        {allProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters to see more results.</p>
            <Button onClick={resetFilters} variant="outline">Reset Filters</Button>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-10">
              {allProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition">
                  <div className="relative aspect-[3/4] overflow-hidden cursor-pointer" onClick={() => navigate(getProductUrl(product))}>
                    <LazyImage src={toCDNUrl(product.image)} alt={product.name} productName={product.name} productId={product.id} className="w-full h-full" />
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.isNew && <span className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">New</span>}
                      {product.isSale && <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">Sale</span>}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <button onClick={(e) => { e.stopPropagation(); toast.info('Add to cart coming soon'); }} className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors">
                        <ShoppingBag className="w-4 h-4" /> Add to Cart
                      </button>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-gray-500 text-xs uppercase mb-1">{product.category}</p>
                    {product.brand && (
                      <p className="text-gray-400 text-xs mb-1">{product.brand}</p>
                    )}
                    <h3 onClick={() => navigate(getProductUrl(product))} className="font-semibold text-xs leading-[12px] mb-1 sm:mb-2 cursor-pointer hover:text-gold transition line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-gold fill-gold' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">${product.price}</span>
                      {product.originalPrice && <span className="text-gray-400 line-through text-sm">${product.originalPrice}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pb-8">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else if (currentPage <= 4) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    page = totalPages - 6 + i;
                  } else {
                    page = currentPage - 3 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-gold text-white hover:bg-gold/90'
                          : 'border border-gray-300 hover:bg-gray-50 hover:border-gold'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gold"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
