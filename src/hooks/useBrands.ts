import { useState, useEffect, useCallback } from 'react';
import { brandService, type Brand, type BrandFilters } from '@/services/brandService';

interface UseBrandsReturn {
  brands: Brand[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useBrands(filters?: BrandFilters): UseBrandsReturn {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      console.log('🏷️ [HOOK] Fetching brands...');
      
      const data = await brandService.getAllBrands(filters);
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
  }, [filters?.featured, filters?.search, filters?.minProducts, filters?.limit]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return {
    brands,
    isLoading,
    isError,
    error,
    refetch: fetchBrands
  };
}

export function useFeaturedBrands(limit: number = 10) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        setIsLoading(true);
        setIsError(false);
        console.log('🏷️ [HOOK] Fetching featured brands, limit:', limit);
        
        const data = await brandService.getFeaturedBrands(limit);
        setBrands(data);
        console.log('🏷️ [HOOK] Featured brands loaded:', data.length);
      } catch (error) {
        setIsError(true);
        console.error('❌ [HOOK] Error fetching featured brands:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeatured();
  }, [limit]);

  return { brands, isLoading, isError };
}

export function useBrand(slug: string | undefined) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function fetchBrand() {
      if (!slug) return;
      
      try {
        setIsLoading(true);
        setIsError(false);
        console.log('🏷️ [HOOK] Fetching brand:', slug);
        
        const data = await brandService.getBrandBySlug(slug);
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

    fetchBrand();
  }, [slug]);

  return { brand, isLoading, isError };
}

export function useBrandProducts(brandName: string | undefined, limit: number = 20) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (!brandName) return;
      
      try {
        setIsLoading(true);
        console.log('📦 [HOOK] Fetching products for brand:', brandName);
        
        const data = await brandService.getBrandProducts(brandName, limit);
        setProducts(data);
        console.log('📦 [HOOK] Brand products loaded:', data.length);
      } catch (error) {
        console.error('❌ [HOOK] Error fetching brand products:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [brandName, limit]);

  return { products, isLoading };
}

export function useBrandCollections(_brandId: string | undefined) {
  return {
    data: [] as any[],
    isLoading: false,
  };
}

// Re-export types
export type { Brand, BrandFilters };
export type Collection = any;
