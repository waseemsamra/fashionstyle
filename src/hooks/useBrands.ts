// hooks/useBrands.ts
import { useState, useEffect } from 'react';
import { brandService, type Brand } from '@/services/brandService';

export function useBrands(options?: { featured?: boolean; limit?: number }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    brandService.getAllBrands(options)
      .then(data => {
        console.log('✅ Loaded', data.length, 'brands');
        setBrands(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Failed to load brands:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [options?.featured, options?.limit]);

  return { brands, loading, error };
}

export function useFeaturedBrands(limit: number = 10) {
  return useBrands({ featured: true, limit });
}

// Re-export types
export type { Brand };
export type Collection = any;
