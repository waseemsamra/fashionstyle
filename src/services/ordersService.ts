export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus: 'paid' | 'unpaid' | 'refunded' | 'partially_refunded';
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  tracking?: TrackingInfo;
  timeline: OrderTimeline[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  returned: boolean;
  returnReason?: string;
}

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

export interface OrderTimeline {
  date: string;
  status: string;
  description: string;
  actor?: 'system' | 'user' | 'admin';
}

export interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  monthlySpending: Array<{
    month: string;
    amount: number;
  }>;
}

class OrdersService {
  private baseUrl = import.meta.env.VITE_USERS_API_URL || 'https://3rctw6carzadrs3okoemb4ccvi0rzxqy.lambda-url.us-east-1.on.aws';

  async getUserOrders(userId: string, params: any) {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    
    const url = new URL(`${this.baseUrl}/users/${encodedUserId}/orders`);
    Object.keys(params).forEach(key => 
      url.searchParams.append(key, params[key])
    );

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const data = await response.json();
    
    return {
      orders: data.items || [],
      total: data.total || 0,
      totalPages: data.totalPages || 1,
      currentPage: data.currentPage || 1,
      nextPage: data.currentPage < data.totalPages ? data.currentPage + 1 : undefined,
    };
  }

  async getOrder(orderId: string) {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    return response.json();
  }

  async getOrderStats(userId: string) {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/users/${userId}/orders/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order stats');
    }

    return response.json();
  }

  async trackOrder(orderId: string) {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/track`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to track order');
    }

    return response.json();
  }

  async cancelOrder(orderId: string, reason: string) {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel order');
    }

    return response.json();
  }

  async returnOrder(orderId: string, items: string[], reason: string) {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/return`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items, reason }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit return');
    }

    return response.json();
  }

  async reorder(orderId: string) {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/reorder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to reorder');
    }

    return response.json();
  }

  async downloadInvoice(orderId: string): Promise<Blob> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/invoice`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }

    return response.blob();
  }

  async getReturnLabel(orderId: string, itemIds: string[]): Promise<Blob> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/return-label`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: itemIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate return label');
    }

    return response.blob();
  }
}

export const ordersService = new OrdersService();
