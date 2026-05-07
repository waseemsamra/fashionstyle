// services/currencyService.ts - Centralized currency management
import { useState, useEffect } from 'react';

export interface CurrencyConfig {
  currency: string;
  symbol: string;
  position: 'before' | 'after';
}

export const defaultCurrency: CurrencyConfig = {
  currency: 'USD',
  symbol: '$',
  position: 'before'
};

export const currencyService = {
  // Get currency configuration from admin settings or localStorage
  getCurrencyConfig: (): CurrencyConfig => {
    try {
      // Try to get from admin general settings first
      const adminSettings = localStorage.getItem('admin_general');
      if (adminSettings) {
        const parsed = JSON.parse(adminSettings);
        if (parsed.currency && parsed.currencySymbol) {
          return {
            currency: parsed.currency,
            symbol: parsed.currencySymbol,
            position: 'before'
          };
        }
      }
      
      // Fallback to default
      return defaultCurrency;
    } catch (error) {
      console.error('❌ Failed to load currency config:', error);
      return defaultCurrency;
    }
  },

  // Format price with currency symbol
  formatPrice: (price: number): string => {
    const config = currencyService.getCurrencyConfig();
    const symbol = config.symbol;
    const formattedPrice = price.toLocaleString();
    
    if (config.position === 'before') {
      return `${symbol}${formattedPrice}`;
    } else {
      return `${formattedPrice}${symbol}`;
    }
  },

  // Format price range
  formatPriceRange: (min: number, max: number): string => {
    const config = currencyService.getCurrencyConfig();
    const symbol = config.symbol;
    const formattedMin = min.toLocaleString();
    const formattedMax = max.toLocaleString();
    
    if (config.position === 'before') {
      return `${symbol}${formattedMin} - ${symbol}${formattedMax}`;
    } else {
      return `${formattedMin} - ${formattedMax}${symbol}`;
    }
  },

  // Get currency symbol only
  getSymbol: (): string => {
    return currencyService.getCurrencyConfig().symbol;
  },

  // Get currency code only
  getCurrency: (): string => {
    return currencyService.getCurrencyConfig().currency;
  }
};

// Hook for components to use currency
export function useCurrency() {
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>(defaultCurrency);

  useEffect(() => {
    // Load currency config on mount
    const config = currencyService.getCurrencyConfig();
    setCurrencyConfig(config);

    // Listen for storage changes
    const handleStorageChange = () => {
      const config = currencyService.getCurrencyConfig();
      setCurrencyConfig(config);
    };

    // Add storage event listener
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    ...currencyConfig,
    formatPrice: currencyService.formatPrice,
    formatPriceRange: currencyService.formatPriceRange,
    symbol: currencyService.getSymbol(),
    currency: currencyService.getCurrency()
  };
}
