import { toCDNUrl } from '@/utils/productImage';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, ShoppingBag, Star, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useBrands } from '@/hooks/useBrands';
import { useCollection } from '@/hooks/useCollection';
import type { Brand } from '@/services/brandsService';
import { getProductUrl } from '@/utils/productUrl';
import LazyImage from '@/components/ui/LazyImage';

const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

// Fetch categories directly from API
async function fetchCategories(): Promise<{name: string, count: number}[]> {
  try {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories || [];
  } catch {
    return [];
  }
}

export default function Shop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [_loadingProgress, _setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    rating: 'all',
    status: 'all',
    brands: [] as string[], // Multi-select brands
  });
  const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // Check if we're filtering by sale - use collection instead of all products
  const isSaleFilter = searchParams.get('sale') === 'true';
  const { products: saleProducts, loading: _saleLoading } = useCollection('summerSale');

  // Fetch brands from API using hook
  const { brands: brandsData, loading: brandsLoading } = useBrands();
  const brands = useMemo(() => 
    brandsData?.map((b: Brand) => b.name).filter(Boolean) || [],
  [brandsData]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories().then(cats => {
      setCategories(cats);
      console.log('📂 Loaded categories:', cats.length);
    });
  }, []);

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

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setError(null);

    if (isSaleFilter) {
      setAllProducts(saleProducts || []);
      setTotalProducts(saleProducts?.length || 0);
      setIsLoadingProducts(false);
      return;
    }

    try {
      console.log('📦 Fetching products with filters:', filters);

      // Build query params
      const params = new URLSearchParams();
      params.append('limit', '500');
      params.append('page', '1');
      
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      if (filters.brands.length > 0) {
        // For multiple brands, we'll fetch and filter client-side
        params.append('limit', '1000');
      }
      if (filters.status === 'sale') params.append('isSale', 'true');
      if (filters.status === 'new') params.append('isNew', 'true');

      const url = `${API_URL}/products?${params.toString()}`;
      console.log('📡 Fetching:', url);

      const response = await fetch(url, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      let products = data.items || [];
      
      // Filter by brands client-side if multiple brands selected
      if (filters.brands.length > 0) {
        const brandLower = filters.brands.map(b => b.toLowerCase());
        products = products.filter((p: any) => 
          p.brand && brandLower.includes(p.brand.toLowerCase())
        );
        console.log(`🏷️ Filtered by ${filters.brands.length} brands: ${products.length} products`);
      }

      // Filter by price range client-side
      if (filters.priceRange !== 'all') {
        products = products.filter((p: any) => {
          const price = Number(p.price) || 0;
          switch (filters.priceRange) {
            case 'under50': return price < 50;
            case '50-100': return price >= 50 && price <= 100;
            case '100-200': return price >= 100 && price <= 200;
            case 'over200': return price > 200;
            default: return true;
          }
        });
      }

      setAllProducts(products);
      setTotalProducts(products.length);
      console.log(`✅ Loaded ${products.length} products`);
    } catch (err) {
      console.error('❌ Failed to fetch products:', err);
      setError(err as Error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [isSaleFilter, saleProducts, filters.category, filters.brands, filters.status, filters.priceRange]);

  // Auto-fetch when filters change (NO page reload needed!)
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Read URL parameters to set filters
  useEffect(() => {
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const sale = searchParams.get('sale');
    const priceRange = searchParams.get('priceRange');

    const updates: any = {};
    if (category) updates.category = decodeURIComponent(category);
    if (brand) updates.brands = [decodeURIComponent(brand)];
    if (sale === 'true') updates.status = 'sale';
    if (priceRange && ['under50', '50-100', '100-200', 'over200'].includes(priceRange)) {
      updates.priceRange = priceRange;
    }

    if (Object.keys(updates).length > 0) {
      setFilters(prev => ({ ...prev, ...updates }));
      console.log('📍 Applied URL filters:', updates);
    }
  }, [searchParams]);

  const resetFilters = () => {
    setFilters({
      category: 'all',
      priceRange: 'all',
      rating: 'all',
      status: 'all',
      brands: [],
    });
  };

  const toggleBrand = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  // Loading state with progress bar
  if (isLoadingProducts) {
    const progressPercent = _loadingProgress.total > 0 
      ? Math.round((_loadingProgress.loaded / _loadingProgress.total) * 100) 
      : 0;
    
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="mb-4">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Products...</h3>
            {_loadingProgress.total > 0 && (
              <p className="text-gray-500 mb-4">
                {_loadingProgress.loaded} of {_loadingProgress.total} products ({progressPercent}%)
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
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">
          {filters.status === 'sale' ? 'All Products' : 'Shop All Products'}
        </h1>

        {/* Inline Filters Bar - Always visible at top */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50"
              >
                <option value="all">All Categories ({totalProducts})</option>
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-Select Brand Filter */}
            <div ref={brandDropdownRef} className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Brands ({filters.brands.length} selected)
              </label>
              <button
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:border-gold/50 bg-white hover:border-gold/50 transition"
              >
                <span className="truncate">
                  {filters.brands.length === 0 ? 'All Brands' : filters.brands.join(', ')}
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0 ml-1" />
              </button>
              
              {showBrandDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filters.brands.length === 0}
                        onChange={() => setFilters(prev => ({ ...prev, brands: [] }))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">All Brands</span>
                    </label>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {brandsLoading ? (
                      <div className="p-4 text-center text-sm text-gray-500">Loading brands...</div>
                    ) : (
                      brands.map(brand => (
                        <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2">
                          <input
                            type="checkbox"
                            checked={filters.brands.includes(brand)}
                            onChange={() => toggleBrand(brand)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm">{brand}</span>
                          {filters.brands.includes(brand) && <Check className="w-3 h-3 ml-auto text-gold" />}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50"
              >
                <option value="all">All Products</option>
                <option value="new">New Arrivals</option>
                <option value="sale">On Sale</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold/50"
              >
                <option value="all">All Prices</option>
                <option value="under50">Under $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-200">$100 - $200</option>
                <option value="over200">Over $200</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <Button
                onClick={resetFilters}
                variant="outline"
                className="w-full h-10 text-sm hover:bg-gray-50 hover:border-gold"
              >
                <X className="w-4 h-4 mr-1" /> Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Products Grid */}
          <div className="flex-1">
            <p className="text-gray-600 mb-6">
              {allProducts.length > 0
                ? `Showing ${allProducts.length} of ${totalProducts} products`
                : 'No products found'}
            </p>

            {allProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters to see more results.</p>
                <Button onClick={resetFilters} variant="outline">Reset Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allProducts.map((product) => (
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
                          <span className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">New</span>
                        )}
                        {product.isSale && (
                          <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">Sale</span>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        <button
                          onClick={(e) => { e.stopPropagation(); toast.info('Add to cart coming soon'); }}
                          className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" /> Add to Cart
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
                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 0) ? 'text-gold fill-gold' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-gray-400 line-through text-sm">${product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
