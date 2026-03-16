import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { cartService } from '@/services/cartService';

export function CartSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Listen for cart changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart' && e.newValue) {
        const newCart = JSON.parse(e.newValue);
        queryClient.setQueryData(['cart', user?.id], newCart);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user?.id, queryClient]);

  // Sync cart between tabs using BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('cart-sync');

      channel.onmessage = (event) => {
        if (event.data.type === 'CART_UPDATED') {
          queryClient.setQueryData(['cart', user?.id], event.data.cart);
        }
      };

      // Subscribe to cart service updates
      const unsubscribe = cartService.subscribe((cart) => {
        channel.postMessage({
          type: 'CART_UPDATED',
          cart,
          userId: user?.id,
        });
      });

      return () => {
        channel.close();
        unsubscribe();
      };
    }
  }, [user?.id, queryClient]);

  return null;
}
