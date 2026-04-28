// hooks/useFeaturedProducts.ts - Hook for managing featured products using localStorage
import { useState, useEffect } from 'react';
import { featuredProductsService } from '@/services/featuredProductsService';

interface UseFeaturedProductsResult {
  products: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  toggleFeatured: (productId: string) => boolean;
  isFeatured: (productId: string) => boolean;
}

export function useFeaturedProducts(): UseFeaturedProductsResult {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 Fetching featured products from localStorage...');
      
      const featuredProducts = await featuredProductsService.getFeaturedProducts();
      
      setProducts(featuredProducts);
    } catch (err) {
      console.error('❌ Failed to fetch featured products:', err);
      setError(err as Error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = (productId: string): boolean => {
    try {
      const isNowFeatured = featuredProductsService.toggleFeatured(productId);
      
      // Refresh the featured products list
      fetchFeaturedProducts();
      
      return isNowFeatured;
    } catch (err) {
      console.error('❌ Failed to toggle featured status:', err);
      return false;
    }
  };

  const isFeatured = (productId: string): boolean => {
    return featuredProductsService.isFeatured(productId);
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchFeaturedProducts,
    toggleFeatured,
    isFeatured
  };
}
