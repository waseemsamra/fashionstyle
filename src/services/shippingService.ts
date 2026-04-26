export interface Address {
  zipCode: string;
  country: string;
  city?: string;
  state?: string;
  street1?: string;
  street2?: string;
}

export interface CartItem {
  id: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalWeight?: number;
  subtotal?: number;
}

export interface ShippingRate {
  carrierId: string;
  carrierName: string;
  methodId: string;
  methodName: string;
  rate: number;
  currency: string;
  estimatedDays: {
    min: number;
    max: number;
  };
  guaranteed?: boolean;
  tracking?: boolean;
  insurance?: boolean;
  saturdayDelivery?: boolean;
}

export interface ShippingRatesResponse {
  rates: ShippingRate[];
  address: Address;
  cart: Cart;
}

class ShippingService {
  private baseUrl = import.meta.env.VITE_API_URL || 'https://zbdw3piterihfqm37o3swldeca0qitsj.lambda-url.us-east-1.on.aws';

  async getRates(address: Address, cart: Cart): Promise<ShippingRatesResponse> {
    const token = localStorage.getItem('jwt_token');
    
    // Calculate total weight if not provided
    const totalWeight = cart.totalWeight || cart.items.reduce((sum, item) => {
      return sum + (item.weight || 0.5); // Default 0.5lb if no weight
    }, 0);

    console.log('🔍 Fetching shipping rates for:', {
      address,
      totalWeight,
      itemCount: cart.items.length
    });

    const response = await fetch(`${this.baseUrl}/admin/carriers/rates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromAddress: {
          name: 'Fashion Store',
          street1: '123 Fashion Ave',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        },
        toAddress: address,
        package: {
          weight: totalWeight,
          weightUnit: 'lb',
          value: cart.subtotal || 0
        }
      })
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch shipping rates:', response.status);
      throw new Error('Failed to fetch shipping rates');
    }

    const data = await response.json();
    console.log('✅ Shipping rates received:', data);
    
    return data;
  }

  async selectRate(rate: ShippingRate): Promise<void> {
    const token = localStorage.getItem('jwt_token');
    
    console.log('📦 Selecting shipping rate:', rate);
    
    const response = await fetch(`${this.baseUrl}/checkout/select-shipping`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rate)
    });

    if (!response.ok) {
      throw new Error('Failed to select shipping rate');
    }

    // Store selected rate in localStorage as fallback
    localStorage.setItem('selected-shipping-rate', JSON.stringify(rate));
    console.log('✅ Shipping rate selected:', rate);
  }

  async validateAddress(address: Address): Promise<{
    valid: boolean;
    normalizedAddress?: Address;
    suggestions?: Address[];
    message?: string;
  }> {
    const token = localStorage.getItem('jwt_token');
    
    console.log('🏠 Validating address:', address);
    
    const response = await fetch(`${this.baseUrl}/admin/carriers/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address })
    });

    if (!response.ok) {
      console.error('❌ Failed to validate address:', response.status);
      throw new Error('Failed to validate address');
    }

    const data = await response.json();
    console.log('✅ Address validation result:', data);
    
    return data;
  }
}

export const shippingService = new ShippingService();
