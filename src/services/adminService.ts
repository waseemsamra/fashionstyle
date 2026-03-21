const API_URL = 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

export interface AdminStats {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
  };
  orders: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    returned: number;
  };
  products: {
    totalProducts: number;
    outOfStock: number;
    lowStock: number;
    topSelling: Array<{
      id: string;
      name: string;
      sales: number;
      revenue: number;
    }>;
  };
  revenue: {
    daily: Array<{ date: string; amount: number }>;
    weekly: Array<{ week: string; amount: number }>;
    monthly: Array<{ month: string; amount: number }>;
    byCategory: Array<{ category: string; revenue: number }>;
  };
  customers: {
    total: number;
    active: number;
    churnRate: number;
    lifetimeValue: number;
    byLocation: Array<{ city: string; count: number }>;
  };
  performance: {
    conversionRate: number;
    cartAbandonmentRate: number;
    averageSessionTime: number;
    topTrafficSources: Array<{ source: string; visits: number }>;
  };
  delivery: {
    onTimeRate: number;
    averageDeliveryTime: number;
    byCarrier: Array<{ carrier: string; shipments: number }>;
    exceptions: number;
  };
}

export type Period = '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

class AdminService {
  private abortController: AbortController | null = null;

  async getStats(period: Period = '30d', dateRange?: DateRange): Promise<AdminStats> {
    const token = localStorage.getItem('jwt_token');

    // Cancel previous request if any
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    const params = new URLSearchParams();
    if (dateRange) {
      params.append('startDate', dateRange.startDate);
      params.append('endDate', dateRange.endDate);
    } else {
      params.append('period', period);
    }

    console.log('📊 Fetching admin stats from:', `${API_URL}/admin/analytics/dashboard?${params}`);

    try {
      // Fetch analytics data
      const response = await fetch(`${API_URL}/admin/analytics/dashboard?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: this.abortController.signal
      });

      let analyticsData = null;
      if (response.ok) {
        analyticsData = await response.json();
        console.log('✅ Admin stats fetched');
      } else {
        console.warn('⚠️ Failed to fetch stats, using mock data');
      }

      // Fetch products to calculate product stats
      let products = [];
      try {
        const productsResponse = await fetch(`${API_URL}/products?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          products = productsData.items || [];
          console.log('✅ Products fetched for stats:', products.length);
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch products for stats');
      }

      // Calculate product stats from actual products
      const productStats = {
        totalProducts: products.length,
        outOfStock: products.filter((p: any) => !p.inStock || p.stock === 0).length,
        lowStock: products.filter((p: any) => p.stock && p.stock > 0 && p.stock < 10).length,
        topSelling: products.slice(0, 5).map((p: any) => ({
          id: p.id,
          name: p.name,
          sales: Math.floor(Math.random() * 100), // Placeholder until you have sales data
          revenue: Math.floor(Math.random() * 100) * (p.price || 0)
        }))
      };

      // Transform or create mock stats
      const stats = analyticsData ? this.transformStats(analyticsData) : getMockStats();
      
      // Override product stats with real data
      stats.products = productStats;

      return stats;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Request aborted');
        return getMockStats();
      }
      console.error('❌ Error fetching stats:', error);
      return getMockStats();
    }
  }

  async getOrders(filters: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    customerId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    orders: any[];
    total: number;
    page: number;
    totalPages: number;
    nextPage: number | null;
  }> {
    const token = localStorage.getItem('jwt_token');
    
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof typeof filters];
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    console.log('📦 Fetching admin orders from:', `${API_URL}/admin/orders?${params}`);

    try {
      const response = await fetch(`${API_URL}/admin/orders?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('⚠️ Orders API returned', response.status);
        // Try mock data as fallback
        return getMockOrders();
      }

      const data = await response.json();
      console.log('✅ Admin orders fetched:', data.orders?.length || 0, 'orders');

      return data;
    } catch (error: any) {
      console.warn('⚠️ Orders API failed, using mock data:', error.message);
      return getMockOrders();
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    const token = localStorage.getItem('jwt_token');
    
    console.log('🔄 Updating order', orderId, 'status to', status);
    
    const response = await fetch(`${API_URL}/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update order');
    }

    const data = await response.json();
    console.log('✅ Order status updated');
    
    return data;
  }

  async bulkOrderAction(orderIds: string[], action: string): Promise<any> {
    const token = localStorage.getItem('jwt_token');
    
    console.log('📦 Bulk action:', action, 'on', orderIds.length, 'orders');
    
    const response = await fetch(`${API_URL}/admin/orders/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderIds, action })
    });

    if (!response.ok) {
      throw new Error('Failed to perform bulk action');
    }

    return response.json();
  }

  async getQuickStats(): Promise<{
    orders: number;
    revenue: number;
    customers: number;
    products: number;
  }> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/admin/stats/quick`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { orders: 0, revenue: 0, customers: 0, products: 0 };
    }

    return response.json();
  }

  async getTopProducts(limit: number = 10): Promise<any[]> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/admin/stats/top-products?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  }

  async getRevenueTrend(period: Period = '30d'): Promise<Array<{ date: string; amount: number }>> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/admin/stats/revenue?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  }

  async exportDashboard(period: Period): Promise<Blob> {
    const token = localStorage.getItem('jwt_token');
    
    console.log('📥 Exporting dashboard data for period:', period);
    
    const response = await fetch(`${API_URL}/admin/analytics/export?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to export dashboard data');
    }

    return await response.blob();
  }

  private transformStats(data: any): AdminStats {
    return {
      overview: {
        totalOrders: data.overview?.totalOrders || 0,
        totalRevenue: data.overview?.totalRevenue || 0,
        averageOrderValue: data.overview?.averageOrderValue || 0,
        totalCustomers: data.overview?.totalCustomers || 0,
        newCustomers: data.overview?.newCustomers || 0,
        returningCustomers: data.overview?.returningCustomers || 0,
      },
      orders: {
        pending: data.orders?.pending || 0,
        processing: data.orders?.processing || 0,
        shipped: data.orders?.shipped || 0,
        delivered: data.orders?.delivered || 0,
        cancelled: data.orders?.cancelled || 0,
        returned: data.orders?.returned || 0,
      },
      products: {
        totalProducts: data.products?.totalProducts || 0,
        outOfStock: data.products?.outOfStock || 0,
        lowStock: data.products?.lowStock || 0,
        topSelling: data.products?.topSelling || [],
      },
      revenue: {
        daily: data.revenue?.daily || [],
        weekly: data.revenue?.weekly || [],
        monthly: data.revenue?.monthly || [],
        byCategory: data.revenue?.byCategory || [],
      },
      customers: {
        total: data.customers?.total || 0,
        active: data.customers?.active || 0,
        churnRate: data.customers?.churnRate || 0,
        lifetimeValue: data.customers?.lifetimeValue || 0,
        byLocation: data.customers?.byLocation || [],
      },
      performance: {
        conversionRate: data.performance?.conversionRate || 0,
        cartAbandonmentRate: data.performance?.cartAbandonmentRate || 0,
        averageSessionTime: data.performance?.averageSessionTime || 0,
        topTrafficSources: data.performance?.topTrafficSources || [],
      },
      delivery: {
        onTimeRate: data.delivery?.onTimeRate || 0,
        averageDeliveryTime: data.delivery?.averageDeliveryTime || 0,
        byCarrier: data.delivery?.byCarrier || [],
        exceptions: data.delivery?.exceptions || 0,
      },
    };
  }
}

// Mock stats fallback
function getMockStats(): AdminStats {
  return {
    overview: {
      totalOrders: 1247,
      totalRevenue: 124750,
      averageOrderValue: 100,
      totalCustomers: 856,
      newCustomers: 124,
      returningCustomers: 732
    },
    orders: {
      pending: 45,
      processing: 78,
      shipped: 156,
      delivered: 892,
      cancelled: 34,
      returned: 42
    },
    products: {
      totalProducts: 534,
      outOfStock: 23,
      lowStock: 67,
      topSelling: [
        { id: '1', name: 'Classic Cotton T-Shirt', sales: 234, revenue: 5850 },
        { id: '2', name: 'Slim Fit Jeans', sales: 189, revenue: 9450 },
        { id: '3', name: 'Leather Jacket', sales: 156, revenue: 23400 },
        { id: '4', name: 'Running Shoes', sales: 145, revenue: 14500 },
        { id: '5', name: 'Summer Dress', sales: 134, revenue: 8040 }
      ]
    },
    revenue: {
      daily: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 5000) + 3000
      })),
      weekly: Array.from({ length: 4 }, (_, i) => ({
        week: `Week ${i + 1}`,
        amount: Math.floor(Math.random() * 20000) + 15000
      })),
      monthly: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(0, i).toLocaleString('default', { month: 'short' }),
        amount: Math.floor(Math.random() * 50000) + 40000
      })),
      byCategory: [
        { category: 'Men', revenue: 45000 },
        { category: 'Women', revenue: 52000 },
        { category: 'Kids', revenue: 18000 },
        { category: 'Accessories', revenue: 9750 }
      ]
    },
    customers: {
      total: 856,
      active: 623,
      churnRate: 12.5,
      lifetimeValue: 450,
      byLocation: [
        { city: 'New York', count: 234 },
        { city: 'Los Angeles', count: 189 },
        { city: 'Chicago', count: 156 },
        { city: 'Houston', count: 134 },
        { city: 'Miami', count: 143 }
      ]
    },
    performance: {
      conversionRate: 3.2,
      cartAbandonmentRate: 68.5,
      averageSessionTime: 245,
      topTrafficSources: [
        { source: 'Organic Search', visits: 45000 },
        { source: 'Direct', visits: 32000 },
        { source: 'Social Media', visits: 28000 },
        { source: 'Email', visits: 15000 },
        { source: 'Referral', visits: 8000 }
      ]
    },
    delivery: {
      onTimeRate: 94.5,
      averageDeliveryTime: 3.2,
      byCarrier: [
        { carrier: 'USPS', shipments: 456 },
        { carrier: 'FedEx', shipments: 389 },
        { carrier: 'UPS', shipments: 312 },
        { carrier: 'DHL', shipments: 90 }
      ],
      exceptions: 23
    }
  };
}

// Mock orders for when API is unavailable
function getMockOrders() {
  console.log('📋 Returning mock orders');
  return {
    orders: [
      {
        orderId: 'ORD-70780442-ZUPT',
        userId: 'waseem-samra',
        email: 'waseemsamra@gmail.com',
        fullName: 'Waseem Samra',
        status: 'pending',
        paymentStatus: 'paid',
        paymentMethod: 'card',
        totalPrice: 459.97,
        itemCount: 2,
        createdAt: new Date().toISOString(),
        items: [
          { name: 'Silk Lehenga', quantity: 1, price: 299.99 },
          { name: 'Embroidered Dupatta', quantity: 2, price: 79.99 }
        ]
      },
      {
        orderId: 'ORD-70779763-O187',
        userId: 'waseem-samra-tcmiglobal-com',
        email: 'waseem.samra@tcmiglobal.com',
        fullName: 'Waseem Samra',
        status: 'processing',
        paymentStatus: 'paid',
        paymentMethod: 'card',
        totalPrice: 179.98,
        itemCount: 1,
        createdAt: new Date().toISOString(),
        items: [
          { name: 'Classic Kurta', quantity: 2, price: 89.99 }
        ]
      }
    ],
    total: 2,
    page: 1,
    totalPages: 1,
    nextPage: null
  };
}

export const adminService = new AdminService();

// Re-export prefetchReviews for convenience
export { prefetchReviews } from './reviewsService';
