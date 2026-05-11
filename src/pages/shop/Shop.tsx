import { toCDNUrl } from '@/utils/productImage';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, ShoppingBag, Star, ChevronRight, ChevronDown, Check, ChevronLeft, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useToggleWishlist } from '@/hooks/useWishlist';
import { getProductUrl } from '@/utils/productUrl';
import LazyImage from '@/components/ui/LazyImage';
import { currencyService } from '@/services/currencyService';

import { API_CONFIG } from '../../config/api';
const API_URL = API_CONFIG.baseApiUrl;
const PRODUCTS_PER_PAGE = 50;

// Fetch categories directly from API
async function fetchCategories(): Promise<{name: string, count: number}[]> {
  try {
    const res = await fetch(`${API_CONFIG.categoriesApi}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.categories || [];
  } catch {
    return [];
  }
}

export default function Shop() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toggleWishlist } = useToggleWishlist();
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    rating: 'all',
    status: 'all',
    brands: [] as string[],
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const [allBrands, setAllBrands] = useState<string[]>([]);

  // Fetch ALL products once on mount, extract brands
  useEffect(() => {
    setIsLoadingProducts(true);
    fetch(`${API_URL}/products?limit=1000`)
      .then(r => r.json())
      .then(data => {
        const products = data.items || [];
        const unique = [...new Set<string>(products.map((p: any) => p.brand).filter(Boolean))].sort() as string[];
        setAllBrands(unique);
      })
      .catch(err => setError(err))
      .finally(() => setIsLoadingProducts(false));
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  // Compute brands for selected category
  const brands = useMemo(() => {
    if (filters.category === 'all') return allBrands;
    // Use filteredProducts for brand computation to get accurate list
    return [...new Set<string>(
      filteredProducts.filter(p => p.category === filters.category).map(p => p.brand).filter(Boolean)
    )].sort();
  }, [allBrands, filteredProducts, filters.category]);

  // Hybrid filtering: server-side with client-side fallback
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    
    // Determine if we have filters that need client-side processing
    const hasClientFilters = filters.category !== 'all' || 
                             filters.brands.length > 0 || 
                             filters.priceRange !== 'all' || 
                             filters.status !== 'all';
    
    const params = new URLSearchParams();
    
    // Always fetch a larger batch when we have filters for client-side processing
    const fetchLimit = hasClientFilters ? 500 : PRODUCTS_PER_PAGE;
    const offset = (currentPage - 1) * PRODUCTS_PER_PAGE;
    
    params.append('limit', String(fetchLimit));
    
    // Only use offset for server-side pagination when no client filters
    if (!hasClientFilters) {
      params.append('offset', String(offset));
    }
    
    // Try server-side filtering first
    if (filters.category !== 'all') {
      params.append('category', filters.category);
    }

    if (filters.priceRange !== 'all') {
      switch (filters.priceRange) {
        case 'under50': params.append('maxPrice', '50'); break;
        case '50-100': params.append('minPrice', '50'); params.append('maxPrice', '100'); break;
        case '100-200': params.append('minPrice', '100'); params.append('maxPrice', '200'); break;
        case 'over200': params.append('minPrice', '200'); break;
      }
    }

    if (filters.brands.length > 0) {
      filters.brands.forEach(brand => params.append('brand', brand));
    }

    if (filters.status === 'sale') params.append('isSale', 'true');
    if (filters.status === 'new') params.append('isNew', 'true');
    
    if (filters.rating && filters.rating !== 'all') params.append('minRating', filters.rating);
    
    if (filters.sortBy) {
      params.append('sort', filters.sortBy);
      params.append('order', filters.sortOrder);
    }

    try {
      const url = `${API_URL}/products?${params.toString()}`;
      console.log('📡 Hybrid API call:', url);
      console.log('🔍 Filters applied:', filters);
      console.log('📄 Page:', currentPage, 'Limit:', fetchLimit, 'Offset:', offset);
      console.log('🔄 Has client filters:', hasClientFilters);
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch products`);
      const data = await res.json();
      
      let products = data.items || [];
      const total = data.total || 0;
      
      console.log('📊 Raw API Response:', {
        items: products.length,
        total: total,
        sampleProducts: products.slice(0, 3).map((p: any) => ({ id: p.id, name: p.name, category: p.category, brand: p.brand }))
      });
      
      // Apply client-side filtering as fallback if server-side filtering doesn't work
      if (hasClientFilters) {
        console.log('🔧 Applying client-side filtering as fallback...');
        
        // Category filter
        if (filters.category !== 'all') {
          products = products.filter((p: any) => 
            p.category?.toLowerCase() === filters.category.toLowerCase() ||
            p.category?.name?.toLowerCase() === filters.category.toLowerCase()
          );
          console.log(`🏷️ After category filter: ${products.length} products`);
        }
        
        // Brand filter
        if (filters.brands.length > 0) {
          products = products.filter((p: any) => filters.brands.includes(p.brand));
          console.log(`🏢 After brand filter: ${products.length} products`);
        }
        
        // Price range filter
        if (filters.priceRange !== 'all') {
          products = products.filter((p: any) => {
            const price = p.price || 0;
            switch (filters.priceRange) {
              case 'under50': return price < 50;
              case '50-100': return price >= 50 && price <= 100;
              case '100-200': return price >= 100 && price <= 200;
              case 'over200': return price > 200;
              default: return true;
            }
          });
          console.log(`💰 After price filter: ${products.length} products`);
        }
        
        // Status filter
        if (filters.status === 'sale') {
          products = products.filter((p: any) => p.isSale === true);
          console.log(`🏷️ After sale filter: ${products.length} products`);
        }
        if (filters.status === 'new') {
          products = products.filter((p: any) => p.isNew === true);
          console.log(`🆕 After new filter: ${products.length} products`);
        }
        
        // Store ALL filtered products (without pagination)
        setFilteredProducts(products);
        setTotalProducts(products.length);
        // Don't set displayedProducts here - let the pagination useEffect handle it
      } else {
        // Use server-side results directly when no client filters
        console.log(`🔄 No client filters - using server-side results`);
        console.log(`📊 Server returned ${products.length} products, total: ${total}`);
        setFilteredProducts(products);
        setDisplayedProducts(products);
        setTotalProducts(total);
      }
      
    } catch (err) {
      console.error('❌ API Error:', err);
      setError(err as Error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    // Always fetch when currentPage or filters change
    fetchProducts();
  }, [currentPage, filters]);

  // Handle pagination display with filtered products (only when filters applied)
  useEffect(() => {
    const hasClientFilters = filters.category !== 'all' || filters.brands.length > 0 || 
                             filters.priceRange !== 'all' || filters.status !== 'all';
    
    if (hasClientFilters && filteredProducts.length > 0) {
      // Paginate from filtered results
      const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
      const endIndex = startIndex + PRODUCTS_PER_PAGE;
      const paginated = filteredProducts.slice(startIndex, endIndex);
      setDisplayedProducts(paginated);
    }
  }, [currentPage, filteredProducts, filters]);

  // Read URL parameters to set filters (only on initial mount)
  useEffect(() => {
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const sale = searchParams.get('sale');
    const priceRange = searchParams.get('priceRange');
    const page = searchParams.get('page');

    const updates: any = {};
    if (category) updates.category = decodeURIComponent(category);
    if (brand) updates.brands = [decodeURIComponent(brand)];
    if (sale === 'true') updates.status = 'sale';
    if (priceRange && ['under50', '50-100', '100-200', 'over200'].includes(priceRange)) {
      updates.priceRange = priceRange;
    }
    if (page) {
      const pageNum = parseInt(page);
      if (pageNum > 0) setCurrentPage(pageNum);
    }

    if (Object.keys(updates).length > 0) {
      setFilters(prev => ({ ...prev, ...updates }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const resetFilters = () => {
    setFilters({ category: 'all', priceRange: 'all', rating: 'all', status: 'all', brands: [], sortBy: 'createdAt', sortOrder: 'desc' });
    setCurrentPage(1);
  };

  const toggleBrand = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand],
    }));
    setCurrentPage(1); // Reset to page 1 when filters change
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

  const handleWishlist = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!localStorage.getItem('jwt_token')) {
      toast.error('Please login', { action: { label: 'Login', onClick: () => navigate('/login') } });
      return;
    }
    toggleWishlist({ productId: product.id, product });
  };

  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));

  // Loading state (only for initial load)
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading products</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-100 pt-24 pb-8">
      {/* Hero Section for Sale */}
      {filters.status === 'sale' && (
        <section className="relative bg-gradient-to-r from-gold/20 via-gold/10 to-transparent py-16 mb-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <span className="text-gold text-sm font-medium tracking-wider uppercase block mb-2">Special Offers</span>
              <h1 className="font-playfair text-4xl md:text-5xl font-bold text-black mb-4">Summer Sale</h1>
              <p className="text-gray-600 text-lg mb-6">Discover amazing discounts on our exclusive summer collection.</p>
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gold transition-colors"
              >
                View All Products <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">
          {filters.status === 'sale' ? 'All Products' : 'Shop All Products'}
        </h1>

        {/* Inline Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => { setFilters(prev => ({ ...prev, category: e.target.value })); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name} ({cat.count})</option>
                ))}
              </select>
            </div>

            {/* Multi-Select Brand Filter */}
            <div ref={brandDropdownRef} className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Brands ({filters.brands.length})
                {filters.category !== 'all' && (
                  <span className="text-xs text-gold ml-1">(in {filters.category})</span>
                )}
              </label>
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
                    {brands.length > 0 ? (
                      brands.map(brand => (
                        <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2">
                          <input type="checkbox" checked={filters.brands.includes(brand)} onChange={() => toggleBrand(brand)} className="w-4 h-4 rounded border-gray-300" />
                          <span className="text-sm">{brand}</span>
                          {filters.brands.includes(brand) && <Check className="w-3 h-3 ml-auto text-gold" />}
                        </label>
                      ))
                    ) : (
                      <div className="p-4">
                        {filters.category === 'all' ? (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2 px-2">
                              Browse by Category
                            </div>
                            <div className="space-y-1">
                              {categories.map(cat => (
                                <label key={cat.name} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                  <input 
                                    type="checkbox" 
                                    checked={filters.category === cat.name} 
                                    onChange={() => { 
                                      setFilters(prev => ({ ...prev, category: cat.name })); 
                                      setCurrentPage(1); 
                                    }} 
                                    className="w-4 h-4 rounded border-gray-300" 
                                  />
                                  <span className="text-sm">{cat.name} ({cat.count})</span>
                                  {filters.category === cat.name && <Check className="w-3 h-3 ml-auto text-gold" />}
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No brands found in {filters.category}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={filters.status} onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50">
                <option value="all">All Products</option>
                <option value="new">New Arrivals</option>
                <option value="sale">On Sale</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
              <select value={filters.priceRange} onChange={(e) => { setFilters(prev => ({ ...prev, priceRange: e.target.value })); setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50">
                <option value="all">All Prices</option>
                <option value="under50">Under {currencyService.getSymbol()}50</option>
                <option value="50-100">{currencyService.getSymbol()}50 - {currencyService.getSymbol()}100</option>
                <option value="100-200">{currencyService.getSymbol()}100 - {currencyService.getSymbol()}200</option>
                <option value="over200">Over {currencyService.getSymbol()}200</option>
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
            {totalProducts > 0 ? `Showing ${displayedProducts.length} of ${totalProducts} products (Page ${currentPage} of ${totalPages})` : 'No products found'}
          </p>
        </div>

        {displayedProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters to see more results.</p>
            <Button onClick={resetFilters} variant="outline">Reset Filters</Button>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-10">
              {displayedProducts.map((product: any) => (
                <div key={product.id} className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition">
                  <div className="relative aspect-[3/4] overflow-hidden cursor-pointer" onClick={() => navigate(getProductUrl(product))}>
                    <LazyImage src={toCDNUrl(product.image)} alt={product.name} productName={product.name} productId={product.id} className="w-full h-full" />
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.isNew && <span className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">New</span>}
                      {product.isSale && <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">Sale</span>}
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <button
                        onClick={(e) => handleWishlist(product, e)}
                        className="w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-white hover:bg-gold hover:text-white transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <button onClick={(e) => { e.stopPropagation(); toast.info('Add to cart coming soon'); }} className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors">
                        <ShoppingBag className="w-4 h-4" /> Add to Cart
                      </button>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-gray-500 text-xs uppercase mb-1">{product.category}</p>
                    <h3 onClick={() => navigate(getProductUrl(product))} className="font-semibold text-xs leading-[12px] mb-1 sm:mb-2 cursor-pointer hover:text-gold transition line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-gold fill-gold' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{currencyService.formatPrice(product.price)}</span>
                      {product.originalPrice && <span className="text-gray-400 line-through text-sm">{currencyService.formatPrice(product.originalPrice)}</span>}
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
