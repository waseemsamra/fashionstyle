import { useAddToCart } from '@/hooks/useCart';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AddToCartButtonProps {
  product: any;
  size?: string;
  color?: string;
  quantity?: number;
  variant?: 'default' | 'outline' | 'icon';
  className?: string;
}

export function AddToCartButton({
  product,
  size,
  color,
  quantity = 1,
  variant = 'default',
  className = '',
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const addToCart = useAddToCart();

  const handleClick = () => {
    addToCart.mutate(
      { product, quantity, size, color },
      {
        onSuccess: () => {
          setIsAdded(true);
          setTimeout(() => setIsAdded(false), 2000);
        },
      }
    );
  };

  const isDisabled = addToCart.isPending;

  const variants = {
    default: 'bg-gold text-white hover:bg-gold/90',
    outline: 'border border-gold text-gold hover:bg-gold/10',
    icon: 'p-2 rounded-full bg-gold text-white hover:bg-gold/90',
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`${variants[variant]} ${className} ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label="Add to cart"
      >
        {addToCart.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isAdded ? (
          <Check className="w-5 h-5" />
        ) : (
          <ShoppingCart className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium
        transition-all hover:scale-105 active:scale-95
        ${variants[variant]} ${className}
        ${isDisabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
      `}
    >
      {addToCart.isPending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Adding...
        </>
      ) : isAdded ? (
        <>
          <Check className="w-5 h-5" />
          Added to Cart!
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </>
      )}
    </button>
  );
}
