import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { shopService, type Product, type ShopFilters, type Category } from '@/services/shopService';
import { useDebounce } from '@/hooks/useDebounce';
import { useState, useEffect } from 'react';

export function useShopProducts(initialFilters?: ShopFilters) {
  const [filters, setFilters] = useState<ShopFilters>(initialFilters || {});
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  // Debounce price and search filters
  const debouncedMinPrice = useDebounce(filters.minPrice, 500);
  const debouncedMaxPrice = useDebounce(filters.maxPrice, 500);
  const debouncedSearch = useDebounce(filters.search, 300);

  const activeFilters = {
    ...filters,
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
    search: debouncedSearch,
  };

  // Main products query with infinite scroll
  const query = useInfiniteQuery({
    queryKey: ['shop-products', activeFilters],
    queryFn: async ({ pageParam = 1 }) => {
      console.log('🏪 Fetching products:', { ...activeFilters, page: pageParam });
      const data = await shopService.getProducts({
        ...activeFilters,
        page: pageParam,
        limit: 12,
      });
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    placeholderData: (previousData) => previousData,
  });

  // Get available filters (facets)
  const { data: filterOptions } = useQuery({
    queryKey: ['shop-filters', activeFilters.category],
    queryFn: async () => {
      const data = await shopService.getFilterOptions(activeFilters.category);
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const products = query.data?.pages.flatMap(page => page.products) || [];
  const totalProducts = query.data?.pages[0]?.total || 0;
  const hasMore = query.hasNextPage;

  // Prefetch next page
  useEffect(() => {
    if (hasMore && products.length > 0) {
      const nextPage = (query.data?.pages.length || 0) + 1;
      queryClient.prefetchQuery({
        queryKey: ['shop-products', { ...activeFilters, page: nextPage }],
        queryFn: () => shopService.getProducts({ ...activeFilters, page: nextPage, limit: 12 }),
      });
    }
  }, [products.length, activeFilters, queryClient, hasMore, query.data?.pages.length]);

  // Get active filter count
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'category' || key === 'search') return false;
    return value !== undefined && value !== null && value !== '';
  }).length;

  return {
    // Data
    products,
    totalProducts,
    filterOptions,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    error: query.error,
    hasMore,

    // Filters
    filters,
    setFilters,
    activeFilterCount,
    clearFilters: () => setFilters({}),
    updateFilter: (key: keyof ShopFilters, value: any) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },

    // Pagination
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,

    // UI State
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
  };
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      console.log(`🏷️ Fetching category: ${slug}`);
      const data = await shopService.getCategoryBySlug(slug);
      return data;
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('🏷️ Fetching all categories');
      const data = await shopService.getCategories();
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useCategoryBreadcrumbs(categoryId: string) {
  return useQuery({
    queryKey: ['category-breadcrumbs', categoryId],
    queryFn: async () => {
      const data = await shopService.getCategoryBreadcrumbs(categoryId);
      return data;
    },
    enabled: !!categoryId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useRelatedCategories(categoryId: string) {
  return useQuery({
    queryKey: ['related-categories', categoryId],
    queryFn: async () => {
      const data = await shopService.getRelatedCategories(categoryId);
      return data;
    },
    enabled: !!categoryId,
    staleTime: 30 * 60 * 1000,
  });
}
