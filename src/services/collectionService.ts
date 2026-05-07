// services/collectionService.ts - Generic collection service for ALL home page sections

export interface CollectionProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  isFeatured?: boolean;
}

export interface CollectionInfo {
  count: number;
  productIds: string[];
  lastUpdated: string;
  exists: boolean;
}

export const collectionService = {
  // Get storage key for specific collection
  getStorageKey: (collectionId: string): string => {
    return `collection_${collectionId}`;
  },

  // Save collection - persists forever
  saveCollection: (collectionId: string, productIds: string[]): boolean => {
    try {
      const storageKey = collectionService.getStorageKey(collectionId);
      localStorage.setItem(storageKey, JSON.stringify(productIds));
      console.log(`✅ Collection '${collectionId}' saved to localStorage`);
      console.log(`   Storage key: ${storageKey}`);
      console.log(`   Saved ${productIds.length} products`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to save collection '${collectionId}':`, error);
      return false;
    }
  },

  // Save collection with timestamp
  saveWithTimestamp: (collectionId: string, productIds: string[]): boolean => {
    const success = collectionService.saveCollection(collectionId, productIds);
    if (success) {
      // Save timestamp
      const timestampKey = `${collectionService.getStorageKey(collectionId)}_timestamp`;
      localStorage.setItem(timestampKey, new Date().toISOString());
      console.log(`✅ Timestamp saved for collection '${collectionId}'`);
    }
    return success;
  },

  // Load collection - works even after refresh
  getCollection: (collectionId: string): string[] => {
    try {
      const storageKey = collectionService.getStorageKey(collectionId);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const collection = JSON.parse(saved);
        console.log(`✅ Loaded ${collection.length} products for collection '${collectionId}'`);
        console.log(`📦 Storage key: ${storageKey}`);
        console.log(`📦 Product IDs:`, collection);
        return Array.isArray(collection) ? collection : [];
      }
      console.log(`❌ No saved collection found for '${collectionId}'`);
      console.log(`📦 Storage key: ${storageKey}`);
      
      // Only initialize with defaults if this is first-time setup
      // Check if collection has been initialized before
      const initializedKey = `${storageKey}_initialized`;
      const wasInitialized = localStorage.getItem(initializedKey);
      
      if (!wasInitialized) {
        console.log(`🆕 First-time setup for '${collectionId}', initializing with defaults`);
        const defaultIds = collectionService.getDefaultProducts(collectionId);
        collectionService.saveCollection(collectionId, defaultIds);
        localStorage.setItem(initializedKey, 'true');
        return defaultIds;
      }
      
      console.log(`⚠️ Collection '${collectionId}' was cleared - returning empty array`);
      return [];
    } catch (error) {
      console.error(`❌ Failed to load collection '${collectionId}':`, error);
      return [];
    }
  },

  // Get default products for each collection type
  getDefaultProducts: (collectionId: string): string[] => {
    const defaults: Record<string, string[]> = {
      featuredCollection: [
        'product-1775598268005', // Feathers Pret Printed Lawn 3 Piece Suit Maham
        'product-1775567299177', // Aniiq by Charizma Embroidered Linen Suits
        'product-1775597695512', // Feathers Pret Printed Lawn 3 Piece Suit Ela
        'product-1775724903507', // Ravish by Ruby Suleiman Unstitched Embroidered Lawn
        'product-1775595575696', // Dhaga Kids Pret Solids Jersy 2 Piece
        'product-1775594489248', // Dhaga Women Pret Printed 2 Piece Soft Crepe
        'product-1775597243578', // Chirpy Cherry by Feathers Pret Printed Lawn
        'product-1775574963690'  // Silcot Pret Printed Lawn 2 Piece Suit
      ],
      weddingTales: [
        'product-1775598268005', // Feathers Pret Printed Lawn 3 Piece Suit Maham (Bridal Wear)
        'product-1775567299177', // Aniiq by Charizma Embroidered Linen Suits (Bridal Wear)
        'product-1775724903507', // Ravish by Ruby Suleiman Unstitched Embroidered Lawn (Formal Wear)
        'product-1775597243578', // Chirpy Cherry by Feathers Pret Printed Lawn (New Arrivals)
        'product-1775574963690', // Silcot Pret Printed Lawn 2 Piece Suit (Accessories)
        'product-1775595575696', // Dhaga Kids Pret Solids Jersy 2 Piece (Winter Collection)
        'product-1775594489248', // Dhaga Women Pret Printed 2 Piece Soft Crepe (Festive Collection)
        'product-1775597695512'  // Feathers Pret Printed Lawn 3 Piece Suit Ela (Casual Wear)
      ],
      newArrivals: [
        'product-1775597243578', // Chirpy Cherry by Feathers Pret Printed Lawn
        'product-1775574963690', // Silcot Pret Printed Lawn 2 Piece Suit
        'product-1775595575696', // Dhaga Kids Pret Solids Jersy 2 Piece
        'product-1775594489248', // Dhaga Women Pret Printed 2 Piece Soft Crepe
        'product-1775598268005', // Feathers Pret Printed Lawn 3 Piece Suit Maham
        'product-1775567299177', // Aniiq by Charizma Embroidered Linen Suits
        'product-1775597695512', // Feathers Pret Printed Lawn 3 Piece Suit Ela
        'product-1775724903507'  // Ravish by Ruby Suleiman Unstitched Embroidered Lawn
      ],
      designersDiscount: [
        'product-1775598268005', // Feathers Pret Printed Lawn 3 Piece Suit Maham
        'product-1775567299177', // Aniiq by Charizma Embroidered Linen Suits
        'product-1775597695512', // Feathers Pret Printed Lawn 3 Piece Suit Ela
        'product-1775724903507', // Ravish by Ruby Suleiman Unstitched Embroidered Lawn
        'product-1775595575696', // Dhaga Kids Pret Solids Jersy 2 Piece
        'product-1775594489248', // Dhaga Women Pret Printed 2 Piece Soft Crepe
        'product-1775597243578', // Chirpy Cherry by Feathers Pret Printed Lawn
        'product-1775574963690'  // Silcot Pret Printed Lawn 2 Piece Suit
      ],
      summerSale: [
        'product-1775594489248', // Dhaga Women Pret Printed 2 Piece Soft Crepe (Summer Collection)
        'product-1775597243578', // Chirpy Cherry by Feathers Pret Printed Lawn (New Arrivals)
        'product-1775574963690', // Silcot Pret Printed Lawn 2 Piece Suit (Accessories)
        'product-1775595575696', // Dhaga Kids Pret Solids Jersy 2 Piece (Winter Collection)
        'product-1775598268005', // Feathers Pret Printed Lawn 3 Piece Suit Maham
        'product-1775567299177', // Aniiq by Charizma Embroidered Linen Suits
        'product-1775597695512', // Feathers Pret Printed Lawn 3 Piece Suit Ela
        'product-1775724903507'  // Ravish by Ruby Suleiman Unstitched Embroidered Lawn
      ]
    };
    
    return defaults[collectionId] || [];
  },

  // Get collection info
  getCollectionInfo: (collectionId: string): CollectionInfo => {
    const collection = collectionService.getCollection(collectionId);
    const productIds = Array.isArray(collection) ? collection : [];
    const timestampKey = `${collectionService.getStorageKey(collectionId)}_timestamp`;
    
    return {
      count: productIds.length,
      productIds: productIds,
      lastUpdated: localStorage.getItem(timestampKey) || 'Unknown',
      exists: productIds.length > 0
    };
  },

  // Check if collection exists
  hasCollection: (collectionId: string): boolean => {
    const storageKey = collectionService.getStorageKey(collectionId);
    const saved = localStorage.getItem(storageKey);
    return saved !== null && saved !== undefined;
  },

  // Clear collection
  clearCollection: (collectionId: string): boolean => {
    try {
      const storageKey = collectionService.getStorageKey(collectionId);
      const timestampKey = `${storageKey}_timestamp`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem(timestampKey);
      console.log(`✅ Collection '${collectionId}' cleared from localStorage`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to clear collection '${collectionId}':`, error);
      return false;
    }
  },

  // Get all collections info
  getAllCollectionsInfo: (): Record<string, CollectionInfo> => {
    const collections = ['featuredCollection', 'weddingTales', 'newArrivals', 'designersDiscount', 'summerSale'];
    const info: Record<string, CollectionInfo> = {};
    
    collections.forEach(collectionId => {
      info[collectionId] = collectionService.getCollectionInfo(collectionId);
    });
    
    return info;
  }
};
