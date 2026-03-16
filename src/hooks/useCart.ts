import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService, type Cart, type CartItem } from '@/services/cartService';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useCart() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  // Main cart query
  const query = useQuery({
    queryKey: ['cart', userId],
    queryFn: async () => {
      console.log('🛒 Fetching cart...');
      let cart: Cart;

      if (userId) {
        // Logged in: get from API
        cart = await cartService.getCart(userId);
        
        // Sync with local storage if there are items
        const localCart = cartService.getLocalCart();
        if (localCart.items.length > 0) {
          cart = await cartService.mergeCarts(userId, localCart);
          cartService.clearLocalCart();
        }
      } else {
        // Guest: get from local storage
        cart = cartService.getLocalCart();
      }

      return cart;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: true,
    placeholderData: (previousData) => previousData || { items: [], total: 0, itemCount: 0 },
  });

  // Sync cart across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart' && e.newValue) {
        const newCart = JSON.parse(e.newValue);
        queryClient.setQueryData(['cart', userId], newCart);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId, queryClient]);

  const cart = query.data || { items: [], total: 0, itemCount: 0 };

  return {
    cart,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAddToCart() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ product, quantity = 1, size, color }: {
      product: any;
      quantity?: number;
      size?: string;
      color?: string;
    }) => {
      const cartItem: CartItem = {
        id: `${product.id}-${size || ''}-${color || ''}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        size,
        color,
        maxQuantity: product.stock || 10,
      };

      if (userId) {
        return cartService.addToCart(userId, cartItem);
      } else {
        return cartService.addToLocalCart(cartItem);
      }
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['cart', userId] });

      const previousCart = queryClient.getQueryData(['cart', userId]);

      queryClient.setQueryData(['cart', userId], (old: Cart) => {
        const existingItemIndex = old.items.findIndex(
          item => item.id === `${variables.product.id}-${variables.size || ''}-${variables.color || ''}`
        );

        const newItems = [...old.items];
        if (existingItemIndex >= 0) {
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + (variables.quantity ?? 1),
          };
        } else {
          newItems.push({
            id: `${variables.product.id}-${variables.size || ''}-${variables.color || ''}`,
            productId: variables.product.id,
            name: variables.product.name,
            price: variables.product.price,
            image: variables.product.image,
            quantity: variables.quantity ?? 1,
            size: variables.size,
            color: variables.color,
            maxQuantity: variables.product.stock || 10,
          });
        }

        const newCart = {
          items: newItems,
          total: newItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
          itemCount: newItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
        };

        // Update local storage for guests
        if (!userId) {
          cartService.saveLocalCart(newCart);
        }

        return newCart;
      });

      return { previousCart };
    },

    onSuccess: (_data, variables) => {
      toast.success(`${variables.product.name} added to cart!`, {
        action: {
          label: 'View Cart',
          onClick: () => window.location.href = '/cart',
        },
      });

      // Track event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'add_to_cart', {
          items: [{
            id: variables.product.id,
            name: variables.product.name,
            price: variables.product.price,
            quantity: variables.quantity ?? 1,
          }],
        });
      }
    },

    onError: (_error, _variables, _context) => {
      toast.error('Failed to add item to cart');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', userId] });
    },
  });
}

export function useUpdateCartItem() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (userId) {
        return cartService.updateItemQuantity(userId, itemId, quantity);
      } else {
        return cartService.updateLocalItemQuantity(itemId, quantity);
      }
    },

    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart', userId] });

      const previousCart = queryClient.getQueryData(['cart', userId]);

      queryClient.setQueryData(['cart', userId], (old: Cart) => {
        const newItems = old.items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );

        const newCart = {
          items: newItems,
          total: newItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
          itemCount: newItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
        };

        if (!userId) {
          cartService.saveLocalCart(newCart);
        }

        return newCart;
      });

      return { previousCart };
    },

    onError: (_error, _variables, _context) => {
      toast.error('Failed to update cart');
    },
  });
}

export function useRemoveFromCart() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (userId) {
        return cartService.removeFromCart(userId, itemId);
      } else {
        return cartService.removeFromLocalCart(itemId);
      }
    },

    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['cart', userId] });

      const previousCart = queryClient.getQueryData(['cart', userId]);

      queryClient.setQueryData(['cart', userId], (old: Cart) => {
        const newItems = old.items.filter(item => item.id !== itemId);

        const newCart = {
          items: newItems,
          total: newItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
          itemCount: newItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
        };

        if (!userId) {
          cartService.saveLocalCart(newCart);
        }

        return newCart;
      });

      return { previousCart };
    },

    onSuccess: () => {
      toast.success('Item removed from cart');
    },

    onError: (_error, _variables, _context) => {
      toast.error('Failed to remove item');
    },
  });
}

export function useClearCart() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (userId) {
        return cartService.clearCart(userId);
      } else {
        return cartService.clearLocalCart();
      }
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart', userId] });

      const previousCart = queryClient.getQueryData(['cart', userId]);

      const emptyCart = { items: [], total: 0, itemCount: 0 };
      queryClient.setQueryData(['cart', userId], emptyCart);

      if (!userId) {
        cartService.saveLocalCart(emptyCart);
      }

      return { previousCart };
    },

    onSuccess: () => {
      toast.success('Cart cleared');
    },

    onError: (_error, _variables, _context) => {
      toast.error('Failed to clear cart');
    },
  });
}

export function useCartTotals() {
  const { cart } = useCart();

  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    tax,
    total,
    itemCount: cart.itemCount,
  };
}

export function useCartItemCount() {
  const { cart } = useCart();
  return cart.itemCount;
}

export function useCartItem(productId: string, size?: string, color?: string) {
  const { cart } = useCart();
  const itemId = `${productId}-${size || ''}-${color || ''}`;
  
  return cart.items.find(item => item.id === itemId);
}

/**
 * Debounced cart update hook
 * Use this for quantity updates to reduce API calls
 * Usage: const debouncedUpdate = useDebouncedCartUpdate();
 *        debouncedUpdate(itemId, newQuantity);
 */
export function useDebouncedCartUpdate() {
  const updateItem = useUpdateCartItem();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedUpdate = (itemId: string, quantity: number) => {
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      updateItem.mutate({ itemId, quantity });
    }, 500); // 500ms debounce
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return debouncedUpdate;
}

// Cart Provider for legacy compatibility
export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
