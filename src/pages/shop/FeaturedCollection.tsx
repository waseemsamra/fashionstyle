import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, Star } from 'lucide-react';
import { toast } from 'sonner';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';
import { useCollection } from '@/hooks/useCollection';
import { useToggleWishlist } from '@/hooks/useWishlist';

export default function FeaturedCollection() {
  const navigate = useNavigate();
  const { toggleWishlist } = useToggleWishlist();
  
  // Fetch featured collection products
  const { products: collectionProducts, loading, error } = useCollection('featuredCollection');
  
  // Handle loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading featured products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load featured products</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleWishlist = (product: any, e: any) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleAddToCart = (_product: any) => {
    toast.info('Add to cart coming soon');
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
          
          <div className="h-px bg-gray-300 flex-1"></div>
          
          <h1 className="text-3xl font-bold text-gray-900">Featured Collection</h1>
        </div>

        {/* Products Count */}
        <div className="mb-8">
          <p className="text-gray-600">
            {collectionProducts.length > 0 
              ? `Showing ${collectionProducts.length} featured products`
              : 'No featured products available'
            }
          </p>
        </div>

        {/* Products Grid */}
        {collectionProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
            {collectionProducts.map((product) => (
              <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all hover:-translate-y-2">
                <div className="relative aspect-[3/4] overflow-hidden bg-beige-50 cursor-pointer" onClick={() => navigate(getProductUrl(product))}>
                  <img 
                    src={getProductImage(product)} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                    onError={(e) => handleImageError(e, product.name)} 
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.isNew && <span className="px-3 py-1 bg-black text-white text-xs rounded-full">New</span>}
                    {product.isSale && <span className="px-3 py-1 bg-red-500 text-white text-xs rounded-full">Sale</span>}
                  </div>
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                    <button 
                      onClick={(e) => handleWishlist(product, e)} 
                      className="w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-white hover:bg-gold hover:text-white"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gold hover:text-white">
                      <Star className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all">
                    <button 
                      onClick={handleAddToCart} 
                      className="w-full py-3 bg-black text-white text-sm rounded-full flex items-center justify-center gap-2 hover:bg-gold"
                    >
                      <ShoppingBag className="w-4 h-4" /> Add to Cart
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-playfair text-xs leading-[12px] font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-lg">${product.price}</span>
                    {product.originalPrice && <span className="text-gray-400 line-through text-sm">${product.originalPrice}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No featured products available at the moment.</p>
            <button 
              onClick={() => navigate('/shop')}
              className="px-6 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
            >
              Browse All Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
