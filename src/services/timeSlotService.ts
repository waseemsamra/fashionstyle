export interface TimeSlotConfig {
  enabled: boolean;
  advanceBookingDays: number;
  slotDuration: number;
  maxSlotsPerDay: number;
  bufferTime: number;
  blackoutDates: string[];
  holidays: string[];
  pricingTiers: {
    standard: { enabled: boolean; price: number; name: string };
    premium: { enabled: boolean; price: number; name: string };
    express: { enabled: boolean; price: number; name: string };
  };
  timeWindows: Array<{
    start: string;
    end: string;
    tier: string;
    maxSlots: number;
  }>;
  zoneRestrictions: Record<string, any>;
  customerTiers: {
    regular: { maxSlots: number; priority: number };
    premium: { maxSlots: number; priority: number };
    vip: { maxSlots: number; priority: number };
  };
}

export interface TimeSlot {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  zone: string;
  tier: string;
  maxCapacity: number;
  bookedCount: number;
  availableCount: number;
  price: number;
  status: 'available' | 'limited' | 'full' | 'blocked';
  message?: string;
}

export interface SlotBooking {
  id: string;
  slotId: string;
  customerId: string;
  orderId: string;
  tier: string;
  price: number;
  bookedAt: string;
  status: 'confirmed' | 'cancelled' | 'completed';
}

export interface SlotAvailability {
  date: string;
  zone: string;
  customerTier: string;
  slots: (TimeSlot & {
    available: boolean;
    customerCanBook: boolean;
    message?: string;
  })[];
}

export interface SlotAnalytics {
  summary: {
    totalSlots: number;
    bookedSlots: number;
    totalBookings: number;
    totalRevenue: string;
    utilization: string;
  };
  byTier: Record<string, { total: number; booked: number; revenue: number }>;
  byZone: Record<string, { total: number; booked: number }>;
  byHour: Record<string, { total: number; booked: number }>;
}

const API_BASE = 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

class TimeSlotService {
  async getConfig(): Promise<TimeSlotConfig> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch time slot config');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching time slot config:', error);
      throw error;
    }
  }

  async updateConfig(config: TimeSlotConfig): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update time slot config');
      }
    } catch (error) {
      console.error('Error updating time slot config:', error);
      throw error;
    }
  }

  async getSlots(params: {
    date?: string;
    zone?: string;
    tier?: string;
    limit?: number;
  }): Promise<TimeSlot[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/slots`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch time slots');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error;
    }
  }

  async getSlot(slotId: string): Promise<TimeSlot> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/slots/${slotId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch time slot');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching time slot:', error);
      throw error;
    }
  }

  async createSlot(slot: Omit<TimeSlot, 'id' | 'bookedCount' | 'availableCount' | 'status'>): Promise<TimeSlot> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/slots`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(slot)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create time slot');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error creating time slot:', error);
      throw error;
    }
  }

  async updateSlot(slotId: string, updates: Partial<TimeSlot>): Promise<TimeSlot> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/slots/${slotId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update time slot');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating time slot:', error);
      throw error;
    }
  }

  async deleteSlot(slotId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/slots/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete time slot');
      }
    } catch (error) {
      console.error('Error deleting time slot:', error);
      throw error;
    }
  }

  async getAvailability(params: {
    date: string;
    zone: string;
    customerId?: string;
    customerTier?: string;
  }): Promise<SlotAvailability> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/availability`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  }

  async bookSlot(data: {
    slotId: string;
    customerId: string;
    orderId: string;
    tier?: string;
  }): Promise<{ message: string; booking: SlotBooking; slot: TimeSlot }> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/book`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to book time slot');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error booking slot:', error);
      throw error;
    }
  }

  async blockSlots(data: {
    date: string;
    startTime: string;
    endTime: string;
    zone: string;
    reason: string;
  }): Promise<{ message: string; blockedSlots: string[] }> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to block time slots');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error blocking slots:', error);
      throw error;
    }
  }

  async getPricingTiers(): Promise<TimeSlotConfig['pricingTiers']> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/tiers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pricing tiers');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching pricing tiers:', error);
      throw error;
    }
  }

  async getAnalytics(params: {
    startDate?: string;
    endDate?: string;
    zone?: string;
  }): Promise<SlotAnalytics> {
    try {
      const response = await fetch(`${API_BASE}/admin/timeslots/analytics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch slot analytics');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching slot analytics:', error);
      throw error;
    }
  }
}

export default new TimeSlotService();
