import { useState, useEffect } from 'react';
import { brandsService, type Brand } from '@/services/brandsService';

interface UseBrandsOptions {
  featured?: boolean;
  limit?: number;
}

export function useBrands(options?: UseBrandsOptions) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBrands() {
      try {
        setIsLoading(true);
        setIsError(false);
        console.log('🏷️ [HOOK] Fetching brands...');
        
        let data: Brand[];
        
        if (options?.featured) {
          console.log('🏷️ [HOOK] Fetching featured brands, limit:', options.limit || 10);
          data = await brandsService.getFeaturedBrands(options.limit || 10);
        } else {
          data = await brandsService.getBrands();
        }
        
        setBrands(data);
        console.log('🏷️ [HOOK] Brands loaded:', data.length);
      } catch (err) {
        setIsError(true);
        const errorObj = err instanceof Error ? err : new Error('Failed to fetch brands');
        setError(errorObj);
        console.error('❌ [HOOK] Error in useBrands:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBrands();
  }, [options?.featured, options?.limit]);

  return {
    data: brands,
    isLoading,
    isError,
    error,
    status: isLoading ? 'loading' : isError ? 'error' : 'success'
  };
}

export function useBrand(slug: string) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function fetchBrand() {
      try {
        setIsLoading(true);
        console.log('🏷️ [HOOK] Fetching brand:', slug);
        
        const data = await brandsService.getBrandBySlug(slug);
        setBrand(data);
        
        if (data) {
          console.log('🏷️ [HOOK] Brand found:', data.name);
        } else {
          console.warn('🏷️ [HOOK] Brand not found:', slug);
        }
      } catch (err) {
        setIsError(true);
        console.error('❌ [HOOK] Error in useBrand:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchBrand();
    }
  }, [slug]);

  return { brand, isLoading, isError };
}

// Placeholder hooks for future implementation
export function useBrandProducts(_brandId: string, _filters?: { category?: string; sortBy?: string }) {
  return {
    data: { pages: [] as any[] },
    isLoading: false,
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
  };
}

export function useBrandCollections(_brandId: string) {
  return {
    data: [] as any[],
    isLoading: false,
  };
}

// Re-export Brand type
export type { Brand };
export type Collection = any;
