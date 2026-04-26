// services/orderManagement.ts - Order flow, inventory, and vendor management

const API_URL = import.meta.env.VITE_API_URL || 'https://zbdw3piterihfqm37o3swldeca0qitsj.lambda-url.us-east-1.on.aws';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'vendor-notified'
  | 'vendor-accepted'
  | 'vendor-rejected'
  | 'processing'
  | 'ready-to-ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type VendorStatus = 'pending' | 'accepted' | 'rejected' | null;

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface OrderItem {
  id?: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  brand?: string;
  sku?: string;
}

export interface Order {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  email: string;
  status: OrderStatus;
  vendorStatus: VendorStatus;
  vendorEmail?: string;
  vendorNotifiedAt?: string;
  vendorAcceptedAt?: string;
  vendorRejectedReason?: string;
  inventoryReserved: boolean;
  inventoryDeducted: boolean;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentConfirmedAt?: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  items: OrderItem[];
  customer: {
    fullName: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode?: string;
    phone?: string;
  };
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  timeline: OrderTimelineEvent[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Order Status Flow Configuration
export const ORDER_STATUS_FLOW = {
  pending: {
    next: ['confirmed', 'cancelled'],
    label: 'Pending',
    color: 'yellow',
    icon: '⏳',
    description: 'Order placed, awaiting payment confirmation',
  },
  confirmed: {
    next: ['vendor-notified', 'processing', 'cancelled'],
    label: 'Confirmed',
    color: 'blue',
    icon: '✅',
    description: 'Payment confirmed, preparing to send to vendor',
  },
  'vendor-notified': {
    next: ['vendor-accepted', 'vendor-rejected', 'cancelled'],
    label: 'Vendor Notified',
    color: 'purple',
    icon: '📧',
    description: 'Vendor has been notified, awaiting acceptance',
  },
  'vendor-accepted': {
    next: ['processing', 'cancelled'],
    label: 'Vendor Accepted',
    color: 'indigo',
    icon: '🤝',
    description: 'Vendor has accepted the order',
  },
  'vendor-rejected': {
    next: ['pending', 'cancelled'],
    label: 'Vendor Rejected',
    color: 'red',
    icon: '❌',
    description: 'Vendor rejected the order, admin review needed',
  },
  processing: {
    next: ['ready-to-ship', 'cancelled'],
    label: 'Processing',
    color: 'orange',
    icon: '🔄',
    description: 'Order is being prepared for shipment',
  },
  'ready-to-ship': {
    next: ['shipped', 'cancelled'],
    label: 'Ready to Ship',
    color: 'teal',
    icon: '📦',
    description: 'Order is packed and ready for dispatch',
  },
  shipped: {
    next: ['delivered'],
    label: 'Shipped',
    color: 'cyan',
    icon: '🚚',
    description: 'Order has been shipped',
  },
  delivered: {
    next: ['returned'],
    label: 'Delivered',
    color: 'green',
    icon: '🏠',
    description: 'Order has been delivered to customer',
  },
  cancelled: {
    next: [],
    label: 'Cancelled',
    color: 'gray',
    icon: '🚫',
    description: 'Order has been cancelled',
  },
  returned: {
    next: [],
    label: 'Returned',
    color: 'gray',
    icon: '↩️',
    description: 'Order has been returned',
  },
} as const;

// Helper functions
const getAuthToken = (): string | null => {
  return localStorage.getItem('jwt_token');
};

const apiRequest = async (
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> => {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Order Management API
export const orderManagementApi = {
  // Update order status with automatic flow handling
  updateOrderStatus: async (orderId: string, newStatus: OrderStatus, note?: string) => {
    const order = await orderManagementApi.getOrder(orderId);
    
    // Validate status transition
    const currentStatus = order.status as OrderStatus;
    const allowedNext: OrderStatus[] = ORDER_STATUS_FLOW[currentStatus].next as unknown as OrderStatus[];

    if (!allowedNext.includes(newStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedNext.join(', ')}`);
    }

    // Handle inventory
    let inventoryAction = null;
    if (newStatus === 'confirmed' && !order.inventoryReserved) {
      inventoryAction = 'reserve';
    } else if (newStatus === 'delivered' && !order.inventoryDeducted) {
      inventoryAction = 'deduct';
    } else if (newStatus === 'cancelled' && order.inventoryReserved && !order.inventoryDeducted) {
      inventoryAction = 'release';
    }

    // Handle vendor notification
    let vendorAction = null;
    if (newStatus === 'vendor-notified') {
      vendorAction = 'notify';
    }

    const updateData: any = {
      orderId,
      status: newStatus,
      note,
      inventoryAction,
      vendorAction,
      updatedAt: new Date().toISOString(),
    };

    // Add timeline event
    const timelineEvent: OrderTimelineEvent = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      note,
      updatedBy: 'admin',
    };

    updateData.timelineEvent = timelineEvent;

    return apiRequest(`/admin/orders/${orderId}/status`, 'PATCH', updateData);
  },

  // Get order details
  getOrder: async (orderId: string): Promise<Order> => {
    return apiRequest(`/admin/orders/${orderId}`);
  },

  // Get all orders with filters
  getOrders: async (filters?: {
    status?: OrderStatus;
    vendorStatus?: VendorStatus;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.vendorStatus) params.append('vendorStatus', filters.vendorStatus);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    return apiRequest(`/admin/orders${queryString ? `?${queryString}` : ''}`);
  },

  // Send vendor notification
  notifyVendor: async (orderId: string, vendorEmail: string) => {
    return apiRequest(`/admin/orders/${orderId}/notify-vendor`, 'POST', {
      orderId,
      vendorEmail,
      notifiedAt: new Date().toISOString(),
    });
  },

  // Vendor accepts order
  vendorAccept: async (orderId: string) => {
    return apiRequest(`/admin/orders/${orderId}/vendor-accept`, 'POST', {
      orderId,
      acceptedAt: new Date().toISOString(),
    });
  },

  // Vendor rejects order
  vendorReject: async (orderId: string, reason: string) => {
    return apiRequest(`/admin/orders/${orderId}/vendor-reject`, 'POST', {
      orderId,
      reason,
      rejectedAt: new Date().toISOString(),
    });
  },

  // Update tracking info
  updateTracking: async (orderId: string, trackingNumber: string, courierName: string) => {
    return apiRequest(`/admin/orders/${orderId}/tracking`, 'PATCH', {
      trackingNumber,
      courierName,
    });
  },

  // Get inventory status for products in order
  checkInventory: async (orderId: string) => {
    return apiRequest(`/admin/orders/${orderId}/inventory-check`);
  },

  // Get orders awaiting vendor response
  getPendingVendorOrders: async () => {
    return apiRequest('/admin/orders/vendor-pending');
  },

  // Get low stock alerts
  getLowStockAlerts: async (threshold: number = 10) => {
    return apiRequest(`/admin/inventory/low-stock?threshold=${threshold}`);
  },

  // Bulk update order status
  bulkUpdateStatus: async (orderIds: string[], newStatus: OrderStatus, note?: string) => {
    return apiRequest('/admin/orders/bulk-status', 'POST', {
      orderIds,
      status: newStatus,
      note,
      updatedAt: new Date().toISOString(),
    });
  },

  // Get order statistics
  getStats: async (period: string = '30d') => {
    return apiRequest(`/admin/orders/stats?period=${period}`);
  },
};

// Status utility functions
export const getStatusConfig = (status: OrderStatus) => {
  return ORDER_STATUS_FLOW[status] || {
    label: status,
    color: 'gray',
    icon: '❓',
    next: [] as OrderStatus[],
    description: 'Unknown status',
  };
};

// Alias for compatibility
export const getOrderConfig = getStatusConfig;

export const canTransition = (from: OrderStatus, to: OrderStatus): boolean => {
  const nextStatuses: readonly OrderStatus[] = ORDER_STATUS_FLOW[from].next as unknown as readonly OrderStatus[];
  return nextStatuses.includes(to);
};

export const getNextPossibleStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
  const nextStatuses = ORDER_STATUS_FLOW[currentStatus].next as unknown as OrderStatus[];
  return [...nextStatuses];
};
