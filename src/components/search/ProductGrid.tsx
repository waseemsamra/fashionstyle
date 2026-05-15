import { toCDNUrl } from '@/utils/productImage';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LazyImage from '@/components/ui/LazyImage';
import type { SearchResult } from '@/hooks/useSearchProducts';

interface ProductGridProps {
  products: SearchResult[];
  columns?: 3 | 4;
}

export function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  if (!products || products.length === 0) {
    return null;
  }

  const gridCols = columns === 3 
    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-6`}>
      {products.map((product) => (
        <Card
          key={product.id}
          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <Link to={`/product/${product.id}`}>
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              <LazyImage
                src={toCDNUrl(product.image)}
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
  );
}
