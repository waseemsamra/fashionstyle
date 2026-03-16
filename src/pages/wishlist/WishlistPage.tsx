import { useWishlist, useWishlistStats, useBatchWishlist } from '@/hooks/useWishlist';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Share2, 
  Grid3x3,
  List,
  ArrowDown,
  ArrowUp,
  Eye
} from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage';

export default function WishlistPage() {
  const { data: wishlist, isLoading, isGuest } = useWishlist();
  const stats = useWishlistStats();
  const batchMutation = useBatchWishlist();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  if (isLoading) {
    return <WishlistSkeleton />;
  }

  const sortedWishlist = [...(wishlist || [])].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'desc' 
        ? new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        : new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    }
    if (sortBy === 'price') {
      return sortOrder === 'desc'
        ? b.product.price - a.product.price
        : a.product.price - b.product.price;
    }
    if (sortBy === 'name') {
      return sortOrder === 'desc'
        ? b.product.name.localeCompare(a.product.name)
        : a.product.name.localeCompare(b.product.name);
    }
    return 0;
  });

  const handleSelectAll = () => {
    if (selectedItems.length === wishlist?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(wishlist?.map((item: any) => item.productId) || []);
    }
  };

  const handleBatchRemove = () => {
    if (selectedItems.length > 0) {
      batchMutation.mutate({
        productIds: selectedItems,
        action: 'remove'
      });
      setSelectedItems([]);
    }
  };

  const handleAddAllToCart = () => {
    // Add all selected to cart
    console.log('Add to cart:', selectedItems);
  };

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-500 fill-current" />
              My Wishlist
              {stats.totalItems > 0 && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  ({stats.totalItems} items)
                </span>
              )}
            </h1>
            
            {isGuest && (
              <p className="text-sm text-gray-600 mt-2">
                <Link to="/login" className="text-gold hover:underline">
                  Sign in
                </Link>{' '}
                to save your wishlist across devices
              </p>
            )}
          </div>

          {/* Stats Card */}
          {stats.totalItems > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Value</div>
              <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Avg. ${stats.averagePrice.toFixed(2)} per item
              </div>
            </div>
          )}
        </div>

        {wishlist?.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <>
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Selection */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === wishlist?.length}
                      onChange={handleSelectAll}
                      className="rounded text-gold"
                    />
                    <span className="text-sm">Select All</span>
                  </label>
                  
                  {selectedItems.length > 0 && (
                    <>
                      <span className="text-sm text-gray-500">
                        {selectedItems.length} selected
                      </span>
                      
                      <button
                        onClick={handleBatchRemove}
                        disabled={batchMutation.isPending}
                        className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                      
                      <button
                        onClick={handleAddAllToCart}
                        className="text-gold hover:text-gold/80 text-sm flex items-center gap-1"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </>
                  )}
                </div>

                {/* View Controls */}
                <div className="flex items-center gap-4">
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="date">Date Added</option>
                    <option value="price">Price</option>
                    <option value="name">Name</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {sortOrder === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* View Mode */}
                  <div className="flex border rounded">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-gold text-white' : 'hover:bg-gray-100'}`}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-gold text-white' : 'hover:bg-gray-100'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Category/Brand filters */}
              {(stats.categories.length > 0 || stats.brands.length > 0) && (
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                  {stats.categories.map(cat => (
                    <button
                      key={cat.name}
                      className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                  {stats.brands.map(brand => (
                    <button
                      key={brand.name}
                      className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      {brand.name} ({brand.count})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Wishlist Items */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedWishlist.map((item) => (
                  <WishlistGridItem 
                    key={item.id} 
                    item={item}
                    isSelected={selectedItems.includes(item.productId)}
                    onSelectChange={(checked: boolean) => {
                      setSelectedItems(prev =>
                        checked
                          ? [...prev, item.productId]
                          : prev.filter(id => id !== item.productId)
                      );
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedWishlist.map((item) => (
                  <WishlistListItem 
                    key={item.id} 
                    item={item}
                    isSelected={selectedItems.includes(item.productId)}
                    onSelectChange={(checked: boolean) => {
                      setSelectedItems(prev =>
                        checked
                          ? [...prev, item.productId]
                          : prev.filter(id => id !== item.productId)
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Grid Item Component
function WishlistGridItem({ item, isSelected, onSelectChange }: any) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Image */}
      <Link to={`/product/${item.productId}`} className="block relative aspect-square">
        <LazyImage
          src={item.product.image}
          alt={item.product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        
        {/* Sale Badge */}
        {item.product.onSale && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Sale
          </span>
        )}

        {/* Selection Checkbox */}
        <div className="absolute top-2 right-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectChange(e.target.checked)}
            className="w-5 h-5 rounded text-gold"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Quick Actions */}
        <div className={`
          absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4
          transition-opacity duration-300
          ${showActions ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => console.log('Quick view')}
              className="bg-white p-2 rounded-full hover:bg-gold hover:text-white transition"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => console.log('Add to cart')}
              className="bg-white p-2 rounded-full hover:bg-gold hover:text-white transition"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link to={`/product/${item.productId}`}>
          <h3 className="font-medium hover:text-gold transition line-clamp-2">
            {item.product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 mt-1">{item.product.brand}</p>
        
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-lg font-bold">${item.product.price}</span>
            {item.product.originalPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">
                ${item.product.originalPrice}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-xs ${
                i < item.product.rating ? 'text-yellow-400' : 'text-gray-300'
              }`}>★</span>
            ))}
            <span className="text-xs text-gray-500 ml-1">
              ({item.product.reviewCount})
            </span>
          </div>
        </div>

        {/* In Stock Status */}
        {item.product.inStock ? (
          <p className="text-xs text-green-600 mt-2">In Stock</p>
        ) : (
          <p className="text-xs text-red-500 mt-2">Out of Stock</p>
        )}
      </div>
    </div>
  );
}

// List Item Component
function WishlistListItem({ item, isSelected, onSelectChange }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
      <div className="flex gap-4">
        {/* Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectChange(e.target.checked)}
            className="w-5 h-5 rounded text-gold"
          />
        </div>

        {/* Image */}
        <Link to={`/product/${item.productId}`} className="w-24 h-24 flex-shrink-0">
          <LazyImage
            src={item.product.image}
            alt={item.product.name}
            className="w-full h-full object-cover rounded"
          />
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <Link to={`/product/${item.productId}`}>
                <h3 className="font-medium hover:text-gold transition">
                  {item.product.name}
                </h3>
              </Link>
              <p className="text-sm text-gray-500">{item.product.brand}</p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {item.product.description}
              </p>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold">${item.product.price}</div>
              {item.product.originalPrice && (
                <div className="text-sm text-gray-400 line-through">
                  ${item.product.originalPrice}
                </div>
              )}
              <div className="flex items-center gap-1 mt-1 justify-end">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xs ${
                    i < item.product.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}>★</span>
                ))}
                <span className="text-xs text-gray-500 ml-1">
                  ({item.product.reviewCount})
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => console.log('Add to cart')}
              className="text-sm bg-gold text-white px-4 py-2 rounded hover:bg-gold/90 transition"
            >
              Add to Cart
            </button>
            
            <button
              onClick={() => console.log('Share')}
              className="text-sm text-gray-600 hover:text-gold transition flex items-center gap-1"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <span className="text-xs text-gray-500">
              Added {new Date(item.addedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State
function EmptyWishlist() {
  return (
    <div className="text-center py-16 bg-white rounded-lg shadow">
      <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
      <p className="text-gray-600 mb-8">
        Save items you love to your wishlist and they'll appear here
      </p>
      <Link
        to="/"
        className="inline-block bg-gold text-white px-8 py-3 rounded-lg hover:bg-gold/90 transition"
      >
        Start Shopping
      </Link>
    </div>
  );
}

// Skeleton Loader
function WishlistSkeleton() {
  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <div className="aspect-square bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-1/4 mt-4 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
