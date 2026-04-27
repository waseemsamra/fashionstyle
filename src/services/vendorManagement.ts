// services/vendorManagement.ts - Complete vendor management with CRUD

const API_URL = import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws';

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  description?: string;
  logo?: string;
  bannerImage?: string;
  brands: string[]; // Brand names this vendor handles
  categories: string[]; // Categories they sell
  status: 'active' | 'inactive' | 'suspended';
  commissionRate: number; // Percentage
  paymentTerms: string; // e.g., "Net 30", "Net 60"
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
  };
  taxInfo?: {
    taxId?: string;
    taxRate?: number;
  };
  metrics: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageRating: number;
    responseTime: number; // hours
  };
  createdAt: string;
  updatedAt: string;
  lastOrderAt?: string;
  notes?: string;
}

export interface VendorOrder {
  orderId: string;
  orderNumber: string;
  vendorId: string;
  vendorName: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  vendorStatus: 'pending' | 'accepted' | 'processing' | 'shipped' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

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

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return { success: true };
};

export const vendorApi = {
  // ===== CREATE =====
  createVendor: async (vendor: Omit<Vendor, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'metrics'>) => {
    return apiRequest('/admin/vendors', 'POST', vendor);
  },

  // ===== READ =====
  getAllVendors: async (filters?: {
    status?: 'active' | 'inactive' | 'suspended';
    search?: string;
    brand?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    return apiRequest(`/admin/vendors${queryString ? `?${queryString}` : ''}`);
  },

  getVendorById: async (id: string) => {
    return apiRequest(`/admin/vendors/${id}`);
  },

  getVendorBySlug: async (slug: string) => {
    return apiRequest(`/admin/vendors/slug/${slug}`);
  },

  getVendorStats: async (id: string, period: string = '30d') => {
    return apiRequest(`/admin/vendors/${id}/stats?period=${period}`);
  },

  // ===== UPDATE =====
  updateVendor: async (id: string, updates: Partial<Vendor>) => {
    return apiRequest(`/admin/vendors/${id}`, 'PUT', updates);
  },

  // ===== DELETE =====
  deleteVendor: async (id: string) => {
    return apiRequest(`/admin/vendors/${id}`, 'DELETE');
  },

  // ===== VENDOR ORDERS =====
  getVendorOrders: async (vendorId: string, filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    return apiRequest(`/admin/vendors/${vendorId}/orders${queryString ? `?${queryString}` : ''}`);
  },

  // ===== NOTIFICATIONS =====
  notifyVendor: async (vendorId: string, subject: string, message: string) => {
    return apiRequest(`/admin/vendors/${vendorId}/notify`, 'POST', {
      subject,
      message,
      sentAt: new Date().toISOString(),
    });
  },

  // ===== BRAND ASSOCIATION =====
  addVendorBrand: async (vendorId: string, brand: string) => {
    return apiRequest(`/admin/vendors/${vendorId}/brands`, 'POST', { brand });
  },

  removeVendorBrand: async (vendorId: string, brand: string) => {
    return apiRequest(`/admin/vendors/${vendorId}/brands/${encodeURIComponent(brand)}`, 'DELETE');
  },

  // ===== BULK ACTIONS =====
  bulkUpdateStatus: async (vendorIds: string[], status: Vendor['status']) => {
    return apiRequest('/admin/vendors/bulk', 'POST', {
      vendorIds,
      action: 'updateStatus',
      status,
      updatedAt: new Date().toISOString(),
    });
  },

  // ===== ANALYTICS =====
  getVendorAnalytics: async (period: string = '30d') => {
    return apiRequest(`/admin/vendors/analytics?period=${period}`);
  },

  getTopVendors: async (limit: number = 10) => {
    return apiRequest(`/admin/vendors/top?limit=${limit}`);
  },
};
