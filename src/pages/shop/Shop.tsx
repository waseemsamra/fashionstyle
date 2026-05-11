import { toCDNUrl } from '@/utils/productImage';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Star, ChevronRight, ChevronDown, ChevronLeft, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useToggleWishlist } from '@/hooks/useWishlist';
import { getProductUrl } from '@/utils/productUrl';
import LazyImage from '@/components/ui/LazyImage';
import { currencyService } from '@/services/currencyService';

import { API_CONFIG } from '../../config/api';
const API_URL = API_CONFIG.baseApiUrl;
const PRODUCTS_PER_PAGE = 50;

// Fetch categories directly from API
async function fetchCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
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
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
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

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  // Compute brands for selected category
  const brands = useMemo(() => {
    if (filters.category === 'all') return allBrands;
    return [...new Set<string>(
      allProducts.filter(p => p.category === filters.category).map(p => p.brand).filter(Boolean)
    )].sort();
  }, [allBrands, allProducts, filters.category]);

  // Simple reliable pagination with client-side filtering
  const fetchProducts = async () => {
    setIsFiltering(true);
    
    try {
      console.log(`📡 Fetching products for page ${currentPage} with filters:`, filters);
      
      // Always fetch a large batch for reliable client-side pagination
      const params = new URLSearchParams();
      params.append('limit', '1000'); // Fetch enough for multiple pages
      
      // Apply server-side filters if possible (may improve performance)
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
      
      const url = `${API_URL}/products?${params.toString()}`;
      console.log('📡 API URL:', url);
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch products`);
      const data = await res.json();
      
      let products = data.items || [];
      console.log(`📊 Fetched ${products.length} products from API`);
      
      // Apply client-side filtering for reliability
      if (filters.category !== 'all') {
        const beforeCount = products.length;
        console.log(`🏷️ Category filter details:`);
        console.log(`  - Selected category: "${filters.category}"`);
        console.log(`  - Sample product categories:`, products.slice(0, 5).map((p: any) => ({ 
          id: p.id, 
          name: p.name, 
          category: p.category,
          categoryType: typeof p.category
        })));
        
        products = products.filter((p: any) => {
          const productCategory = p.category?.toLowerCase();
          const categoryName = p.category?.name?.toLowerCase();
          const selectedCategory = filters.category.toLowerCase();
          
          const matches = productCategory === selectedCategory || categoryName === selectedCategory;
          
          if (beforeCount <= 10) { // Only log details for small result sets
            console.log(`    - Product "${p.name}": category="${p.category}" (${typeof p.category}) -> ${matches ? '✅' : '❌'}`);
          }
          
          return matches;
        });
        
        console.log(`🏷️ Category filter result: ${beforeCount} → ${products.length} products`);
        if (products.length === 0) {
          console.log(`⚠️ No products found for category "${filters.category}". Available categories:`, [...new Set(products.map((p: any) => p.category).filter(Boolean))]);
        }
      }
      
      if (filters.brands.length > 0) {
        const beforeCount = products.length;
        products = products.filter((p: any) => filters.brands.includes(p.brand));
        console.log(`🏢 Brand filter: ${beforeCount} → ${products.length} products`);
      }
      
      if (filters.priceRange !== 'all') {
        const beforeCount = products.length;
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
        console.log(`💰 Price filter: ${beforeCount} → ${products.length} products`);
      }
      
      if (filters.status === 'sale') {
        const beforeCount = products.length;
        products = products.filter((p: any) => p.isSale === true);
        console.log(`🏷️ Sale filter: ${beforeCount} → ${products.length} products`);
      }
      if (filters.status === 'new') {
        const beforeCount = products.length;
        products = products.filter((p: any) => p.isNew === true);
        console.log(`🆕 New filter: ${beforeCount} → ${products.length} products`);
      }
      
      // Apply client-side sorting
      if (filters.sortBy) {
        const beforeCount = products.length;
        products.sort((a: any, b: any) => {
          let result = 0;
          switch (filters.sortBy) {
            case 'price':
              result = (a.price || 0) - (b.price || 0);
              break;
            case 'name':
              result = (a.name || '').localeCompare(b.name || '');
              break;
            case 'createdAt':
            default:
              result = 0; // Keep API order
              break;
          }
          return filters.sortOrder === 'desc' ? -result : result;
        });
        console.log(`📊 Sort: ${beforeCount} products sorted by ${filters.sortBy} ${filters.sortOrder}`);
      }
      
      // Apply client-side pagination - ALWAYS for consistency
      const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
      const endIndex = startIndex + PRODUCTS_PER_PAGE;
      const paginatedProducts = products.slice(startIndex, endIndex);
      
      console.log(`📄 Pagination:`);
      console.log(`  - Page: ${currentPage}`);
      console.log(`  - Start: ${startIndex}, End: ${endIndex}`);
      console.log(`  - Total products: ${products.length}`);
      console.log(`  - Products on this page: ${paginatedProducts.length}`);
      console.log(`  - First 3 IDs:`, paginatedProducts.slice(0, 3).map((p: any) => ({ id: p.id, name: p.name })));
      
      setAllProducts(paginatedProducts);
      setTotalProducts(products.length);
      
    } catch (err) {
      console.error('❌ API Error:', err);
      setError(err as Error);
    } finally {
      setIsFiltering(false);
    }
  };

  // Filter changes now handle page reset directly in their handlers

  // Fetch products when page or filters change
  useEffect(() => {
    console.log('🌐 Fetching products for page', currentPage, 'with filters:', filters);
    fetchProducts();
  }, [currentPage, filters]);

  // Fetch ALL products once on mount, extract brands
  useEffect(() => {
    fetch(`${API_URL}/products?limit=1000`)
      .then(r => r.json())
      .then(data => {
        const products = data.items || [];
        const unique = [...new Set<string>(products.map((p: any) => p.brand).filter(Boolean))].sort() as string[];
        setAllBrands(unique);
        setAllProducts(products.slice(0, PRODUCTS_PER_PAGE)); // Show first page
        setTotalProducts(products.length);
      })
      .catch(err => console.error('Failed to fetch brands:', err));
  }, []);

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
    console.log('🔄 Resetting all filters to default values');
    setFilters({ 
      category: 'all', 
      priceRange: 'all', 
      rating: 'all', 
      status: 'all', 
      brands: [], 
      sortBy: 'createdAt', 
      sortOrder: 'desc' 
    });
    setCurrentPage(1);
    console.log('✅ Filters reset complete');
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
    setIsFiltering(true); // Show loading state during page change
    setCurrentPage(page);
    setSearchParams(prev => {
      if (page > 1) prev.set('page', String(page));
      else prev.delete('page');
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWishlist = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }
    toggleWishlist(product);
    toast.success('Added to wishlist');
  };

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBrandDropdown]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => setError(null)} className="mt-4">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gold/10 via-white to-gold/5 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Shop</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover our exclusive collection of premium fashion pieces
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
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

            {/* Brand Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
              <div className="relative" ref={brandDropdownRef}>
                <button
                  onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50 text-left flex items-center justify-between"
                >
                  <span className="flex-1">
                    {filters.brands.length > 0 ? `${filters.brands.length} Selected` : 'All Brands'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showBrandDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <button
                        onClick={() => { setFilters(prev => ({ ...prev, brands: [] })); setCurrentPage(1); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        <span>All Brands</span>
                      </button>
                      {brands.map(brand => (
                        <label key={brand} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.brands.includes(brand)}
                            onChange={() => toggleBrand(brand)}
                            className="rounded text-gold focus:ring-gold"
                          />
                          <span className="text-sm">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => { setFilters(prev => ({ ...prev, priceRange: e.target.value })); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50"
              >
                <option value="all">All Prices</option>
                <option value="under50">Under {currencyService.getSymbol()}50</option>
                <option value="50-100">{currencyService.getSymbol()}50 - {currencyService.getSymbol()}100</option>
                <option value="100-200">{currencyService.getSymbol()}100 - {currencyService.getSymbol()}200</option>
                <option value="over200">Over {currencyService.getSymbol()}200</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50"
              >
                <option value="all">All Status</option>
                <option value="sale">Sale</option>
                <option value="new">New</option>
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
            {totalProducts > 0 ? `Showing ${allProducts.length} of ${totalProducts} products (Page ${currentPage} of ${totalPages})` : 'No products found'}
          </p>
          {isFiltering && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gold" />
              <span>Updating...</span>
            </div>
          )}
        </div>

        {allProducts.length === 0 ? (
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
              {allProducts.map((product: any) => (
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
                      disabled={isFiltering}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-gold text-white hover:bg-gold/90'
                          : 'border border-gray-300 hover:bg-gray-50 hover:border-gold'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isFiltering && currentPage === page ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mx-auto" />
                      ) : (
                        page
                      )}
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
