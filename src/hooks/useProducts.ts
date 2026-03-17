// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';

export function useProduct(productIdentifier: string | undefined) {
  return useQuery({
    queryKey: ['product', productIdentifier],
    queryFn: async () => {
      if (!productIdentifier) return null;
      
      console.log('🔍 Looking for product:', productIdentifier);
      
      // Extract numeric ID from slug (e.g., "cotton-kurta--3" -> "3")
      const extractId = (slug: string): string => {
        const parts = slug.split('--');
        return parts[parts.length - 1];
      };
      
      const searchId = extractId(productIdentifier);
      console.log('🔍 Extracted ID:', searchId);
      
      // Fetch all products
      const response = await fetch('https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/products');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      const products = data.items || [];
      
      console.log('📊 Got', products.length, 'products');
      
      // Find product by ID
      const product = products.find((p: any) => String(p.id) === String(searchId));
      
      if (!product) {
        console.error('❌ Product not found. Available IDs:', products.map((p: any) => p.id).slice(0, 10));
        return null;
      }
      
      console.log('✅ Found product:', product.name);
      return product;
    },
    enabled: !!productIdentifier,
    staleTime: 5 * 60 * 1000,
  });
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/products');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      return data.items || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};
