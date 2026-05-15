import { toCDNUrl } from '@/utils/productImage';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import LazyImage from '@/components/ui/LazyImage';
import { getProductUrl } from '@/utils/productUrl';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    images?: string[];
    category?: string;
    brand?: string;
    rating?: number;
    reviewCount?: number;
    inStock?: boolean;
    onSale?: boolean;
    isNew?: boolean;
    colors?: string[];
    sizes?: string[];
  };
  variant?: 'default' | 'compact' | 'detailed';
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to product detail page for full cart options
  };

  const isOutOfStock = product.inStock === false;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  if (variant === 'compact') {
    return (
      <div className="group relative bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <Link to={getProductUrl(product)} className="block">
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
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">New</span>
              )}
              {hasDiscount && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                  Sale
                </span>
              )}
              {isOutOfStock && (
                <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <WishlistButton
                productId={String(product.id)}
                product={product}
                variant="icon"
                size="sm"
              />
            </div>
          </div>

          <div className="p-3">
            <h3 className="font-medium text-xs leading-[12px] line-clamp-2 hover:text-gold transition">
              {product.name}
            </h3>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gold">${product.price}</span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    ${product.originalPrice}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
        <Link to={getProductUrl(product)} className="block">
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
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">New</span>
              )}
              {hasDiscount && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                  -{Math.round((1 - product.price / (product.originalPrice || product.price)) * 100)}%
                </span>
              )}
              {isOutOfStock && (
                <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <WishlistButton
                productId={String(product.id)}
                product={product}
                variant="icon"
                size="md"
              />
            </div>
          </div>

          <div className="p-4">
            {product.category && (
              <p className="text-xs text-gray-500 mb-1">{product.category}</p>
            )}
            <h3 className="font-semibold text-xs leading-[12px] line-clamp-2 hover:text-gold transition">
              {product.name}
            </h3>
            
            {product.rating && (
              <div className="flex items-center gap-1 mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(product.rating!) 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {product.reviewCount && (
                  <span className="text-xs text-gray-500">({product.reviewCount})</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gold">${product.price}</span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">
                    ${product.originalPrice}
                  </span>
                )}
              </div>
            </div>

            {!isOutOfStock && (
              <button
                onClick={handleAddToCart}
                className="w-full mt-3 bg-gold text-white py-2 rounded-lg hover:bg-gold/90 transition flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            )}
          </div>
        </Link>
      </div>
    );
  }

  // Default variant
  return (
    <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={getProductUrl(product)} className="block">
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
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">New</span>
            )}
            {hasDiscount && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Sale</span>
            )}
            {isOutOfStock && (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                Out of Stock
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <WishlistButton
              productId={String(product.id)}
              product={product}
              variant="icon"
              size="sm"
            />
          </div>
        </div>

        <div className="p-4">
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
          )}
          <h3 className="font-medium text-xs leading-[12px] line-clamp-2 hover:text-gold transition">
            {product.name}
          </h3>
          
          {product.rating && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(product.rating!) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              {product.reviewCount && (
                <span className="text-xs text-gray-500">({product.reviewCount})</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gold">${product.price}</span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>
          </div>

          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className="w-full mt-3 bg-gold text-white py-2 rounded-lg hover:bg-gold/90 transition flex items-center justify-center gap-2 text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}
