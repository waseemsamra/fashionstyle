import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToggleWishlist, useIsInWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  className?: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
}

export function WishlistButton({ 
  productId, 
  product,
  className = '', 
  variant = 'icon',
  size = 'md'
}: WishlistButtonProps) {
  const isInWishlist = useIsInWishlist(productId);
  const { toggleWishlist, isPending } = useToggleWishlist();

  const isLoading = isPending(productId);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({ productId, product });
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          'relative rounded-full transition-all duration-200 hover:scale-110',
          isInWishlist 
            ? 'text-red-500 bg-red-50 hover:bg-red-100' 
            : 'text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-red-500',
          sizeClasses[size],
          className
        )}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart 
          className={cn(
            'w-5 h-5 mx-auto transition-all',
            isInWishlist ? 'fill-red-500' : '',
            isLoading ? 'animate-pulse' : ''
          )}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-gold rounded-full animate-ping" />
          </div>
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={isInWishlist ? 'default' : 'outline'}
      className={cn(
        'gap-2 transition-all',
        isInWishlist 
          ? 'bg-red-500 hover:bg-red-600 text-white' 
          : 'hover:bg-red-50 hover:text-red-500 hover:border-red-500',
        className
      )}
    >
      <Heart 
        className={cn(
          'w-4 h-4 transition-all',
          isInWishlist ? 'fill-white' : '',
          isLoading ? 'animate-pulse' : ''
        )}
      />
      {isLoading ? (
        <span className="animate-pulse">Updating...</span>
      ) : (
        <span>{isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
      )}
    </Button>
  );
}
