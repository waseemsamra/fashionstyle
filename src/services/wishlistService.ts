import { API_CONFIG } from '../config/api';

class WishlistService {
  private baseUrl = API_CONFIG.baseApiUrl;
  private productsApi = API_CONFIG.productsApi;
  private listeners: Set<(items: any[]) => void> = new Set();

  async getWishlist(userId: string) {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${this.baseUrl}/users/${userId}/wishlist`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch wishlist');
    const data = await response.json();
    return data.items || [];
  }

  async toggleWishlist(userId: string, productId: string) {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${this.baseUrl}/users/${userId}/wishlist/toggle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId })
    });
    if (!response.ok) throw new Error('Failed to toggle wishlist');
    const data = await response.json();
    this.notifyListeners(data.wishlist);
    return data;
  }

  async batchUpdate(userId: string, productIds: string[], action: 'add' | 'remove') {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${this.baseUrl}/users/${userId}/wishlist/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productIds, action })
    });
    if (!response.ok) throw new Error('Batch update failed');
    return response.json();
  }

  async getProductsByIds(productIds: string[]) {
    if (productIds.length === 0) return [];
    // Use the products read API (ckj2m3ffzt) to fetch products by IDs
    const idsParam = productIds.join(',');
    const response = await fetch(`${this.productsApi}/?ids=${encodeURIComponent(idsParam)}&limit=${productIds.length}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.items || [];
  }

  async updateNotificationPreferences(userId: string, productId: string, preferences: any) {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${this.baseUrl}/users/${userId}/wishlist/${productId}/notifications`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferences)
    });
    if (!response.ok) throw new Error('Failed to update notification preferences');
    return response.json();
  }

  subscribe(listener: (items: any[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(items: any[]) {
    this.listeners.forEach(listener => listener(items));
  }
}

export const wishlistService = new WishlistService();
