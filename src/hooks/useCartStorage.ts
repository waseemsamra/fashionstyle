import { useState, useEffect } from 'react';

const CART_OPEN_KEY = 'cart_is_open';

export function useCartStorage() {
  const [isCartOpen, setIsCartOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_OPEN_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_OPEN_KEY, String(isCartOpen));
    } catch {
      // Ignore localStorage errors
    }
  }, [isCartOpen]);

  return { isCartOpen, setIsCartOpen };
}
