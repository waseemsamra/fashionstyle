import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X, ShoppingBag, Star } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

export default function Shop() {
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const [showFilters, setShowFilters] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    rating: 'all',
    status: 'all',
    brand: 'all',
  });

  useEffect(() => {
    api.listProducts().then(data => setAllProducts(data.items || []));
  }, []);

  const filteredProducts = allProducts.filter((product) => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.priceRange === 'under50' && product.price >= 50) return false;
    if (filters.priceRange === '50-100' && (product.price < 50 || product.price > 100)) return false;
    if (filters.priceRange === '100-200' && (product.price < 100 || product.price > 200)) return false;
    if (filters.priceRange === 'over200' && product.price <= 200) return false;
    if (filters.rating !== 'all' && product.rating && product.rating < Number(filters.rating)) return false;
    if (filters.status === 'new' && !product.isNew) return false;
    if (filters.status === 'sale' && !product.isSale) return false;
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
                        {['all', 'Bridal Wear', 'Casual Wear', 'Formal Wear', 'Accessories'].map((cat) => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              checked={filters.category === cat}
                              onChange={() => setFilters({ ...filters, category: cat })}
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
                              onChange={() => setFilters({ ...filters, priceRange: range.value })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{range.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Rating Filter */}
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-3">Rating</h3>
                      <div className="space-y-2">
                        {['all', '4', '4.5'].map((rating) => (
                          <label key={rating} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="rating"
                              checked={filters.rating === rating}
                              onChange={() => setFilters({ ...filters, rating })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">
                              {rating === 'all' ? 'All Ratings' : `${rating}+ Stars`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
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
                              onChange={() => setFilters({ ...filters, status: status.value })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{status.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Brand Filter */}
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-3">Brand</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="brand"
                            checked={filters.brand === 'all'}
                            onChange={() => setFilters({ ...filters, brand: 'all' })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">All Brands</span>
                        </label>
                        {['Al Karam', 'Gul Ahmed', 'Khaadi', 'Sapphire', 'Maria B', 'Asim Jofa', 'Sana Safinaz', 'Nishat Linen', 'Baroque', 'Elan'].map((brand) => (
                          <label key={brand} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="brand"
                              checked={filters.brand === brand}
                              onChange={() => setFilters({ ...filters, brand })}
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
              Showing {filteredProducts.length} of {allProducts.length} products
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
                >
                  <div 
                    className="relative aspect-[3/4] overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                      onClick={() => navigate(`/product/${product.id}`)}
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
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your filters.</p>
                <Button onClick={resetFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
