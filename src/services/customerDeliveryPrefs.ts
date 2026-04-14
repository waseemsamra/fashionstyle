export interface Address {
  id?: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
  label?: string;
}

export interface CustomerDeliveryPrefs {
  userId: string;
  defaultAddressId?: string;
  savedAddresses: Address[];
  preferredMethod?: string;
  deliveryInstructions?: string;
  leaveAtDoor: boolean;
  signatureRequired: boolean;
  giftWrapping: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    smsPhone?: string;
  };
  preferredDeliveryWindow?: {
    start: string;
    end: string;
  };
  weekendDelivery: boolean;
  holidayDelivery: boolean;
}

const API_BASE = 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

class CustomerDeliveryService {
  private cache: Map<string, CustomerDeliveryPrefs> = new Map();

  async getPreferences(userId: string): Promise<CustomerDeliveryPrefs> {
    if (this.cache.has(userId)) {
      return this.cache.get(userId)!;
    }

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE}/users/${userId}/delivery-prefs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return this.getDefaultPreferences(userId);
        }
        throw new Error('Failed to fetch preferences');
      }

      const prefs = await response.json();
      this.cache.set(userId, prefs);
      localStorage.setItem(`delivery_prefs_${userId}`, JSON.stringify(prefs));
      
      return prefs;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      
      const cached = localStorage.getItem(`delivery_prefs_${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }
      
      return this.getDefaultPreferences(userId);
    }
  }

  async savePreferences(userId: string, prefs: CustomerDeliveryPrefs): Promise<void> {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE}/users/${userId}/delivery-prefs`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prefs)
      });

      if (!response.ok) throw new Error('Failed to save preferences');

      this.cache.set(userId, prefs);
      localStorage.setItem(`delivery_prefs_${userId}`, JSON.stringify(prefs));
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      localStorage.setItem(`delivery_prefs_${userId}`, JSON.stringify(prefs));
      throw error;
    }
  }

  async addAddress(userId: string, address: Address): Promise<Address> {
    const prefs = await this.getPreferences(userId);
    
    const newAddress: Address = {
      ...address,
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isDefault: prefs.savedAddresses.length === 0
    };

    prefs.savedAddresses.push(newAddress);
    await this.savePreferences(userId, prefs);
    
    return newAddress;
  }

  async updateAddress(userId: string, addressId: string, updates: Partial<Address>): Promise<Address> {
    const prefs = await this.getPreferences(userId);
    const index = prefs.savedAddresses.findIndex(a => a.id === addressId);
    
    if (index === -1) throw new Error('Address not found');
    
    prefs.savedAddresses[index] = { ...prefs.savedAddresses[index], ...updates };
    await this.savePreferences(userId, prefs);
    
    return prefs.savedAddresses[index];
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const prefs = await this.getPreferences(userId);
    prefs.savedAddresses = prefs.savedAddresses.filter(a => a.id !== addressId);
    
    if (prefs.defaultAddressId === addressId && prefs.savedAddresses.length > 0) {
      prefs.defaultAddressId = prefs.savedAddresses[0].id;
      prefs.savedAddresses[0].isDefault = true;
    }
    
    await this.savePreferences(userId, prefs);
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    const prefs = await this.getPreferences(userId);
    
    prefs.savedAddresses.forEach(a => a.isDefault = false);
    
    const address = prefs.savedAddresses.find(a => a.id === addressId);
    if (address) {
      address.isDefault = true;
      prefs.defaultAddressId = addressId;
    }
    
    await this.savePreferences(userId, prefs);
  }

  getDefaultPreferences(userId: string): CustomerDeliveryPrefs {
    return {
      userId,
      savedAddresses: [],
      leaveAtDoor: false,
      signatureRequired: false,
      giftWrapping: false,
      notifications: {
        email: true,
        sms: false
      },
      weekendDelivery: false,
      holidayDelivery: false
    };
  }

  async getRecommendedMethod(
    userId: string,
    _orderTotal: number,
    _destination: Address
  ): Promise<string | undefined> {
    const prefs = await this.getPreferences(userId);
    return prefs.preferredMethod;
  }

  clearCache(userId: string): void {
    this.cache.delete(userId);
  }
}

export default new CustomerDeliveryService();
