import { toCDNUrl } from '@/utils/productImage';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X, ShoppingBag, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useBrands } from '@/hooks/useBrands';
import { useCollection } from '@/hooks/useCollection';
import type { Brand } from '@/services/brandsService';
import { getProductUrl } from '@/utils/productUrl';
import LazyImage from '@/components/ui/LazyImage';
// import { FixedSizeList as List } from 'react-window'; // Temporarily disabled

const ITEMS_PER_PAGE = 50;
const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

// Infinite scroll hook - loads more products when user scrolls to bottom
// Currently unused but available for future infinite scroll mode
/*
function useInfiniteProducts(isSaleFilter: boolean, saleProducts: any[], filters: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // Reset when filters change
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [filters.category, filters.brand, filters.status, filters.priceRange]);

  // Load products for current page
  useEffect(() => {
    if (isSaleFilter) {
      setProducts(saleProducts || []);
      setTotalProducts(saleProducts?.length || 0);
      setHasMore(false);
      setIsLoading(false);
      return;
    }

    const loadPage = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append('limit', String(ITEMS_PER_PAGE));
        params.append('page', String(page));
        if (filters.category !== 'all') params.append('category', filters.category);
        if (filters.brand !== 'all') params.append('brand', filters.brand);
        if (filters.status === 'sale') params.append('isSale', 'true');
        if (filters.status === 'new') params.append('isNew', 'true');

        const url = `${API_URL}/products?${params.toString()}`;
        console.log(`📡 Fetching shop page ${page}:`, url);

        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const items = data.items || [];
        console.log(`📦 Page ${page}: received ${items.length} products (total available: ${data.total})`);

        setProducts(prev => page === 1 ? items : [...prev, ...items]);
        setTotalProducts(data.total || 0);

        // If we got fewer items than limit, no more pages
        if (items.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }
      } catch (err) {
        console.error('❌ Failed to fetch products:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [isSaleFilter, saleProducts, page, filters.category, filters.brand, filters.status]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          console.log('📜 Load more triggered - page', page + 1);
          setPage(prev => prev + 1);
        }
      },
      { rootMargin: '200px' } // Start loading 200px before reaching bottom
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, page]);

  return { products, totalProducts, isLoading, hasMore, error, loadMoreRef: observerRef, setPage };
}
*/

export default function Shop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    rating: 'all',
    status: 'all',
    brand: 'all',
  });

  // Check if we're filtering by sale - use collection instead of all products
  const isSaleFilter = searchParams.get('sale') === 'true';
  const { products: saleProducts, loading: _saleLoading } = useCollection('summerSale');

  // Fetch brands from API using hook
  const { brands: brandsData } = useBrands();

  const categories = useMemo(() => [
    'all',
    ...Array.from(
      new Set(
        allProducts
          .map((p) => p?.category)
          .filter(Boolean)
      )
    ),
  ], [allProducts]);

  // Use brands from API hook instead of extracting from products
  const brands = useMemo(() => [
    'all',
    ...(brandsData?.map((b: Brand) => b.name).filter(Boolean) || []),
  ], [brandsData]);

  // Fetch products for current page from server (50 per page)
  const fetchProductsPage = useCallback(async (page: number) => {
    setIsLoadingProducts(true);
    setError(null);
    try {
      console.log(`📦 Fetching shop page ${page}...`);
      
      let url: string;
      if (isSaleFilter) {
        // For sale filter, use collection products (already loaded)
        setAllProducts(saleProducts || []);
        setTotalProducts(saleProducts?.length || 0);
        setIsLoadingProducts(false);
        return;
      }
      
      // Build query with filters
      const params = new URLSearchParams();
      params.append('limit', String(ITEMS_PER_PAGE));
      params.append('page', String(page));
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.brand !== 'all') params.append('brand', filters.brand);
      if (filters.status === 'sale') params.append('isSale', 'true');
      if (filters.status === 'new') params.append('isNew', 'true');
      
      url = `${API_URL}/products?${params.toString()}`;
      console.log('📡 Fetching:', url);
      
      const response = await fetch(url, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      const items = data.items || [];
      console.log(`📦 Page ${page}: received ${items.length} products (total: ${data.total})`);
      
      setAllProducts(items);
      setTotalProducts(data.total || items.length);
    } catch (err) {
      console.error('❌ Failed to fetch products:', err);
      setError(err as Error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [isSaleFilter, saleProducts, filters.category, filters.brand, filters.status]);

  // Fetch products when page or filters change
  useEffect(() => {
    fetchProductsPage(currentPage);
  }, [fetchProductsPage, currentPage]);

  // Read URL parameters to set filters
  useEffect(() => {
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const sale = searchParams.get('sale');
    const priceRange = searchParams.get('priceRange');

    const updates: any = {};
    if (category) updates.category = decodeURIComponent(category);
    if (brand) updates.brand = decodeURIComponent(brand);
    if (sale === 'true') updates.status = 'sale';
    if (priceRange && ['under50', '50-100', '100-200', 'over200'].includes(priceRange)) {
      updates.priceRange = priceRange;
    }

    if (Object.keys(updates).length > 0) {
      setFilters(prev => ({ ...prev, ...updates }));
      setCurrentPage(1); // Reset to page 1 when filters change
      console.log('📍 Applied URL filters:', updates);
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentPage]);

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  // allProducts is already paginated from server
  const paginatedProducts = allProducts;

  const hasRatingData = allProducts.some((p) => typeof p?.rating === 'number');
  const hasStatusData = allProducts.some(
    (p) => typeof p?.isNew === 'boolean' || typeof p?.isSale === 'boolean'
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  };

  // Loading state
  if (isLoadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('Shop error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Failed to Load Products</h3>
          <p className="text-gray-500 mb-6">Please try refreshing the page</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  const resetFilters = () => {
    setFilters({
      category: 'all',
      priceRange: 'all',
      rating: 'all',
      status: 'all',
      brand: 'all',
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Hero Section for Sale */}
      {filters.status === 'sale' && (
        <section className="relative bg-gradient-to-r from-gold/20 via-gold/10 to-transparent py-16 mb-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <span className="text-gold text-sm font-medium tracking-wider uppercase block mb-2">Special Offers</span>
              <h1 className="font-playfair text-4xl md:text-5xl font-bold text-black mb-4">Summer Sale</h1>
              <p className="text-gray-600 text-lg mb-6">Discover amazing discounts on our exclusive summer collection. Limited-time offers on your favorite designer pieces.</p>
              <button
                onClick={() => {
                  setFilters(prev => ({ ...prev, status: 'all' }));
                  navigate('/shop');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gold transition-colors"
              >
                View All Products
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            {filters.status === 'sale' ? 'All Products' : 'Shop All Products'}
          </h1>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="hover:bg-gold hover:text-white hover:border-gold transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="relative flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowFilters(false)}
              />
              <div className="fixed top-0 left-0 bottom-0 z-50 w-80 bg-white shadow-2xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Filters</h2>
                    <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Category Filter */}
                    <div>
                      <h3 className="font-semibold mb-3">Category</h3>
                      <div className="space-y-2">
                        {categories.map((cat) => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              checked={filters.category === cat}
                              onChange={() => setFilters((prev) => ({ ...prev, category: cat }))}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{cat === 'all' ? 'All Categories' : cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-3">Price Range</h3>
                      <div className="space-y-2">
                        {[
                          { value: 'all', label: 'All Prices' },
                          { value: 'under50', label: 'Under $50' },
                          { value: '50-100', label: '$50 - $100' },
                          { value: '100-200', label: '$100 - $200' },
                          { value: 'over200', label: 'Over $200' },
                        ].map((range) => (
                          <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="priceRange"
                              checked={filters.priceRange === range.value}
                              onChange={() => setFilters((prev) => ({ ...prev, priceRange: range.value }))}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{range.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {hasRatingData && (
                      <div className="border-t pt-6">
                        <h3 className="font-semibold mb-3">Rating</h3>
                        <div className="space-y-2">
                          {['all', '4', '4.5'].map((rating) => (
                            <label key={rating} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="rating"
                                checked={filters.rating === rating}
                                onChange={() => setFilters((prev) => ({ ...prev, rating }))}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">
                                {rating === 'all' ? 'All Ratings' : `${rating}+ Stars`}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasStatusData && (
                      <div className="border-t pt-6">
                        <h3 className="font-semibold mb-3">Status</h3>
                        <div className="space-y-2">
                          {[
                            { value: 'all', label: 'All Items' },
                            { value: 'new', label: 'New Arrivals' },
                            { value: 'sale', label: 'On Sale' },
                          ].map((status) => (
                            <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="status"
                                checked={filters.status === status.value}
                                onChange={() =>
                                  setFilters((prev) => ({ ...prev, status: status.value }))
                                }
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{status.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brand Filter */}
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-3">Brand</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {brands.map((brand) => (
                          <label key={brand} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="brand"
                              checked={filters.brand === brand}
                              onChange={() => setFilters((prev) => ({ ...prev, brand }))}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{brand}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Button onClick={resetFilters} variant="outline" className="w-full">
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            <p className="text-gray-600 mb-6">
              {paginatedProducts.length > 0
                ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)} of ${totalProducts} products (Page ${currentPage} of ${totalPages || 1})`
                : 'No products found'}
            </p>

            {paginatedProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Found</h3>
                <p className="text-gray-500 mb-6">
                  {allProducts.length === 0
                    ? "We're currently loading our collection. Please refresh the page."
                    : "Try adjusting your filters to see more results."}
                </p>
                {allProducts.length > 0 && (
                  <Button onClick={resetFilters} variant="outline">
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
                >
                  <div
                    className="relative aspect-[3/4] overflow-hidden cursor-pointer"
                    onClick={() => navigate(getProductUrl(product))}
                  >
                    <LazyImage
                      src={toCDNUrl(product.image)}
                      alt={product.name}
                      productName={product.name}
                      productId={product.id}
                      className="w-full h-full"
                    />
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
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info('Add to cart coming soon');
                        }}
                        className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-500 text-xs uppercase mb-1">{product.category}</p>
                    <h3
                      onClick={() => navigate(getProductUrl(product))}
                      className="font-semibold text-lg mb-2 cursor-pointer hover:text-gold transition"
                    >
                      {product.name}
                    </h3>
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
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      const showEllipsis =
                        (page === currentPage - 2 && page > 1) ||
                        (page === currentPage + 2 && page < totalPages);

                      if (!showPage && !showEllipsis) return null;

                      if (showEllipsis) {
                        return (
                          <span
                            key={`ellipsis-${page}`}
                            className="px-2 py-2 text-gray-500"
                          >
                            ...
                          </span>
                        );
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-colors ${
                            page === currentPage
                              ? 'bg-gold text-white hover:bg-gold/90'
                              : 'border border-gray-300 hover:bg-gray-50 hover:border-gold'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gold"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Page Info */}
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 
// Virtualized Product Grid Component - for future use with 40K+ products
// Requires: npm install react-window
function VirtualizedProductGrid({ 
  products, 
  onProductClick, 
  onAddToCart 
}: { 
  products: any[]; 
  onProductClick: (product: any) => void;
  onAddToCart: () => void;
}) {
  // Implementation ready when react-window is properly installed
}
*/
