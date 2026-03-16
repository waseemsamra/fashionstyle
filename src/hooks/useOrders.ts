import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { ordersService, type Order, type OrderFilters, type OrderStats, type TrackingInfo } from '@/services/ordersService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useOrders(filters?: OrderFilters) {
  const { user } = useAuth();
  const userId = user?.id;

  return useInfiniteQuery({
    queryKey: ['orders', userId, filters],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userId) throw new Error('Not authenticated');
      console.log(`📦 Fetching orders page ${pageParam}...`);
      const data = await ordersService.getUserOrders(userId, {
        ...filters,
        page: pageParam as number,
        limit: 10
      });
      return data;
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    placeholderData: (previousData) => previousData,
  });
}

export function useOrder(orderId: string) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['order', orderId, userId],
    queryFn: async () => {
      console.log(`📦 Fetching order ${orderId}...`);
      const data = await ordersService.getOrder(orderId);
      return data as Order;
    },
    enabled: !!orderId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds if order is in progress
    refetchIntervalInBackground: false,
  });
}

export function useOrderStats() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['order-stats', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const data = await ordersService.getOrderStats(userId);
      return data as OrderStats;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTrackOrder(orderId: string) {
  return useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      const data = await ordersService.trackOrder(orderId);
      return data as TrackingInfo;
    },
    enabled: !!orderId,
    refetchInterval: 60 * 1000, // Refetch every minute
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCancelOrder() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      return ordersService.cancelOrder(orderId, reason);
    },

    // Optimistic update
    onMutate: async ({ orderId }) => {
      await queryClient.cancelQueries({ queryKey: ['order', orderId] });
      await queryClient.cancelQueries({ queryKey: ['orders', userId] });

      const previousOrder = queryClient.getQueryData(['order', orderId]);
      const previousOrders = queryClient.getQueryData(['orders', userId]);

      // Update single order
      queryClient.setQueryData(['order', orderId], (old: Order) => ({
        ...old,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      }));

      // Update orders list
      queryClient.setQueryData(['orders', userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            orders: page.orders.map((order: Order) =>
              order.id === orderId ? { ...order, status: 'cancelled' } : order
            ),
          })),
        };
      });

      return { previousOrder, previousOrders };
    },

    onSuccess: () => {
      toast.success('Order cancelled successfully');
    },

    onError: (_error, _variables, _context) => {
      // Rollback
      toast.error('Failed to cancel order');
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', userId] });
      queryClient.invalidateQueries({ queryKey: ['order-stats', userId] });
    },
  });
}

export function useReturnOrder() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, items, reason }: { orderId: string; items: string[]; reason: string }) => {
      return ordersService.returnOrder(orderId, items, reason);
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', userId] });
      toast.success('Return request submitted successfully');
    },

    onError: () => {
      toast.error('Failed to submit return request');
    },
  });
}

export function useReorder() {
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (orderId: string) => {
      return ordersService.reorder(orderId);
    },

    onSuccess: (_newOrderId) => {
      toast.success('Items added to cart!');
      // Navigate to cart
      window.location.href = '/cart';
    },

    onError: () => {
      toast.error('Failed to reorder items');
    },
  });
}

export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const blob = await ordersService.downloadInvoice(orderId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },

    onSuccess: () => {
      toast.success('Invoice downloaded');
    },

    onError: () => {
      toast.error('Failed to download invoice');
    },
  });
}
