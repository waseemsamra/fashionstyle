// hooks/useFeaturedProducts.ts - Hook for fetching featured products from Collections API
import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/api';

interface UseFeaturedProductsResult {
  products: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  toggleFeatured: (productId: string, isFeatured: boolean) => Promise<void>;
}

export function useFeaturedProducts(): UseFeaturedProductsResult {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 Fetching featured products from Collections API...');
      
      const response = await fetch(`${API_CONFIG.collectionsApiUrl}featured`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - Failed to fetch featured products`);
      }
      
      const data = await response.json();
      const featuredProducts = Array.isArray(data) ? data : [];
      
      console.log(`✅ Featured products loaded:`, featuredProducts.length, 'products');
      
      setProducts(featuredProducts);
    } catch (err) {
      console.error('❌ Failed to fetch featured products:', err);
      setError(err as Error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (productId: string, isFeatured: boolean) => {
    try {
      console.log(`🔄 Updating featured status for product ${productId}: ${isFeatured}`);
      
      const response = await fetch(`${API_CONFIG.collectionsApiUrl}featured/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - Failed to update featured status`);
      }
      
      // Refresh the featured products list
      await fetchFeaturedProducts();
      
      console.log(`✅ Updated featured status for product ${productId}`);
    } catch (err) {
      console.error('❌ Failed to update featured status:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchFeaturedProducts,
    toggleFeatured
  };
}
