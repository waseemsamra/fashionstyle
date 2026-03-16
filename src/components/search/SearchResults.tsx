import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LazyImage from '@/components/ui/LazyImage';
import type { SearchResult } from '@/hooks/useSearchProducts';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  query?: string;
}

export default function SearchResults({ results, isLoading, query }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No results found</h3>
        <p className="text-gray-600 mb-4">
          We couldn't find any products matching "{query}"
        </p>
        <p className="text-sm text-gray-500">
          Try different keywords or check your spelling
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Found {results.length} {results.length === 1 ? 'product' : 'products'} for "{query}"
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <Link to={`/product/${product.id}`}>
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                <LazyImage
                  src={product.image}
                  alt={product.name}
                  productName={product.name}
                  productId={product.id}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.isNew && (
                    <Badge className="bg-green-500 text-white">New</Badge>
                  )}
                  {product.onSale && (
                    <Badge className="bg-red-500 text-white">Sale</Badge>
                  )}
                  {!product.inStock && (
                    <Badge className="bg-gray-500 text-white">Out of Stock</Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-4">
                {/* Highlighted Name */}
                {product.highlight?.name ? (
                  <h3 
                    className="font-semibold mb-1 line-clamp-2"
                    dangerouslySetInnerHTML={{ 
                      __html: product.highlight.name[0] 
                    }}
                  />
                ) : (
                  <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
                )}

                {/* Category & Brand */}
                <div className="text-sm text-gray-500 mb-2">
                  {product.category} • {product.brand}
                </div>

                {/* Rating */}
                {product.rating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(product.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({product.reviewCount})
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gold">
                    ${product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
