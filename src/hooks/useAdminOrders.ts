import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  search?: string;
  sortBy?: 'date' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export function useAdminOrders(filters: AdminOrderFilters = {}) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['admin-orders', filters],
    queryFn: async ({ pageParam = 1 }) => {
      console.log(`📦 Fetching admin orders page ${pageParam}...`);
      const data = await adminService.getOrders({
        ...filters,
        page: pageParam as number,
        limit: 20
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for updating order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return adminService.updateOrderStatus(orderId, status);
    },
    onSuccess: (_, variables) => {
      // Update the order in cache
      queryClient.setQueryData(['admin-orders', filters], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            orders: page.orders.map((order: AdminOrder) =>
              order.id === variables.orderId ? { ...order, status: variables.status } : order
            )
          }))
        };
      });

      // Also update the stats cache
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      
      console.log('✅ Order status updated in cache');
    }
  });

  // Mutation for bulk actions
  const bulkActionMutation = useMutation({
    mutationFn: async ({ orderIds, action }: { orderIds: string[]; action: string }) => {
      return adminService.bulkOrderAction(orderIds, action);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      console.log('✅ Bulk action completed, cache invalidated');
    }
  });

  return {
    // Query data
    orders: query.data?.pages.flatMap(page => page.orders) || [],
    totalPages: query.data?.pages[0]?.totalPages || 1,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,

    // Mutations
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    bulkAction: bulkActionMutation.mutate,
    isBulkAction: bulkActionMutation.isPending,

    // Helpers
    getOrdersByStatus: (status: string) => 
      query.data?.pages.flatMap(page => 
        page.orders.filter((order: AdminOrder) => order.status === status)
      ) || [],
  };
}
