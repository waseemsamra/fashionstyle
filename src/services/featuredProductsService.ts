// services/featuredProductsService.ts - localStorage-based featured products management
import { API_CONFIG } from '@/config/api';

const FEATURED_COLLECTION_KEY = 'featuredCollection';

export interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  isFeatured: boolean;
}

export const featuredProductsService = {
  // Save featured collection to localStorage
  saveFeaturedCollection: (productIds: string[]) => {
    try {
      localStorage.setItem(FEATURED_COLLECTION_KEY, JSON.stringify(productIds));
      console.log(`✅ Saved ${productIds.length} products to featured collection`);
    } catch (error) {
      console.error('❌ Failed to save featured collection:', error);
    }
  },

  // Get featured product IDs from localStorage
  getFeaturedIds: (): string[] => {
    try {
      const featuredIds = localStorage.getItem(FEATURED_COLLECTION_KEY);
      
      if (featuredIds) {
        return JSON.parse(featuredIds);
      }
      
      // Initialize with default featured products if localStorage is empty
      const defaultFeaturedIds = [
        'product-1775598268005', // Feathers Pret Printed Lawn 3 Piece Suit Maham
        'product-1775567299177', // Aniiq by Charizma Embroidered Linen Suits
        'product-1775597695512', // Feathers Pret Printed Lawn 3 Piece Suit Ela
        'product-1775724903507', // Ravish by Ruby Suleiman Unstitched Embroidered Lawn
        'product-1775595575696'  // Dhaga Kids Pret Solids Jersy 2 Piece
      ];
      
      // Save default featured products to localStorage
      featuredProductsService.saveFeaturedCollection(defaultFeaturedIds);
      console.log('🎯 Initialized default featured products collection');
      
      return defaultFeaturedIds;
    } catch (error) {
      console.error('❌ Failed to get featured IDs:', error);
      return [];
    }
  },

  // Get featured products with full details
  getFeaturedProducts: async (): Promise<FeaturedProduct[]> => {
    try {
      console.log('📦 Fetching featured products...');
      
      // Get featured IDs from localStorage
      const featuredIds = featuredProductsService.getFeaturedIds();
      
      if (featuredIds.length === 0) {
        console.log('No featured products found in localStorage');
        return [];
      }

      // Fetch all products from main API
      const response = await fetch(`${API_CONFIG.productsApi}?limit=1000`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - Failed to fetch products`);
      }
      
      const data = await response.json();
      const allProducts = data.items || data.products || [];
      
      // Filter products that are in featured collection
      const featuredProducts = allProducts
        .filter((product: any) => featuredIds.includes(product.id))
        .map((product: any) => ({
          ...product,
          isFeatured: true
        }));

      console.log(`✅ Found ${featuredProducts.length} featured products`);
      return featuredProducts;
    } catch (error) {
      console.error('❌ Failed to get featured products:', error);
      return [];
    }
  },

  // Toggle product featured status
  toggleFeatured: (productId: string) => {
    try {
      const featuredIds = featuredProductsService.getFeaturedIds();
      const isCurrentlyFeatured = featuredIds.includes(productId);
      
      let newFeaturedIds: string[];
      if (isCurrentlyFeatured) {
        // Remove from featured
        newFeaturedIds = featuredIds.filter(id => id !== productId);
        console.log(`🗑️ Removed product ${productId} from featured collection`);
      } else {
        // Add to featured
        newFeaturedIds = [...featuredIds, productId];
        console.log(`⭐ Added product ${productId} to featured collection`);
      }
      
      featuredProductsService.saveFeaturedCollection(newFeaturedIds);
      return !isCurrentlyFeatured;
    } catch (error) {
      console.error('❌ Failed to toggle featured status:', error);
      return false;
    }
  },

  // Check if product is featured
  isFeatured: (productId: string): boolean => {
    const featuredIds = featuredProductsService.getFeaturedIds();
    return featuredIds.includes(productId);
  },

  // Clear all featured products
  clearFeatured: () => {
    try {
      localStorage.removeItem(FEATURED_COLLECTION_KEY);
      console.log('🗑️ Cleared all featured products');
    } catch (error) {
      console.error('❌ Failed to clear featured products:', error);
    }
  }
};
