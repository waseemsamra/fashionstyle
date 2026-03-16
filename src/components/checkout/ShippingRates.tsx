import { useState } from 'react';
import { useShippingRates } from '@/hooks/useShippingRates';
import { Truck, Clock, Shield, RefreshCw, CheckCircle } from 'lucide-react';
import type { Address, Cart, ShippingRate } from '@/services/shippingService';

interface ShippingRatesProps {
  address: Address;
  cart: Cart;
  onSelect: (rate: ShippingRate) => void;
}

export function ShippingRates({ address, cart, onSelect }: ShippingRatesProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  
  const {
    rates,
    isLoading,
    isFetching,
    error,
    refetch,
    selectRate,
    isSelecting,
    hasRates,
    cheapestRate,
    fastestRate
  } = useShippingRates(address, cart);

  const handleSelectRate = async (rate: ShippingRate) => {
    setSelectedMethod(rate.methodId);
    await selectRate(rate);
    onSelect(rate);
  };

  if (!address?.zipCode) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Please enter your ZIP code to see shipping rates
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 flex items-center gap-2 mb-2">
          <RefreshCw className="w-5 h-5" />
          Failed to load shipping rates
        </p>
        <button 
          onClick={() => refetch()}
          className="text-red-600 hover:text-red-700 underline flex items-center gap-1 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  if (!hasRates) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-orange-800 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          No shipping rates available for this address
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Info */}
      {!isFetching && (cheapestRate || fastestRate) && (
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
          {cheapestRate && (
            <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">Cheapest:</span>
              <span className="text-green-700">${cheapestRate.rate.toFixed(2)}</span>
            </div>
          )}
          {fastestRate && fastestRate !== cheapestRate && (
            <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Fastest:</span>
              <span className="text-blue-700">{fastestRate.estimatedDays.min}-{fastestRate.estimatedDays.max} days</span>
            </div>
          )}
        </div>
      )}

      {/* Refreshing indicator */}
      {isFetching && (
        <div className="flex items-center gap-2 text-sm text-gold bg-gold/5 px-3 py-2 rounded-lg">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Updating rates...</span>
        </div>
      )}

      {/* Rates List */}
      <div className="space-y-3">
        {rates.map((rate) => (
          <label
            key={`${rate.carrierId}-${rate.methodId}`}
            className={`
              block border rounded-lg p-4 cursor-pointer transition-all
              ${selectedMethod === rate.methodId 
                ? 'border-gold bg-gold/5 ring-2 ring-gold/20' 
                : 'hover:border-gray-400 hover:shadow-md'
              }
              ${isSelecting ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input
              type="radio"
              name="shipping"
              value={rate.methodId}
              checked={selectedMethod === rate.methodId}
              onChange={() => handleSelectRate(rate)}
              className="hidden"
              disabled={isSelecting}
            />
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-lg">{rate.carrierName}</span>
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {rate.methodName}
                  </span>
                  {rate.guaranteed && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Guaranteed
                    </span>
                  )}
                  {rate.saturdayDelivery && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      Saturday
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{rate.estimatedDays.min}-{rate.estimatedDays.max} days</span>
                  </div>
                  
                  {rate.tracking && (
                    <div className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      <span>Tracking</span>
                    </div>
                  )}
                  
                  {rate.insurance && (
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      <span>Insured</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right ml-4">
                <span className="text-2xl font-bold text-gold">
                  {rate.rate === 0 ? 'FREE' : `$${rate.rate.toFixed(2)}`}
                </span>
                {rate.rate > 0 && (
                  <span className="text-sm text-gray-600 block">{rate.currency}</span>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
