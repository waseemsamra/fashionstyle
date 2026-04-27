export interface ReturnItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface ReturnRequest {
  returnId: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: ReturnItem[];
  reason: string;
  comments?: string;
  images?: string[];
  status: string;
  requestDate: string;
  returnWindow: {
    eligible: boolean;
    daysRemaining: number;
    deadline: string;
  };
  estimatedRefund: number;
  shippingCost: number;
  totalRefund?: number;
  refundAmount?: number;
  refundMethod?: string;
  refundTransaction?: any;
  returnTrackingNumber?: string;
  returnCarrier?: string;
  exchange?: any;
  adminNotes?: string;
  timeline: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
}

export interface ReturnCalculation {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    refundAmount: number;
  }>;
  subtotal: number;
  shipping: number;
  restockingFee: number;
  totalRefund: number;
}

export interface ReturnLabel {
  returnId: string;
  trackingNumber: string;
  carrier: string;
  labelUrl: string;
  instructions: string;
}

export interface ExchangeRequest {
  exchangeId: string;
  items: ReturnItem[];
  originalTotal: number;
  exchangeTotal: number;
  priceDifference: number;
  status: string;
  paymentRequired: number;
  refundAmount: number;
}

export const RETURN_REASONS = {
  SIZE_TOO_SMALL: 'Size too small',
  SIZE_TOO_LARGE: 'Size too large',
  NOT_AS_DESCRIBED: 'Not as described',
  DEFECTIVE: 'Defective item',
  DAMAGED: 'Damaged during shipping',
  WRONG_ITEM: 'Wrong item received',
  STYLE_NOT_SUITABLE: 'Style not suitable',
  COLOR_DIFFERENT: 'Color different from picture',
  NO_LONGER_NEEDED: 'No longer needed',
  BETTER_PRICE_ELSEWHERE: 'Found better price elsewhere',
  OTHER: 'Other'
};

export const RETURN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  AWAITING_RETURN: 'awaiting_return',
  ITEM_RECEIVED: 'item_received',
  QUALITY_CHECK: 'quality_check',
  REFUND_PENDING: 'refund_pending',
  REFUNDED: 'refunded',
  EXCHANGE_INITIATED: 'exchange_initiated',
  EXCHANGE_SHIPPED: 'exchange_shipped',
  EXCHANGE_DELIVERED: 'exchange_delivered',
  CLOSED: 'closed'
};

export const REFUND_METHODS = {
  ORIGINAL_PAYMENT: 'original_payment',
  STORE_CREDIT: 'store_credit',
  GIFT_CARD: 'gift_card',
  BANK_TRANSFER: 'bank_transfer'
};

const API_BASE = import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws';

class ReturnsService {
  async getReturnReasons(): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${API_BASE}/admin/returns/reasons`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch return reasons');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching return reasons:', error);
      return RETURN_REASONS;
    }
  }

  async getReturns(params?: {
    customerId?: string;
    status?: string;
    limit?: number;
    lastKey?: string;
  }): Promise<{ items: ReturnRequest[]; nextKey?: string; count: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.customerId) queryParams.append('customerId', params.customerId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.lastKey) queryParams.append('lastKey', params.lastKey);
      
      const response = await fetch(`${API_BASE}/admin/returns?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch returns');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching returns:', error);
      return { items: [], count: 0 };
    }
  }

  async getReturn(returnId: string): Promise<ReturnRequest> {
    try {
      const response = await fetch(`${API_BASE}/admin/returns/${returnId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch return');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching return:', error);
      throw error;
    }
  }

  async requestReturn(data: {
    orderId: string;
    items: ReturnItem[];
    reason: string;
    comments?: string;
    images?: string[];
  }): Promise<ReturnRequest> {
    try {
      const response = await fetch(`${API_BASE}/admin/returns/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request return');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error requesting return:', error);
      throw error;
    }
  }

  async calculateReturn(data: {
    orderId: string;
    items: ReturnItem[];
  }): Promise<ReturnCalculation> {
    try {
      const response = await fetch(`${API_BASE}/admin/returns/calculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate return');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error calculating return:', error);
      throw error;
    }
  }

  async generateReturnLabel(returnId: string, carrier?: string): Promise<ReturnLabel> {
    try {
      const response = await fetch(`${API_BASE}/admin/returns/label`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ returnId, carrier })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate return label');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error generating return label:', error);
      throw error;
    }
  }

  async updateReturnStatus(
    returnId: string,
    status: string,
    note?: string,
    data?: any
  ): Promise<ReturnRequest> {
    try {
      const response = await fetch(`${API_BASE}/admin/returns/${returnId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, note, ...data })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update return status');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating return status:', error);
      throw error;
    }
  }

  async processRefund(
    returnId: string,
    data: {
      refundMethod?: string;
      amount?: number;
      notes?: string;
    }
  ): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/admin/returns/process-refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ returnId, ...data })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process refund');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  async processExchange(
    returnId: string,
    exchangeItems: ReturnItem[]
  ): Promise<ExchangeRequest> {
    try {
      const response = await fetch(`${API_BASE}/admin/returns/exchange`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ returnId, exchangeItems })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process exchange');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error processing exchange:', error);
      throw error;
    }
  }

  async getReturnStats(period?: 'week' | 'month' | 'quarter' | 'year'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/admin/returns/stats?period=${period || 'month'}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch return stats');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching return stats:', error);
      return null;
    }
  }

  async cancelReturn(returnId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/admin/returns/${returnId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel return');
      }
    } catch (error) {
      console.error('Error canceling return:', error);
      throw error;
    }
  }
}

export default new ReturnsService();
