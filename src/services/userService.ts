export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
    language: string;
    currency: string;
    theme: 'light' | 'dark' | 'system';
  };
  stats: {
    totalOrders: number;
    totalSpent: number;
    memberSince: string;
    lastLogin: string;
  };
}

export interface Address {
  id: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  instructions?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'applepay' | 'googlepay';
  isDefault: boolean;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  email?: string; // for PayPal
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  items: number;
  trackingNumber?: string;
}

class UserService {
  private baseUrl = import.meta.env.VITE_USERS_API_URL || 'https://3rctw6carzadrs3okoemb4ccvi0rzxqy.lambda-url.us-east-1.on.aws';

  async getProfile(userId: string): Promise<UserProfile> {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    
    const response = await fetch(`${this.baseUrl}/users/${encodedUserId}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  }

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    
    const response = await fetch(`${this.baseUrl}/users/${encodedUserId}/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return response.json();
  }

  async uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${this.baseUrl}/users/${encodedUserId}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload avatar');
    }

    return response.json();
  }

  async getAddresses(userId: string): Promise<Address[]> {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    
    const response = await fetch(`${this.baseUrl}/users/${encodedUserId}/addresses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch addresses');
    }

    return response.json();
  }

  async addAddress(userId: string, address: Omit<Address, 'id'>): Promise<Address> {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    
    const response = await fetch(`${this.baseUrl}/users/${encodedUserId}/addresses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(address),
    });

    if (!response.ok) {
      throw new Error('Failed to add address');
    }

    return response.json();
  }

  async updateAddress(userId: string, addressId: string, data: Partial<Address>): Promise<Address> {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    
    const response = await fetch(`${this.baseUrl}/users/${encodedUserId}/addresses/${addressId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update address');
    }

    return response.json();
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    
    const response = await fetch(`${this.baseUrl}/users/${encodedUserId}/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete address');
    }
  }

  async getOrders(userId: string): Promise<Order[]> {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    
    const response = await fetch(`${this.baseUrl}/users/${encodedUserId}/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    
    const response = await fetch(`${this.baseUrl}/users/${encodedUserId}/payment-methods`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment methods');
    }

    return response.json();
  }

  async addPaymentMethod(userId: string, method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    
    const response = await fetch(`${this.baseUrl}/users/${encodedUserId}/payment-methods`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(method),
    });

    if (!response.ok) {
      throw new Error('Failed to add payment method');
    }

    return response.json();
  }

  async deletePaymentMethod(userId: string, methodId: string): Promise<void> {
    const token = localStorage.getItem('jwt_token');
    const encodedUserId = encodeURIComponent(userId);
    
    const response = await fetch(`${this.baseUrl}/users/${encodedUserId}/payment-methods/${methodId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete payment method');
    }
  }
}

export const userService = new UserService();
