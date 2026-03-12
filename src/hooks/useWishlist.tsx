import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Product } from '@/types';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  totalItems: number;
  loadWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'wishlist_items';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Failed to parse wishlist:', e);
      }
    }
  }, []);

  // Save to localStorage whenever items change
  const saveToStorage = useCallback((newItems: Product[]) => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(newItems));
  }, []);

  const addToWishlist = useCallback((product: Product) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems;
      }
      const newItems = [...prevItems, product];
      saveToStorage(newItems);
      return newItems;
    });
  }, [saveToStorage]);

  const removeFromWishlist = useCallback((productId: number) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== productId);
      saveToStorage(newItems);
      return newItems;
    });
  }, [saveToStorage]);

  const isInWishlist = useCallback(
    (productId: number) => {
      return items.some((item) => item.id === productId);
    },
    [items]
  );

  const totalItems = items.length;

  // Load wishlist from backend (for future implementation)
  const loadWishlist = useCallback(async () => {
    try {
      // TODO: Implement backend API call
      // const response = await api.get('/wishlist');
      // setItems(response.data);
      console.log('Wishlist loaded from storage:', items.length, 'items');
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  }, [items.length]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        totalItems,
        loadWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
