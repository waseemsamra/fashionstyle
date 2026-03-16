import { useQuery, useQueries, useQueryClient, useMutation } from '@tanstack/react-query';
import { adminService, type AdminStats, type Period, type DateRange } from '@/services/adminService';
import { useState, useEffect } from 'react';

/**
 * Main hook for fetching admin stats
 * Features:
 * - 5 minute stale time
 * - 30 minute cache
 * - No refetch on window focus
 * - Background refetch every 5 minutes
 * - Keeps previous data while fetching
 */
export function useAdminStats(period: Period = '30d', dateRange?: DateRange) {
  const queryKey = dateRange 
    ? ['admin-stats', 'custom', dateRange]
    : ['admin-stats', period];

  return useQuery<AdminStats>({
    queryKey,
    queryFn: async () => {
      console.log(`📊 Fetching admin stats for ${period}...`);
      const data = await adminService.getStats(period, dateRange);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when tab switches
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes in background
    placeholderData: (previousData) => previousData, // Keep showing old data
  });
}

/**
 * Hook for real-time stats updates via WebSocket
 * Features:
 * - WebSocket connection for live updates
 * - Automatic cache updates
 * - Connection status tracking
 */
export function useAdminStatsRealtime(period: Period = '30d') {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if no WebSocket URL configured
    const wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      console.log('⚠️ WebSocket URL not configured, skipping real-time updates');
      return;
    }

    console.log('📡 Connecting to real-time stats...');
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('✅ Connected to real-time stats');
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data);
            console.log('📡 Real-time update received:', update);
            
            // Update cache with new data
            queryClient.setQueryData(['admin-stats', period], (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                ...update
              };
            });
          } catch (err) {
            console.error('❌ Failed to parse real-time update:', err);
          }
        };

        ws.onclose = () => {
          console.log('📡 Disconnected from real-time stats');
          setIsConnected(false);
          
          // Attempt to reconnect after 5 seconds
          reconnectTimeout = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }, 5000);
        };

        ws.onerror = (err) => {
          console.error('❌ WebSocket error:', err);
          setError('Connection error');
          ws?.close();
        };
      } catch (err) {
        console.error('❌ Failed to connect to WebSocket:', err);
        setError('Connection failed');
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [period, queryClient]);

  return { 
    isConnected, 
    error,
    status: isConnected ? 'connected' : error ? 'error' : 'disconnected'
  };
}

/**
 * Hook to fetch stats for multiple periods in parallel
 * Features:
 * - Parallel queries for multiple periods
 * - Returns object with stats for each period
 * - Useful for comparison views
 */
export function useAdminStatsSnapshot(periods: Period[]) {
  const queries = useQueries({
    queries: periods.map((period) => ({
      queryKey: ['admin-stats', period],
      queryFn: () => adminService.getStats(period),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    }))
  });

  // Convert array to object keyed by period
  const result = periods.reduce((acc, period, index) => ({
    ...acc,
    [period]: queries[index].data
  }), {} as Record<Period, AdminStats | undefined>);

  // Add loading and error states
  const isLoading = queries.some(q => q.isLoading);
  const error = queries.find(q => q.error)?.error;

  return {
    ...result,
    isLoading,
    error,
    isFetching: queries.some(q => q.isFetching)
  };
}

/**
 * Hook for quick stats (lightweight version for dashboard header)
 * Features:
 * - Fetches only essential metrics
 * - Faster response time
 * - Lower cache time (2 minutes)
 */
export function useQuickAdminStats() {
  return useQuery({
    queryKey: ['admin-stats-quick'],
    queryFn: async () => {
      console.log('📊 Fetching quick stats...');
      const data = await adminService.getQuickStats();
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

/**
 * Hook for top selling products
 * Features:
 * - Configurable limit
 * - 10 minute stale time
 * - Separate cache from full stats
 */
export function useTopProducts(limit: number = 5) {
  return useQuery({
    queryKey: ['admin-stats-top-products', limit],
    queryFn: async () => {
      console.log(`📊 Fetching top ${limit} products...`);
      const data = await adminService.getTopProducts(limit);
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for revenue trend data
 * Features:
 * - Period-based trend data
 * - Array of { date, amount }
 * - Perfect for charts
 */
export function useRevenueTrend(period: Period = '30d') {
  return useQuery({
    queryKey: ['admin-stats-revenue', period],
    queryFn: async () => {
      console.log(`📊 Fetching revenue trend for ${period}...`);
      const data = await adminService.getRevenueTrend(period);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for exporting dashboard data
 * Features:
 * - Downloads CSV file
 * - Automatic file naming
 * - Blob handling
 */
export function useExportDashboard() {
  return useMutation({
    mutationFn: async (period: Period) => {
      console.log(`📥 Exporting dashboard data for ${period}...`);
      return adminService.exportDashboard(period);
    },
    onSuccess: (data: Blob, period: Period) => {
      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-${period}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Dashboard data exported successfully');
    },
    onError: (error: Error) => {
      console.error('❌ Failed to export dashboard:', error);
    }
  });
}
