import type { DeliveryMethod, DeliveryZone, RateRule, DeliverySettings } from './deliveryService';

const API_BASE = 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

export interface ShippingCalculationParams {
  items: Array<{
    weight?: number;
    price: number;
    quantity: number;
  }>;
  destination: {
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  selectedMethod?: string;
}

export interface ShippingOption {
  methodId: string;
  methodName: string;
  description?: string;
  price: number;
  estimatedDays: string;
  isFree: boolean;
  icon?: string;
}

export interface ShippingCalculationResult {
  options: ShippingOption[];
  selectedOption?: ShippingOption;
  subtotal: number;
  totalWeight: number;
  estimatedDelivery?: string;
}

class CheckoutDeliveryService {
  private async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    forceRefresh = false
  ): Promise<T> {
    // Try localStorage first
    const cached = localStorage.getItem(`checkout_${key.toLowerCase()}`);
    if (!forceRefresh && cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached data:', e);
      }
    }

    try {
      const data = await fetcher();
      localStorage.setItem(`checkout_${key.toLowerCase()}`, JSON.stringify(data));
      return data;
    } catch (error) {
      // Fallback to localStorage on error
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }

  async getZones(forceRefresh = false): Promise<DeliveryZone[]> {
    return this.fetchWithCache('Zones', async () => {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE}/admin/delivery/zones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch zones');
      return response.json();
    }, forceRefresh);
  }

  async getMethods(forceRefresh = false): Promise<DeliveryMethod[]> {
    return this.fetchWithCache('Methods', async () => {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE}/admin/delivery/methods`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch methods');
      return response.json();
    }, forceRefresh);
  }

  async getRates(forceRefresh = false): Promise<RateRule[]> {
    return this.fetchWithCache('Rates', async () => {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE}/admin/delivery/rates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch rates');
      return response.json();
    }, forceRefresh);
  }

  async getSettings(forceRefresh = false): Promise<DeliverySettings | null> {
    return this.fetchWithCache('Settings', async () => {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE}/admin/delivery/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return null;
      return response.json();
    }, forceRefresh);
  }

  async calculateShipping(params: ShippingCalculationParams): Promise<ShippingCalculationResult> {
    try {
      const [methods, zones, rates, settings] = await Promise.all([
        this.getMethods(),
        this.getZones(),
        this.getRates(),
        this.getSettings()
      ]);

      const subtotal = params.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalWeight = params.items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);

      const applicableZone = this.findApplicableZone(zones, params.destination);
      
      let options = await this.calculateShippingOptions({
        methods,
        rates,
        settings,
        subtotal,
        totalWeight,
        zone: applicableZone,
        destination: params.destination
      });

      // Apply free shipping if eligible
      if (settings?.enableFreeShipping && subtotal >= settings.freeShippingThreshold) {
        options = options.map(opt => ({ ...opt, price: 0, isFree: true }));
      }

      options.sort((a, b) => a.price - b.price);

      const selectedOption = options.find(opt => opt.methodId === settings?.defaultMethod) || options[0];
      const estimatedDelivery = this.calculateEstimatedDelivery(selectedOption);

      return { options, selectedOption, subtotal, totalWeight, estimatedDelivery };
    } catch (error) {
      console.error('Error calculating shipping:', error);
      return this.fallbackCalculation(params);
    }
  }

  private findApplicableZone(zones: DeliveryZone[], destination: ShippingCalculationParams['destination']): DeliveryZone | undefined {
    if (destination.city) {
      const cityZone = zones.find(zone => zone.cities?.some(city => city.toLowerCase() === destination.city?.toLowerCase()));
      if (cityZone) return cityZone;
    }
    if (destination.state) {
      const stateZone = zones.find(zone => zone.states?.some(state => state.toUpperCase() === destination.state?.toUpperCase()));
      if (stateZone) return stateZone;
    }
    if (destination.country) {
      const countryZone = zones.find(zone => zone.countries?.some(country => country.toLowerCase() === destination.country?.toLowerCase()));
      if (countryZone) return countryZone;
    }
    return zones.find(zone => zone.active);
  }

  private async calculateShippingOptions(params: {
    methods: DeliveryMethod[];
    rates: RateRule[];
    settings: DeliverySettings | null;
    subtotal: number;
    totalWeight: number;
    zone?: DeliveryZone;
    destination: ShippingCalculationParams['destination'];
  }): Promise<ShippingOption[]> {
    const options: ShippingOption[] = [];

    for (const method of params.methods) {
      if (!method.active) continue;

      let price = method.price;

      // Apply rate rules
      for (const rate of params.rates) {
        if (!rate.active) continue;

        const matchingRule = rate.rules.find(rule => {
          const value = rate.calculationType === 'price' ? params.subtotal :
                       rate.calculationType === 'weight' ? params.totalWeight : 0;
          return value >= rule.min && value < rule.max;
        });

        if (matchingRule) {
          price = matchingRule.free ? 0 : matchingRule.rate;
          break;
        }
      }

      // Apply zone base rate
      if (params.zone?.baseRate && params.zone.baseRate > 0) {
        price += params.zone.baseRate;
      }

      price = Math.max(0, price);

      options.push({
        methodId: method.id,
        methodName: method.name,
        description: method.description,
        price,
        estimatedDays: method.days,
        isFree: price === 0,
        icon: method.icon
      });
    }

    return options;
  }

  private calculateEstimatedDelivery(option: ShippingOption): string {
    const daysMatch = option.estimatedDays.match(/\d+/g);
    if (!daysMatch) return 'TBD';

    const maxDays = parseInt(daysMatch[daysMatch.length - 1]);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + maxDays);

    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private fallbackCalculation(params: ShippingCalculationParams): ShippingCalculationResult {
    const subtotal = params.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let shippingCost = 5.99;
    if (subtotal >= 100) shippingCost = 0;
    else if (subtotal >= 50) shippingCost = 4.99;

    const options: ShippingOption[] = [
      { methodId: 'standard', methodName: 'Standard Shipping', price: shippingCost, estimatedDays: '5-7 business days', isFree: shippingCost === 0 },
      { methodId: 'express', methodName: 'Express Shipping', price: shippingCost + 10, estimatedDays: '2-3 business days', isFree: false }
    ];

    return {
      options,
      selectedOption: options[0],
      subtotal,
      totalWeight: 0,
      estimatedDelivery: this.calculateEstimatedDelivery(options[0])
    };
  }
}

export default new CheckoutDeliveryService();
