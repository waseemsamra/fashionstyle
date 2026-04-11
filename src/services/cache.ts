// services/cache.ts - Browser-side caching for products and categories
// Stores data in localStorage for instant loads

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_PREFIX = 'fashionstore_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const cache = {
  /**
   * Get cached data if not expired
   */
  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      if (Date.now() > entry.expiresAt) {
        // Expired - remove it
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      console.log(`⚡ Cache hit: ${key} (${Array.isArray(entry.data) ? entry.data.length : 'object'} items)`);
      return entry.data;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  },

  /**
   * Set data in cache with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlMs,
      };

      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
      console.log(`💾 Cached: ${key} (expires in ${ttlMs / 1000}s)`);
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  },

  /**
   * Check if cache exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  },

  /**
   * Remove specific cache
   */
  remove(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key);
    console.log(`🗑️ Cache cleared: ${key}`);
  },

  /**
   * Clear all caches
   */
  clear(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
    console.log('🧹 All caches cleared');
  },

  /**
   * Get cache stats
   */
  getStats(): { count: number; totalSize: number; keys: string[] } {
    let totalSize = 0;
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const value = localStorage.getItem(key) || '';
        totalSize += value.length;
        keys.push(key.replace(CACHE_PREFIX, ''));
      }
    }

    return {
      count: keys.length,
      totalSize,
      keys,
    };
  },
};

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  COLLECTION_PREFIX: 'collection_',
};

export function getCollectionCacheKey(collectionId: string): string {
  return `${CACHE_KEYS.COLLECTION_PREFIX}${collectionId}`;
}
