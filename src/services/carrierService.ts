export interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  residential?: boolean;
}

export interface Package {
  weight: number;
  weightUnit: 'lb' | 'kg';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'in' | 'cm';
  value?: number;
  description?: string;
  hazardous?: boolean;
  signatureRequired?: boolean;
}

export interface Carrier {
  id: string;
  name: string;
  enabled: boolean;
  configured: boolean;
  services: Record<string, string>;
  settings?: {
    testMode?: boolean;
    labelFormat?: 'PDF' | 'ZPL' | 'EPL';
    shipFromAddress?: Address;
    [key: string]: any;
  };
  capabilities?: {
    tracking: boolean;
    rates: boolean;
    pickup: boolean;
    international: boolean;
    weekendDelivery: boolean;
  };
}

export interface Rate {
  carrier: string;
  carrierName: string;
  serviceId: string;
  serviceName: string;
  totalPrice: number;
  currency: string;
  transitDays: number;
  guaranteed: boolean;
  estimatedDelivery: string;
  cutoffTime?: string;
  SaturdayDelivery?: boolean;
  signatureRequired?: boolean;
  insurance?: {
    available: boolean;
    maxValue?: number;
    cost?: number;
  };
}

export interface ShipmentRequest {
  carrierId: string;
  serviceId: string;
  fromAddress: Address;
  toAddress: Address;
  package: Package;
  reference?: string;
  insurance?: {
    value: number;
    type: 'basic' | 'full';
  };
  signature?: boolean;
  saturdayDelivery?: boolean;
}

export interface ShipmentResponse {
  shipmentId: string;
  trackingNumber: string;
  labelUrl: string;
  labelFormat: 'PDF' | 'ZPL' | 'EPL';
  carrier: string;
  service: string;
  estimatedDelivery: string;
  cost: number;
  currency: string;
  createdAt: string;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  statusCode: string;
  location: string;
  description: string;
  signedBy?: string;
  exception?: string;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  events: TrackingEvent[];
  estimatedDelivery: string;
  actualDelivery?: string;
  deliveredTo?: string;
  signature?: string;
}

export interface CarrierCredentials {
  apiKey?: string;
  apiSecret?: string;
  accountNumber?: string;
  meterNumber?: string;
  testMode?: boolean;
  companyName?: string;
  address?: Address;
  phone?: string;
  email?: string;
}

export interface PickupRequest {
  carrierId: string;
  address: Address;
  date: string;
  timeWindow: {
    start: string;
    end: string;
  };
  packages: Array<{
    count: number;
    weight: number;
    type: 'envelope' | 'package' | 'pallet';
  }>;
  location?: 'front_door' | 'back_door' | 'loading_dock' | 'reception';
  instructions?: string;
}

export interface PickupResponse {
  confirmationNumber: string;
  carrier: string;
  scheduledDate: string;
  timeWindow: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const API_BASE = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';

class CarrierService {
  // Carrier Management
  async getAllCarriers(): Promise<Carrier[]> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch carriers');
      }
      
      const data = await response.json();
      localStorage.setItem('admin_carriers', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error fetching carriers:', error);
      throw error;
    }
  }

  async getCarrier(carrierId: string): Promise<Carrier> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers/${carrierId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch carrier');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching carrier:', error);
      throw error;
    }
  }

  async updateCarrier(carrierId: string, data: Partial<Carrier>): Promise<Carrier> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers/${carrierId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update carrier');
      }
      
      const updated = await response.json();
      
      // Update localStorage
      const cached = localStorage.getItem('admin_carriers');
      if (cached) {
        const carriers = JSON.parse(cached);
        const index = carriers.findIndex((c: Carrier) => c.id === carrierId);
        if (index >= 0) {
          carriers[index] = { ...carriers[index], ...data };
          localStorage.setItem('admin_carriers', JSON.stringify(carriers));
        }
      }
      
      return updated;
    } catch (error) {
      console.error('Error updating carrier:', error);
      throw error;
    }
  }

  // Credentials Management
  async saveCredentials(carrierId: string, credentials: CarrierCredentials): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers/credentials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ carrierId, credentials })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save credentials');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
  }

  async getCredentials(carrierId: string): Promise<CarrierCredentials> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers/credentials?carrierId=${carrierId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch credentials');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching credentials:', error);
      throw error;
    }
  }

  // Rate Shopping
  async getRates(
    fromAddress: Address,
    toAddress: Address,
    pkg: Package,
    carriers?: string[]
  ): Promise<{ rates: Rate[] }> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers/rates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fromAddress, toAddress, package: pkg, carriers })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get rates');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error getting rates:', error);
      throw error;
    }
  }

  // Shipment Creation
  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers/ship`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create shipment');
      }
      
      const shipment = await response.json();
      
      // Save to shipment history
      const history = localStorage.getItem('shipment_history');
      const shipments = history ? JSON.parse(history) : [];
      shipments.unshift(shipment);
      localStorage.setItem('shipment_history', JSON.stringify(shipments.slice(0, 50)));
      
      return shipment;
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  }

  // Tracking
  async trackShipment(carrierId: string, trackingNumber: string): Promise<TrackingInfo> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ carrierId, trackingNumber })
      });
      
      if (!response.ok) {
        throw new Error('Failed to track shipment');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error tracking shipment:', error);
      throw error;
    }
  }

  // Address Validation
  async validateAddress(address: Address): Promise<{
    valid: boolean;
    normalizedAddress?: Address;
    suggestions?: Address[];
    message?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate address');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error validating address:', error);
      throw error;
    }
  }

  // Label Generation
  async getLabel(shipmentId: string): Promise<{ labelUrl: string; trackingNumber: string; labelFormat: string }> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers/label`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shipmentId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get label');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error getting label:', error);
      throw error;
    }
  }

  // Pickup Scheduling
  async schedulePickup(request: PickupRequest): Promise<PickupResponse> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers/pickup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error('Failed to schedule pickup');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      throw error;
    }
  }

  // Shipment History
  async getShipmentHistory(): Promise<ShipmentResponse[]> {
    const history = localStorage.getItem('shipment_history');
    return history ? JSON.parse(history) : [];
  }

  // Void Shipment
  async voidShipment(shipmentId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/admin/carriers/ship/${shipmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to void shipment');
      }
    } catch (error) {
      console.error('Error voiding shipment:', error);
      throw error;
    }
  }
}

export default new CarrierService();
