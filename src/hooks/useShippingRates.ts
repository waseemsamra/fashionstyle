import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingService } from '@/services/shippingService';
import type { Address, Cart, ShippingRate } from '@/services/shippingService';
import { useEffect } from 'react';

// Common ZIP codes to prefetch (major US cities)
const COMMON_ZIP_CODES = [
  { zipCode: '10001', city: 'New York, NY' },
  { zipCode: '90210', city: 'Beverly Hills, CA' },
  { zipCode: '60601', city: 'Chicago, IL' },
  { zipCode: '33101', city: 'Miami, FL' },
  { zipCode: '75201', city: 'Dallas, TX' },
  { zipCode: '98101', city: 'Seattle, WA' },
  { zipCode: '02101', city: 'Boston, MA' },
  { zipCode: '30301', city: 'Atlanta, GA' },
];

export function useShippingRates(address: Address | null, cart: Cart | null) {
  const queryClient = useQueryClient();

  // Prefetch rates for common ZIP codes on mount
  useEffect(() => {
    const prefetchCommonRates = async () => {
      if (!cart) return;
      
      console.log('🚀 Prefetching shipping rates for common ZIP codes...');
      
      COMMON_ZIP_CODES.forEach(({ zipCode, city }) => {
        const address: Address = { zipCode, country: 'USA' };
        
        queryClient.prefetchQuery({
          queryKey: ['shipping-rates', address, cart],
          queryFn: async () => {
            try {
              const response = await shippingService.getRates(address, cart);
              console.log(`✅ Prefetched rates for ${city} (${zipCode}):`, response.rates.length, 'rates');
              return response.rates;
            } catch (error) {
              console.warn(`⚠️ Failed to prefetch rates for ${city}:`, error);
              // Return mock rates as fallback
              return getMockRates(cart);
            }
          },
          staleTime: 10 * 60 * 1000, // 10 minutes
          gcTime: 30 * 60 * 1000, // 30 minutes
        });
      });
    };

    prefetchCommonRates();
  }, [cart, queryClient]);

  // Main query for shipping rates
  const query = useQuery({
    queryKey: ['shipping-rates', address, cart],
    queryFn: async () => {
      if (!address || !cart) return [];
      
      console.log('🔍 Fetching shipping rates for:', { address, cart });
      
      try {
        const response = await shippingService.getRates(address, cart);
        console.log('✅ Shipping rates received:', response.rates);
        return response.rates;
      } catch (error) {
        console.error('❌ Error fetching shipping rates:', error);
        
        // Fallback: return mock rates if API fails
        return getMockRates(cart);
      }
    },
    enabled: !!address && !!cart && !!address.zipCode,
    staleTime: 10 * 60 * 1000, // 10 minutes - rates don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 1,
  });

  // Mutation for selecting a shipping method
  const selectMutation = useMutation({
    mutationFn: async (selectedRate: ShippingRate) => {
      await shippingService.selectRate(selectedRate);
      return selectedRate;
    },
    onSuccess: (selectedRate) => {
      // Update cache with selected rate
      queryClient.setQueryData(['selected-shipping-rate'], selectedRate);
      
      // Invalidate cart to refresh with shipping cost
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      console.log('✅ Selected shipping rate:', selectedRate);
    },
  });

  // Mutation for validating address
  const validateAddressMutation = useMutation({
    mutationFn: async (addr: Address) => {
      return shippingService.validateAddress(addr);
    },
  });

  // Helper functions
  const cheapestRate = query.data?.reduce((min, rate) => 
    rate.rate < min.rate ? rate : min
  , query.data?.[0]);

  const fastestRate = query.data?.reduce((fastest, rate) => 
    rate.estimatedDays.min < fastest.estimatedDays.min ? rate : fastest
  , query.data?.[0]);

  return {
    // Query data
    rates: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    
    // Selected rate
    selectedRate: queryClient.getQueryData(['selected-shipping-rate']) as ShippingRate | undefined,
    selectRate: selectMutation.mutate,
    isSelecting: selectMutation.isPending,
    
    // Address validation
    validateAddress: validateAddressMutation.mutate,
    isValidating: validateAddressMutation.isPending,
    validationResult: validateAddressMutation.data,
    
    // Helpers
    hasRates: (query.data?.length || 0) > 0,
    cheapestRate,
    fastestRate,
  };
}

// Mock rates fallback (when API is unavailable)
function getMockRates(cart: Cart): ShippingRate[] {
  const subtotal = cart.subtotal || 0;
  
  // Free shipping for orders over $100
  const freeShippingEligible = subtotal >= 100;
  
  return [
    {
      carrierId: 'usps',
      carrierName: 'USPS',
      methodId: 'standard',
      methodName: 'Standard Shipping',
      rate: freeShippingEligible ? 0 : 5.99,
      currency: 'USD',
      estimatedDays: { min: 5, max: 7 },
      guaranteed: false,
      tracking: true,
      insurance: false,
    },
    {
      carrierId: 'usps',
      carrierName: 'USPS',
      methodId: 'priority',
      methodName: 'Priority Shipping',
      rate: freeShippingEligible ? 0 : 12.99,
      currency: 'USD',
      estimatedDays: { min: 2, max: 3 },
      guaranteed: true,
      tracking: true,
      insurance: true,
    },
    {
      carrierId: 'fedex',
      carrierName: 'FedEx',
      methodId: 'express',
      methodName: 'Express Overnight',
      rate: 24.99,
      currency: 'USD',
      estimatedDays: { min: 1, max: 1 },
      guaranteed: true,
      tracking: true,
      insurance: true,
      saturdayDelivery: true,
    },
  ];
}
