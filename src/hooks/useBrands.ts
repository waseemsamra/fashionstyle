import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { brandsService } from '@/services/brandsService';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  coverImage: string;
  description: string;
  shortDescription: string;
  establishedYear?: number;
  country?: string;
  isFeatured: boolean;
  productCount: number;
  collections: Collection[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  isSeasonal?: boolean;
  season?: string;
  year?: number;
}

export interface BrandProductsResponse {
  products: any[];
  total?: number;
  page?: number;
  totalPages?: number;
  currentPage?: number;
  nextPage: number | undefined;
}

/**
 * Hook to fetch brands with optional filtering
 * Features:
 * - 1 hour stale time (brands rarely change)
 * - 2 hour cache time
 * - No refetch on window focus
 * - Keeps previous data while fetching (placeholderData)
 */
export function useBrands(options?: { featured?: boolean; limit?: number }) {
  const result = useQuery({
    queryKey: ['brands', options],
    queryFn: async () => {
      console.log('🏷️ [HOOK] Fetching brands...');
      const data = await brandsService.getBrands(options);
      console.log('🏷️ [HOOK] Brands returned:', data.length, 'brands');
      return data as Brand[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour - brands rarely change
    gcTime: 2 * 60 * 60 * 1000, // 2 hours cache (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when tab switches
    refetchOnReconnect: false, // Don't refetch on network recovery
    placeholderData: (previousData) => previousData, // Keep showing old data while fetching
  });
  
  console.log('📊 [HOOK STATE] useBrands:', {
    data: result.data?.length || 0,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error?.message,
    status: result.status
  });
  
  return result;
}

/**
 * Hook to fetch a single brand by slug
 * Features:
 * - 30 minute stale time
 * - 1 hour cache
 * - Only enabled when slug exists
 */
export function useBrand(slug: string) {
  return useQuery({
    queryKey: ['brand', slug],
    queryFn: async () => {
      console.log(`🏷️ Fetching brand: ${slug}`);
      const data = await brandsService.getBrandBySlug(slug);
      return data as Brand;
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch brand products with infinite scroll
 * Features:
 * - Pagination support
 * - getNextPageParam for infinite scroll
 * - 5 minute stale time
 * - Filter support
 */
export function useBrandProducts(brandId: string, filters?: {
  category?: string;
  sortBy?: string;
}) {
  return useInfiniteQuery<BrandProductsResponse, Error, BrandProductsResponse, (string | undefined)[]>({
    queryKey: ['brand-products', brandId, filters?.category, filters?.sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      console.log(`📦 Fetching products for brand ${brandId}, page ${pageParam}`);
      const data = await brandsService.getBrandProducts(brandId, {
        ...filters,
        page: pageParam as number,
        limit: 12
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch brand collections
 * Features:
 * - 30 minute stale time
 * - 1 hour cache
 * - Only enabled when brandId exists
 */
export function useBrandCollections(brandId: string) {
  return useQuery({
    queryKey: ['brand-collections', brandId],
    queryFn: async () => {
      console.log(`🎯 Fetching collections for brand ${brandId}`);
      const data = await brandsService.getBrandCollections(brandId);
      return data as Collection[];
    },
    enabled: !!brandId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
