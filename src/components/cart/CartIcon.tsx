import { useCartItemCount } from '@/hooks/useCart';
import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { MiniCart } from './MiniCart';

interface CartIconProps {
  className?: string;
}

export function CartIcon({ className = '' }: CartIconProps) {
  const itemCount = useCartItemCount();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative ${className}`}
        aria-label="Open cart"
      >
        <ShoppingBag className="w-6 h-6" />
        
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-gold text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      <MiniCart isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
