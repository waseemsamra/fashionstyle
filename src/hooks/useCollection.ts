// hooks/useCollection.ts - Unified hook for fetching collection products
import { useState, useEffect } from 'react';
import { api } from '@/services/api';

/**
 * useCollection Hook - Fetches products from a specific collection
 * 
 * THE FORMULA: One system for ALL home page sections
 * - Admin saves selected product IDs to a collection
 * - Home page fetches ONLY those products (NO scanning 1K-30K products)
 * - Super fast: 50-100ms regardless of total product count
 * 
 * Usage:
 *   const { products, loading, error } = useCollection('featuredCollection');
 *   const { products, loading, error } = useCollection('designersDiscount');
 *   const { products, loading, error } = useCollection('weddingTales');
 */

interface UseCollectionResult {
  products: any[];
  collection: any;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCollection(collectionName: string): UseCollectionResult {
  const [products, setProducts] = useState<any[]>([]);
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📦 Fetching collection: ${collectionName}...`);
      const result = await api.getCollection(collectionName);
      
      console.log(`✅ Collection ${collectionName} loaded:`, result.count, 'products');
      setCollection(result.collection);
      setProducts(result.products);
    } catch (err) {
      console.error(`❌ Failed to fetch collection ${collectionName}:`, err);
      setError(err as Error);
      setProducts([]);
      setCollection(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!collectionName) {
      setLoading(false);
      return;
    }
    
    fetchCollection();
  }, [collectionName]);

  return {
    products,
    collection,
    loading,
    error,
    refetch: fetchCollection,
  };
}

/**
 * Hook to save products to a collection
 * 
 * Usage:
 *   const { save, saving, error } = useSaveCollection('featuredCollection');
 *   await save({ productIds: ['prod-1', 'prod-2'], displayName: 'Featured' });
 */

interface UseSaveCollectionResult {
  save: (data: { 
    productIds: string[]; 
    displayName?: string;
    description?: string;
    metadata?: any;
  }) => Promise<any>;
  saving: boolean;
  error: Error | null;
}

export function useSaveCollection(collectionName: string): UseSaveCollectionResult {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const save = async (data: { 
    productIds: string[]; 
    displayName?: string;
    description?: string;
    metadata?: any;
  }) => {
    try {
      setSaving(true);
      setError(null);
      
      console.log(`💾 Saving collection ${collectionName}:`, data.productIds.length, 'products');
      const result = await api.saveCollection(collectionName, data);
      
      console.log(`✅ Collection ${collectionName} saved successfully`);
      return result;
    } catch (err) {
      console.error(`❌ Failed to save collection ${collectionName}:`, err);
      setError(err as Error);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    save,
    saving,
    error,
  };
}
