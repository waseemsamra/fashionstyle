// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

async function fetchAllProducts(): Promise<any[]> {
  const allProducts: any[] = [];
  const seenIds = new Set<string>();
  let page = 1;
  const limit = 500;
  const MAX_PAGES = 10; // Safety limit: max 5000 products
  let hasMore = true;

  do {
    const url = `${API_URL}/products?limit=${limit}&page=${page}`;
    console.log('📡 Fetching products from:', url);
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();
    const items = data.items || [];
    console.log('📦 Got', items.length, 'products from page', page);
    
    // Filter out duplicates to detect when Lambda returns same page
    const newItems = items.filter((item: { id: string }) => !seenIds.has(item.id));
    newItems.forEach((item: { id: string }) => seenIds.add(item.id));
    allProducts.push(...newItems);
    
    console.log(`📊 Total unique products so far: ${allProducts.length}`);
    
    // Stop if: no items, fewer items than limit, hit max pages, or got duplicates (same page repeated)
    if (items.length === 0 || items.length < limit || newItems.length === 0 || page >= MAX_PAGES) {
      hasMore = false;
      if (newItems.length === 0) {
        console.log('⚠️ Stopping: Lambda returned duplicate products (same page)');
      }
    } else {
      page++;
    }
  } while (hasMore);

  console.log('✅ Total unique products fetched:', allProducts.length);
  return allProducts;
}

export function useProduct(productIdentifier: string | undefined) {
  return useQuery({
    queryKey: ['product', productIdentifier],
    queryFn: async () => {
      if (!productIdentifier) {
        console.warn('⚠️ No product identifier provided');
        return null;
      }

      console.log('🔍 Looking for product:', productIdentifier);

      // Extract numeric ID from slug (e.g., "cotton-kurta--3" -> "3")
      const extractId = (slug: string): string => {
        const parts = slug.split('--');
        return parts[parts.length - 1];
      };

      const searchId = extractId(productIdentifier);
      console.log('🔍 Extracted ID:', searchId);

      try {
        // Fetch all products from API (handling pagination)
        const products = await fetchAllProducts();

        console.log('📊 Searching in', products.length, 'products');

        // Find product by ID
        const product = products.find((p: any) => String(p.id) === String(searchId));

        if (!product) {
          console.error('❌ Product not found. Searched for ID:', searchId);
          console.log('Available IDs:', products.map((p: any) => p.id).join(', '));
          return null;
        }

        console.log('✅ Found product:', product.name, product.id);
        return product;
      } catch (err: any) {
        console.error('❌ Error fetching product:', err.message);
        throw err;
      }
    },
    enabled: !!productIdentifier,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Use fetchAllProducts to get ALL products with pagination
      return await fetchAllProducts();
    },
    staleTime: 5 * 60 * 1000,
  });
};
