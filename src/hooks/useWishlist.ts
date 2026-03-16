import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '@/services/wishlistService';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  addedAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    brand: string;
    rating: number;
    reviewCount: number;
    inStock: boolean;
    onSale: boolean;
    colors?: string[];
    sizes?: string[];
  };
  notification?: {
    priceDrop: boolean;
    backInStock: boolean;
  };
}

export interface WishlistStats {
  totalItems: number;
  totalValue: number;
  averagePrice: number;
  categories: Array<{ name: string; count: number }>;
  brands: Array<{ name: string; count: number }>;
  lastAdded?: string;
}

export function useWishlist() {
  const userId = localStorage.getItem('user_id') || 'guest';
  const isGuest = userId === 'guest';

  const query = useQuery({
    queryKey: ['wishlist', userId],
    queryFn: async () => {
      if (isGuest) return [];
      console.log(`❤️ Fetching wishlist for user ${userId}`);
      const data = await wishlistService.getWishlist(userId);
      return data as WishlistItem[];
    },
    enabled: !isGuest,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (previousData) => previousData,
  });

  // Local state for guest users
  const [guestWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('guestWishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // For guest users, we need to simulate the wishlist
  const guestWishlistData = useQuery({
    queryKey: ['guest-wishlist', guestWishlist],
    queryFn: async () => {
      if (guestWishlist.length === 0) return [];
      const products = await wishlistService.getProductsByIds(guestWishlist);
      return products.map((product: any, idx: number) => ({
        id: `guest-${product.id}`,
        productId: product.id,
        userId: 'guest',
        addedAt: new Date(Date.now() - idx * 86400000).toISOString(),
        product
      }));
    },
    enabled: !isGuest && guestWishlist.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const data = !isGuest ? query.data : guestWishlistData.data;
  const isLoading = !isGuest ? query.isLoading : guestWishlistData.isLoading;
  const error = !isGuest ? query.error : guestWishlistData.error;

  return {
    data: data || [],
    isLoading,
    error,
    refetch: query.refetch,
    isGuest,
    guestWishlist,
  };
}

export function useWishlistStats() {
  const { data: wishlist } = useWishlist();

  const stats: WishlistStats = {
    totalItems: wishlist?.length || 0,
    totalValue: wishlist?.reduce((sum: number, item: any) => sum + item.product.price, 0) || 0,
    averagePrice: wishlist?.length
      ? wishlist.reduce((sum: number, item: any) => sum + item.product.price, 0) / wishlist.length
      : 0,
    categories: Object.entries(
      wishlist?.reduce((acc: Record<string, number>, item: any) => {
        const cat = item.product.category;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    ).map(([name, count]) => ({ name, count })),
    brands: Object.entries(
      wishlist?.reduce((acc: Record<string, number>, item: any) => {
        const brand = item.product.brand;
        acc[brand] = (acc[brand] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    ).map(([name, count]) => ({ name, count })),
    lastAdded: wishlist?.[0]?.addedAt,
  };

  return stats;
}

export function useIsInWishlist(productId: string) {
  const { data: wishlist } = useWishlist();
  return wishlist?.some(item => item.productId === productId) || false;
}

export function useToggleWishlist() {
  const userId = localStorage.getItem('user_id') || 'guest';
  const isGuest = userId === 'guest';
  const queryClient = useQueryClient();
  const [pendingItems, setPendingItems] = useState<Set<string>>(new Set());

  // Guest wishlist management
  const [guestWishlist, setGuestWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('guestWishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (isGuest) {
      localStorage.setItem('guestWishlist', JSON.stringify(guestWishlist));
    }
  }, [guestWishlist, isGuest]);

  const mutation = useMutation({
    mutationFn: async ({ productId, product }: { productId: string; product?: any }) => {
      if (isGuest) {
        // Handle guest wishlist
        const isInWishlist = guestWishlist.includes(productId);
        
        if (isInWishlist) {
          // Remove from guest wishlist
          setGuestWishlist(prev => prev.filter(id => id !== productId));
          return { action: 'removed', productId };
        } else {
          // Add to guest wishlist
          setGuestWishlist(prev => [...prev, productId]);
          return { action: 'added', productId, product };
        }
      } else {
        // Handle logged-in user wishlist
        return await wishlistService.toggleWishlist(userId, productId);
      }
    },

    // Optimistic update
    onMutate: async ({ productId, product }) => {
      setPendingItems(prev => new Set(prev).add(productId));

      if (!isGuest) {
        // Cancel outgoing queries
        await queryClient.cancelQueries({ queryKey: ['wishlist', userId] });

        // Snapshot previous value
        const previousWishlist = queryClient.getQueryData(['wishlist', userId]);

        // Optimistically update
        queryClient.setQueryData(['wishlist', userId], (old: WishlistItem[] = []) => {
          const isInWishlist = old.some(item => item.productId === productId);

          if (isInWishlist) {
            // Remove from wishlist
            return old.filter(item => item.productId !== productId);
          } else {
            // Add to wishlist
            return [
              {
                id: `temp-${Date.now()}`,
                productId,
                userId: userId,
                addedAt: new Date().toISOString(),
                product: product || { id: productId, name: 'Loading...', price: 0, image: '' }
              },
              ...old
            ];
          }
        });

        return { previousWishlist };
      }
    },

    onSuccess: (data) => {
      const action = (data as any)?.action || 'updated';
      
      toast.success(
        action === 'added' 
          ? 'Added to wishlist ❤️' 
          : 'Removed from wishlist',
        {
          action: action === 'added' ? {
            label: 'View Wishlist',
            onClick: () => window.location.href = '/wishlist'
          } : undefined
        }
      );
    },

    onError: (_error, _variables, context) => {
      // Rollback on error
      if (!isGuest && context?.previousWishlist) {
        queryClient.setQueryData(['wishlist', userId], context.previousWishlist);
      }
      
      toast.error('Failed to update wishlist. Please try again.');
    },

    onSettled: (_data, _error, variables) => {
      setPendingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.productId);
        return newSet;
      });

      if (!isGuest) {
        // Refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['wishlist', userId] });
      }
    }
  });

  return {
    toggleWishlist: mutation.mutate,
    isPending: (productId: string) => pendingItems.has(productId),
    isToggling: mutation.isPending
  };
}

/**
 * Hook to sync guest wishlist on login
 * Call this in your login component after successful authentication
 */
export function useSyncGuestWishlist() {
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('user_id');

  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      
      const guestItems = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
      if (guestItems.length > 0) {
        console.log(`🔄 Syncing ${guestItems.length} guest wishlist items...`);
        await wishlistService.batchUpdate(userId, guestItems, 'add');
        localStorage.removeItem('guestWishlist');
        console.log('✅ Guest wishlist synced and cleared');
      }
    },
    onSuccess: () => {
      // Invalidate wishlist queries to refresh
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Your wishlist has been synced!');
    },
    onError: (error) => {
      console.error('❌ Failed to sync wishlist:', error);
      toast.error('Failed to sync wishlist. Please try again.');
    }
  });
}

/**
 * Hook to prefetch wishlist status for multiple products
 * Use this in product listing pages to prefetch wishlist status
 */
export function usePrefetchWishlistStatus(productIds: string[]) {
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('user_id') || 'guest';
  const isGuest = userId === 'guest';

  useEffect(() => {
    if (isGuest || productIds.length === 0) return;

    productIds.forEach(productId => {
      queryClient.prefetchQuery({
        queryKey: ['wishlist-status', productId],
        queryFn: async () => {
          const wishlist = await queryClient.fetchQuery({
            queryKey: ['wishlist', userId],
            queryFn: async () => {
              const data = await wishlistService.getWishlist(userId);
              return data as WishlistItem[];
            }
          });
          
          return wishlist?.some(item => item.productId === productId) || false;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    });
  }, [productIds, userId, isGuest, queryClient]);
}

export function useBatchWishlist() {
  const userId = localStorage.getItem('user_id') || 'guest';
  const isGuest = userId === 'guest';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productIds, action }: { productIds: string[]; action: 'add' | 'remove' }) => {
      if (isGuest) throw new Error('Batch operations require login');
      return await wishlistService.batchUpdate(userId, productIds, action);
    },

    onMutate: async ({ productIds, action }) => {
      if (isGuest) return;

      await queryClient.cancelQueries({ queryKey: ['wishlist', userId] });

      const previousWishlist = queryClient.getQueryData(['wishlist', userId]);

      queryClient.setQueryData(['wishlist', userId], (old: WishlistItem[] = []) => {
        if (action === 'add') {
          const newItems = productIds.map(productId => ({
            id: `temp-${Date.now()}-${productId}`,
            productId,
            userId: userId,
            addedAt: new Date().toISOString(),
            product: { id: productId, name: 'Loading...', price: 0, image: '' }
          }));
          return [...newItems, ...old];
        } else {
          return old.filter(item => !productIds.includes(item.productId));
        }
      });

      return { previousWishlist };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist', userId], context.previousWishlist);
      }
      toast.error('Batch operation failed');
    },

    onSettled: () => {
      if (!isGuest) {
        queryClient.invalidateQueries({ queryKey: ['wishlist', userId] });
      }
    }
  });
}
