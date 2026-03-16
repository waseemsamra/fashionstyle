export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  maxQuantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

class CartService {
  private baseUrl = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';
  private listeners: Set<(cart: Cart) => void> = new Set();

  // API Methods
  async getCart(userId: string): Promise<Cart> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/users/${userId}/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }

    const data = await response.json();
    return this.transformCart(data);
  }

  async addToCart(userId: string, item: CartItem): Promise<Cart> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/users/${userId}/cart/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error('Failed to add to cart');
    }

    const data = await response.json();
    const cart = this.transformCart(data);
    this.notifyListeners(cart);
    return cart;
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<Cart> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/users/${userId}/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      throw new Error('Failed to update cart');
    }

    const data = await response.json();
    const cart = this.transformCart(data);
    this.notifyListeners(cart);
    return cart;
  }

  async removeFromCart(userId: string, itemId: string): Promise<Cart> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/users/${userId}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove from cart');
    }

    const data = await response.json();
    const cart = this.transformCart(data);
    this.notifyListeners(cart);
    return cart;
  }

  async clearCart(userId: string): Promise<Cart> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/users/${userId}/cart`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }

    const emptyCart = { items: [], total: 0, itemCount: 0 };
    this.notifyListeners(emptyCart);
    return emptyCart;
  }

  async mergeCarts(userId: string, localCart: Cart): Promise<Cart> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/users/${userId}/cart/merge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: localCart.items }),
    });

    if (!response.ok) {
      throw new Error('Failed to merge carts');
    }

    const data = await response.json();
    return this.transformCart(data);
  }

  // Local Storage Methods (for guests)
  getLocalCart(): Cart {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { items: [], total: 0, itemCount: 0 };
      }
    }
    return { items: [], total: 0, itemCount: 0 };
  }

  saveLocalCart(cart: Cart): void {
    localStorage.setItem('cart', JSON.stringify(cart));
    this.notifyListeners(cart);
  }

  addToLocalCart(item: CartItem): Cart {
    const cart = this.getLocalCart();
    
    const existingItem = cart.items.find(i => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

    cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    this.saveLocalCart(cart);
    return cart;
  }

  updateLocalItemQuantity(itemId: string, quantity: number): Cart {
    const cart = this.getLocalCart();
    
    const item = cart.items.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      
      cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      cart.itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      
      this.saveLocalCart(cart);
    }
    
    return cart;
  }

  removeFromLocalCart(itemId: string): Cart {
    const cart = this.getLocalCart();
    
    cart.items = cart.items.filter(i => i.id !== itemId);
    cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    this.saveLocalCart(cart);
    return cart;
  }

  clearLocalCart(): Cart {
    const emptyCart = { items: [], total: 0, itemCount: 0 };
    localStorage.removeItem('cart');
    this.notifyListeners(emptyCart);
    return emptyCart;
  }

  // Transform API response to Cart format
  private transformCart(data: any): Cart {
    const items = data.items || [];
    return {
      items: items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        maxQuantity: item.maxQuantity || 10,
      })),
      total: items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
      itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    };
  }

  // Cross-tab sync
  subscribe(listener: (cart: Cart) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(cart: Cart) {
    this.listeners.forEach(listener => listener(cart));
  }
}

export const cartService = new CartService();
