// hooks/useFeaturedProducts.ts - Hook for managing featured products with COMPLETE PERSISTENCE
import { useState, useEffect } from 'react';
import { featuredProductsService } from '@/services/featuredProductsService';

interface UseFeaturedProductsResult {
  products: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  toggleFeatured: (productId: string) => boolean;
  isFeatured: (productId: string) => boolean;
  saveCollection: (productIds: string[]) => boolean;
  clearCollection: () => void;
  collectionInfo: any;
}

export function useFeaturedProducts(): UseFeaturedProductsResult {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [collectionInfo, setCollectionInfo] = useState<any>(null);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 Fetching featured products from persistent storage...');
      
      const featuredProducts = await featuredProductsService.getFeaturedProducts();
      const info = featuredProductsService.getCollectionInfo();
      
      setProducts(featuredProducts);
      setCollectionInfo(info);
      
      console.log(`✅ Loaded ${featuredProducts.length} featured products from persistent storage`);
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
      const currentCollection = featuredProductsService.getFeaturedCollection();
      const isCurrentlyFeatured = currentCollection.includes(productId);
      
      let newCollection: string[];
      if (isCurrentlyFeatured) {
        // Remove from featured
        newCollection = currentCollection.filter(id => id !== productId);
        console.log(`🗑️ Removed product ${productId} from featured collection`);
      } else {
        // Add to featured
        newCollection = [...currentCollection, productId];
        console.log(`⭐ Added product ${productId} to featured collection`);
      }
      
      // Save with timestamp for persistence
      const success = featuredProductsService.saveWithTimestamp(newCollection);
      
      if (success) {
        // Refresh the featured products list
        fetchFeaturedProducts();
      }
      
      return !isCurrentlyFeatured;
    } catch (err) {
      console.error('❌ Failed to toggle featured status:', err);
      return false;
    }
  };

  const isFeatured = (productId: string): boolean => {
    return featuredProductsService.isFeatured(productId);
  };

  const saveCollection = (productIds: string[]): boolean => {
    const success = featuredProductsService.saveWithTimestamp(productIds);
    if (success) {
      fetchFeaturedProducts();
    }
    return success;
  };

  const clearCollection = (): void => {
    featuredProductsService.clearCollection();
    fetchFeaturedProducts();
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
    isFeatured,
    saveCollection,
    clearCollection,
    collectionInfo
  };
}
