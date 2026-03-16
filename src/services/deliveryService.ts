const API_BASE = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/admin/delivery';

export interface DeliveryZone {
  id: string;
  name: string;
  type: 'local' | 'regional' | 'national' | 'international';
  cities?: string[];
  states?: string[];
  countries?: string[];
  regions?: string[];
  baseRate: number;
  estimatedDays: string;
  active: boolean;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  description?: string;
  days: string;
  price: number;
  minOrder?: number;
  active: boolean;
  icon?: string;
}

export interface RateRule {
  id: string;
  name: string;
  description?: string;
  calculationType: 'weight' | 'price' | 'distance';
  rules: Array<{
    min: number;
    max: number;
    rate: number;
    free?: boolean;
    description?: string;
  }>;
  active: boolean;
}

export interface DeliverySettings {
  defaultMethod: string;
  enableFreeShipping: boolean;
  freeShippingThreshold: number;
  enableTracking: boolean;
  trackingUrl: string;
  maxDeliveryDays: number;
  weekendDelivery: boolean;
  holidayDelivery: boolean;
  cutOffTime: string;
  processingTime: string;
  addressValidation: boolean;
  signatureRequired: boolean;
  insuranceRequired: boolean;
  returnPolicy: string;
  internationalCustoms: boolean;
  taxIncluded: boolean;
}

export interface TrackingInfo {
  id: string;
  orderId: string;
  customerName: string;
  status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled';
  carrier: string;
  trackingNumber: string;
  updates: Array<{
    date: string;
    time: string;
    status: string;
    location: string;
  }>;
  estimatedDelivery?: string;
  actualDelivery?: string;
}

const getToken = () => localStorage.getItem('jwt_token');

// Zones API
export const getZones = async (): Promise<DeliveryZone[]> => {
  try {
    const response = await fetch(`${API_BASE}/zones`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Failed to fetch zones');
    return response.json();
  } catch (error) {
    console.error('Error fetching zones:', error);
    return [];
  }
};

export const getZone = async (id: string): Promise<DeliveryZone> => {
  const response = await fetch(`${API_BASE}/zones/${id}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!response.ok) throw new Error('Failed to fetch zone');
  return response.json();
};

export const createZone = async (zone: Omit<DeliveryZone, 'id'>): Promise<DeliveryZone> => {
  const response = await fetch(`${API_BASE}/zones`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(zone)
  });
  if (!response.ok) throw new Error('Failed to create zone');
  return response.json();
};

export const updateZone = async (id: string, zone: Partial<DeliveryZone>): Promise<DeliveryZone> => {
  const response = await fetch(`${API_BASE}/zones/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(zone)
  });
  if (!response.ok) throw new Error('Failed to update zone');
  return response.json();
};

export const deleteZone = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/zones/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!response.ok) throw new Error('Failed to delete zone');
};

// Methods API
export const getMethods = async (): Promise<DeliveryMethod[]> => {
  try {
    const response = await fetch(`${API_BASE}/methods`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Failed to fetch methods');
    return response.json();
  } catch (error) {
    console.error('Error fetching methods:', error);
    return [];
  }
};

export const getMethod = async (id: string): Promise<DeliveryMethod> => {
  const response = await fetch(`${API_BASE}/methods/${id}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!response.ok) throw new Error('Failed to fetch method');
  return response.json();
};

export const createMethod = async (method: Omit<DeliveryMethod, 'id'>): Promise<DeliveryMethod> => {
  const response = await fetch(`${API_BASE}/methods`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(method)
  });
  if (!response.ok) throw new Error('Failed to create method');
  return response.json();
};

export const updateMethod = async (id: string, method: Partial<DeliveryMethod>): Promise<DeliveryMethod> => {
  const response = await fetch(`${API_BASE}/methods/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(method)
  });
  if (!response.ok) throw new Error('Failed to update method');
  return response.json();
};

export const deleteMethod = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/methods/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!response.ok) throw new Error('Failed to delete method');
};

// Rates API
export const getRates = async (): Promise<RateRule[]> => {
  try {
    const response = await fetch(`${API_BASE}/rates`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Failed to fetch rates');
    return response.json();
  } catch (error) {
    console.error('Error fetching rates:', error);
    return [];
  }
};

export const getRate = async (id: string): Promise<RateRule> => {
  const response = await fetch(`${API_BASE}/rates/${id}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!response.ok) throw new Error('Failed to fetch rate');
  return response.json();
};

export const createRate = async (rate: Omit<RateRule, 'id'>): Promise<RateRule> => {
  const response = await fetch(`${API_BASE}/rates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(rate)
  });
  if (!response.ok) throw new Error('Failed to create rate');
  return response.json();
};

export const updateRate = async (id: string, rate: Partial<RateRule>): Promise<RateRule> => {
  const response = await fetch(`${API_BASE}/rates/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(rate)
  });
  if (!response.ok) throw new Error('Failed to update rate');
  return response.json();
};

export const deleteRate = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/rates/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!response.ok) throw new Error('Failed to delete rate');
};

// Settings API
export const getDeliverySettings = async (): Promise<DeliverySettings | null> => {
  try {
    const response = await fetch(`${API_BASE}/settings`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Failed to fetch delivery settings');
    return response.json();
  } catch (error) {
    console.error('Error fetching delivery settings:', error);
    return null;
  }
};

export const updateDeliverySettings = async (settings: Partial<DeliverySettings>): Promise<DeliverySettings | null> => {
  try {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to update delivery settings');
    return response.json();
  } catch (error) {
    console.error('Error updating delivery settings:', error);
    return null;
  }
};

// Tracking API
export const getTracking = async (): Promise<TrackingInfo[]> => {
  try {
    const response = await fetch(`${API_BASE}/tracking`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Failed to fetch tracking');
    return response.json();
  } catch (error) {
    console.error('Error fetching tracking:', error);
    return [];
  }
};

export const getTrackingByOrder = async (orderId: string): Promise<TrackingInfo | null> => {
  try {
    const response = await fetch(`${API_BASE}/tracking/order/${orderId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Failed to fetch tracking for order');
    return response.json();
  } catch (error) {
    console.error('Error fetching tracking for order:', error);
    return null;
  }
};

export const updateTracking = async (id: string, tracking: Partial<TrackingInfo>): Promise<TrackingInfo | null> => {
  try {
    const response = await fetch(`${API_BASE}/tracking/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tracking)
    });
    if (!response.ok) throw new Error('Failed to update tracking');
    return response.json();
  } catch (error) {
    console.error('Error updating tracking:', error);
    return null;
  }
};
