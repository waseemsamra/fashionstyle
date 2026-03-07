import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X, ShoppingBag, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAllProducts } from '@/hooks/useProducts';
import { getProductUrl } from '@/utils/productUrl';
import LazyImage from '@/components/ui/LazyImage';

export default function Shop() {
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const [showFilters, setShowFilters] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    rating: 'all',
    status: 'all',
    brand: 'all',
  });

  const normalize = (value: unknown) =>
    String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const categories = [
    'all',
    ...Array.from(
      new Set(
        allProducts
          .map((p) => p?.category)
          .filter(Boolean)
      )
    ),
  ];

  const brands = [
    'all',
    ...Array.from(
      new Set(
        allProducts
          .map((p) => p?.brand)
          .filter(Boolean)
      )
    ),
  ];

  const hasRatingData = allProducts.some((p) => typeof p?.rating === 'number');
  const hasStatusData = allProducts.some(
    (p) => typeof p?.isNew === 'boolean' || typeof p?.isSale === 'boolean'
  );

  // Use React Query with caching
  const { data: productsData, isLoading, error } = useAllProducts();

  useEffect(() => {
    console.log('Shop: productsData changed:', productsData?.length);
    if (productsData && Array.isArray(productsData)) {
      setAllProducts(productsData);
    }
  }, [productsData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Show error state
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

  const filteredProducts = allProducts.filter((product) => {
    const productPrice = Number(product.price ?? 0);
    const productRating = typeof product.rating === 'number' ? product.rating : null;

    if (
      filters.category !== 'all' &&
      normalize(product.category) !== normalize(filters.category)
    ) {
      return false;
    }

    if (
      filters.brand !== 'all' &&
      normalize(product.brand) !== normalize(filters.brand)
    ) {
      return false;
    }

    if (filters.priceRange === 'under50' && productPrice >= 50) return false;
    if (filters.priceRange === '50-100' && (productPrice < 50 || productPrice > 100)) return false;
    if (filters.priceRange === '100-200' && (productPrice < 100 || productPrice > 200)) return false;
    if (filters.priceRange === 'over200' && productPrice <= 200) return false;

    if (
      filters.rating !== 'all' &&
      (productRating === null || productRating < Number(filters.rating))
    ) {
      return false;
    }

    if (filters.status === 'new' && product.isNew !== true) return false;
    if (filters.status === 'sale' && product.isSale !== true) return false;

    return true;
  });

  const handleAddToCart = (product: typeof allProducts[0]) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`, {
      action: {
        label: 'View Cart',
        onClick: () => setIsCartOpen(true),
      },
    });
  };

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
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Shop All Products</h1>
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
              {filteredProducts.length > 0 
                ? `Showing ${filteredProducts.length} of ${allProducts.length} products`
                : 'No products found'}
            </p>
            
            {filteredProducts.length === 0 ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
                >
                  <div
                    className="relative aspect-[3/4] overflow-hidden cursor-pointer"
                    onClick={() => navigate(getProductUrl(product))}
                  >
                    <LazyImage
                      src={product.image}
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
                          handleAddToCart(product);
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
