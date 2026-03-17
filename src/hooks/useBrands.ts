// hooks/useBrands.ts
import { useState, useEffect } from 'react';
import { brandService, type Brand } from '@/services/brandService';

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    brandService.getAllBrands().then(data => {
      setBrands(data);
      setLoading(false);
    });
  }, []);

  return { brands, loading };
}

export function useFeaturedBrands(limit: number = 10) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    brandService.getFeaturedBrands(limit).then(data => {
      setBrands(data);
      setLoading(false);
    });
  }, [limit]);

  return { brands, loading };
}

export function useBrand(slug: string | undefined) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      brandService.getBrandBySlug(slug).then(data => {
        setBrand(data);
        setLoading(false);
      });
    }
  }, [slug]);

  return { brand, loading };
}

export function useBrandProducts(brandName: string | undefined, limit: number = 20) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (brandName) {
      brandService.getBrandProducts(brandName, limit).then(data => {
        setProducts(data);
        setLoading(false);
      });
    }
  }, [brandName, limit]);

  return { products, loading };
}

// Re-export types
export type { Brand };
export type Collection = any;
