// NewArrivals page - Uses collections for dynamic product loading
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useCollection } from '@/hooks/useCollection';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

export default function NewArrivalsPage() {
  const navigate = useNavigate();
  const { products, loading } = useCollection('newArrivals');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = products.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gold/20 via-gold/10 to-transparent py-16 mb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <span className="text-gold text-sm font-medium tracking-wider uppercase block mb-2">Just Arrived</span>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-black mb-4">New Arrivals</h1>
            <p className="text-gray-600 text-lg mb-6">
              Be the first to discover our latest collection of exquisite Pakistani fashion.
              {products.length > 0 && ` ${products.length} new products added.`}
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gold transition-colors"
            >
              View All Products
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading new arrivals...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🆕</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No New Arrivals Yet</h3>
            <p className="text-gray-500 mb-6">Please add products in Admin → CMS → New Arrivals</p>
            <Button onClick={() => navigate('/admin/new-arrivals')}>Go to Admin</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {paginatedProducts.map((product: any) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:-translate-y-2"
                >
                  <div
                    className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-beige-50 cursor-pointer"
                    onClick={() => navigate(getProductUrl(product))}
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => handleImageError(e, product.name)}
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
                  <div className="p-3 sm:p-4">
                    <p className="text-gray-500 text-xs uppercase mb-1">{product.category}</p>
                    <h3
                      onClick={() => navigate(getProductUrl(product))}
                      className="font-playfair text-xs leading-[12px] font-semibold mb-1 sm:mb-2 cursor-pointer hover:text-gold transition line-clamp-2"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full bg-white shadow hover:bg-gold hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-full font-medium transition ${
                      currentPage === page
                        ? 'bg-gold text-white'
                        : 'bg-white shadow hover:bg-gold hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full bg-white shadow hover:bg-gold hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
