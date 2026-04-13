import { toCDNUrl } from '@/utils/productImage';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, ShoppingBag, Star, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useBrands } from '@/hooks/useBrands';
import { useCollection } from '@/hooks/useCollection';
import type { Brand } from '@/services/brandsService';
import { getProductUrl } from '@/utils/productUrl';
import LazyImage from '@/components/ui/LazyImage';
// import { FixedSizeList as List } from 'react-window'; // Temporarily disabled

// const ITEMS_PER_PAGE = 50; // Not needed - showing all products in grid
// const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod'; // Not needed - using productService

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
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [currentPage, _setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
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

  // Fetch ALL products from server and display in grid with progress
  const fetchAllProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setError(null);
    
    if (isSaleFilter) {
      setAllProducts(saleProducts || []);
      setTotalProducts(saleProducts?.length || 0);
      setIsLoadingProducts(false);
      return;
    }

    try {
      console.log('📦 Loading all products with progress tracking...');

      // Import and use loadAllProducts from productService
      const { loadAllProducts } = await import('@/services/productService');
      
      // Build filters object to pass to API
      const apiFilters: any = {};
      if (filters.brand && filters.brand !== 'all') apiFilters.brand = filters.brand;
      if (filters.category && filters.category !== 'all') apiFilters.category = filters.category;
      if (filters.status === 'sale') apiFilters.isSale = true;
      if (filters.status === 'new') apiFilters.isNew = true;
      
      // Pass filters to loadAllProducts - API will handle filtering server-side
      const products = await loadAllProducts(apiFilters, (loaded, total, _hasMore) => {
        setLoadingProgress({ loaded, total });
        console.log(`📊 Progress: ${loaded}/${total} (${Math.round(loaded / total * 100)}%)`);
      });
      
      // Products are already filtered by the API - no client-side filtering needed
      setAllProducts(products);
      setTotalProducts(products.length);
      console.log(`✅ Loaded ${products.length} products total`);
    } catch (err) {
      console.error('❌ Failed to fetch products:', err);
      setError(err as Error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [isSaleFilter, saleProducts, filters.brand, filters.category, filters.status]);

  // Fetch products when filters change
  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

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
      console.log('📍 Applied URL filters:', updates);
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentPage]);

  // allProducts contains ALL products - displayed in grid
  const paginatedProducts = allProducts;

  // Loading state with progress bar
  if (isLoadingProducts) {
    const progressPercent = loadingProgress.total > 0 
      ? Math.round((loadingProgress.loaded / loadingProgress.total) * 100) 
      : 0;
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Products...</h3>
            {loadingProgress.total > 0 && (
              <p className="text-gray-500 mb-4">
                {loadingProgress.loaded} of {loadingProgress.total} products ({progressPercent}%)
              </p>
            )}
          </div>
          <div className="w-64 mx-auto bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-gold h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-gray-600">Please wait...</p>
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
  };

  return (
    <div className="min-h-screen bg-beige-100 pt-24 pb-8">
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
        {/* Header with title */}
        <h1 className="text-3xl font-bold mb-6">
          {filters.status === 'sale' ? 'All Products' : 'Shop All Products'}
        </h1>

        {/* Inline Filters Bar - Always visible at top */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select value={filters.category} onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50">
                <option value="all">All Categories</option>
                {categories.filter(c => c !== 'all').map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
              <select value={filters.brand} onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50">
                <option value="all">All Brands</option>
                {brands.filter(b => b !== 'all').slice(0, 50).map(brand => (<option key={brand} value={brand}>{brand}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50">
                <option value="all">All Products</option>
                <option value="new">New Arrivals</option>
                <option value="sale">On Sale</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
              <select value={filters.priceRange} onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50">
                <option value="all">All Prices</option>
                <option value="under50">Under $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-200">$100 - $200</option>
                <option value="over200">Over $200</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={resetFilters} variant="outline" className="w-full h-10 text-sm hover:bg-gray-50 hover:border-gold">
                <X className="w-4 h-4 mr-1" /> Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Products Grid */}
          <div className="flex-1">
            <p className="text-gray-600 mb-6">
              {paginatedProducts.length > 0
                ? `Showing ${paginatedProducts.length} of ${totalProducts} products`
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
