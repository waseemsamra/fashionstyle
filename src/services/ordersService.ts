const API_URL = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod?: {
    type: string;
    last4?: string;
  };
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery: string;
  events: TrackingEvent[];
}

class OrdersService {
  async getUserOrders(userId: string, filters?: OrderFilters): Promise<{
    orders: Order[];
    total: number;
    page: number;
    nextPage: number | null;
  }> {
    const token = localStorage.getItem('jwt_token');
    
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${API_URL}/users/${userId}/orders?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  }

  async getOrder(orderId: string): Promise<Order> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Order not found');
    }

    return response.json();
  }

  async getOrderStats(userId: string): Promise<OrderStats> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/users/${userId}/orders/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order stats');
    }

    return response.json();
  }

  async trackOrder(orderId: string): Promise<TrackingInfo> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/orders/${orderId}/tracking`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tracking info');
    }

    return response.json();
  }

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      throw new Error('Failed to cancel order');
    }
  }

  async returnOrder(orderId: string, items: string[], reason: string): Promise<void> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/orders/${orderId}/return`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items, reason })
    });

    if (!response.ok) {
      throw new Error('Failed to submit return request');
    }
  }

  async reorder(orderId: string): Promise<{ cartId: string }> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/orders/${orderId}/reorder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to reorder');
    }

    return response.json();
  }

  async downloadInvoice(orderId: string): Promise<Blob> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/orders/${orderId}/invoice`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }

    return response.blob();
  }

  async createOrder(orderData: {
    items: { productId: string; quantity: number; variant?: string }[];
    shippingAddressId: string;
    paymentMethodId?: string;
  }): Promise<Order> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    return response.json();
  }
}

export const ordersService = new OrdersService();
