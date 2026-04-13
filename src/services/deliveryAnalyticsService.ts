export interface AnalyticsOverview {
  period: string;
  dateRange: { start: string; end: string };
  summary: {
    totalOrders: number;
    deliveredOrders: number;
    inTransitOrders: number;
    onTimeDeliveries: number;
    onTimeRate: number;
    averageDeliveryTime: string;
    totalShippingCost: string;
    averageShippingCost: string;
    totalReturns: number;
    returnRate: string;
    exceptions: number;
    exceptionRate: number;
  };
  trends: {
    orders: number;
    deliveryTime: number;
    cost: number;
    returns: number;
  };
}

export interface TimelineData {
  interval: string;
  data: Array<{
    date: string;
    orders: number;
    delivered: number;
    shipped: number;
    exceptions: number;
    shippingCost: number;
  }>;
}

export interface MethodPerformance {
  method: string;
  orders: number;
  delivered: number;
  onTime: number;
  avgDeliveryTime: string;
  avgShippingCost: string;
  onTimeRate: number;
  exceptionRate: number;
}

export interface ZonePerformance {
  zone: string;
  orders: number;
  delivered: number;
  onTime: number;
  avgDeliveryTime: string;
  avgShippingCost: string;
  onTimeRate: number;
  exceptionRate: number;
}

export interface CarrierPerformance {
  carrier: string;
  shipments: number;
  delivered: number;
  onTime: number;
  avgDeliveryTime: string;
  avgCost: string;
  onTimeRate: number;
  exceptionRate: number;
  deliveryRate: number;
}

export interface DeliveryForecast {
  forecast: Array<{
    date: string;
    dayOfWeek: string;
    forecastVolume: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
  }>;
  metadata: {
    basedOn: number;
    avgDailyVolume: number;
    method: string;
  };
}

export interface DeliveryCosts {
  period: string;
  groupBy: string;
  summary: {
    totalCost: string;
    avgCostPerOrder: string;
    totalOrders: number;
  };
  timeline: Array<{
    date: string;
    totalCost: number;
    orderCount: number;
    avgCost: number;
    byMethod: Record<string, number>;
    byCarrier: Record<string, number>;
  }>;
  breakdown: {
    byMethod: Record<string, number>;
    byCarrier: Record<string, number>;
  };
}

export interface ReturnAnalytics {
  summary: {
    totalReturns: number;
    totalRefundAmount: string;
    avgRefundAmount: string;
    returnRate: number;
  };
  byReason: Record<string, number>;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byMethod: Record<string, { orders: number; returns: number; returnRate: number }>;
  timeline: Array<{
    date: string;
    returns: number;
    refundAmount: number;
  }>;
}

const API_BASE = 'https://tmdoc0q5ij.execute-api.us-east-1.amazonaws.com';

class DeliveryAnalyticsService {
  async getOverview(period: string = '30d'): Promise<AnalyticsOverview> {
    try {
      const response = await fetch(`${API_BASE}/admin/analytics/delivery/overview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics overview');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      throw error;
    }
  }

  async getTimeline(period: string = '30d', interval: string = 'day'): Promise<TimelineData> {
    try {
      const response = await fetch(`${API_BASE}/admin/analytics/delivery/timeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period, interval })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching timeline:', error);
      throw error;
    }
  }

  async getMethodPerformance(period: string = '30d'): Promise<MethodPerformance[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/analytics/delivery/methods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch method performance');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching method performance:', error);
      throw error;
    }
  }

  async getZonePerformance(period: string = '30d'): Promise<ZonePerformance[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/analytics/delivery/zones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch zone performance');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching zone performance:', error);
      throw error;
    }
  }

  async getCarrierPerformance(period: string = '30d'): Promise<CarrierPerformance[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/analytics/delivery/carriers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch carrier performance');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching carrier performance:', error);
      throw error;
    }
  }

  async getDeliveryExceptions(period: string = '30d', type?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/admin/analytics/delivery/exceptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period, type })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch delivery exceptions');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching delivery exceptions:', error);
      throw error;
    }
  }

  async getDeliveryForecast(days: number = 30): Promise<DeliveryForecast> {
    try {
      const response = await fetch(`${API_BASE}/admin/analytics/delivery/forecast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch delivery forecast');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching delivery forecast:', error);
      throw error;
    }
  }

  async getDeliveryCosts(period: string = '30d', groupBy: string = 'day'): Promise<DeliveryCosts> {
    try {
      const response = await fetch(`${API_BASE}/admin/analytics/delivery/costs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period, groupBy })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch delivery costs');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching delivery costs:', error);
      throw error;
    }
  }

  async getReturnAnalytics(period: string = '30d'): Promise<ReturnAnalytics> {
    try {
      const response = await fetch(`${API_BASE}/admin/analytics/delivery/returns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch return analytics');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching return analytics:', error);
      throw error;
    }
  }
}

export default new DeliveryAnalyticsService();
