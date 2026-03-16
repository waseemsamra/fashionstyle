import { useState } from 'react';
import { Truck, CheckCircle, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useShippingRates } from '@/hooks/useShippingRates';
import type { Address, Cart, ShippingRate } from '@/services/shippingService';

interface ShippingCalculatorProps {
  onRateSelect: (rate: ShippingRate) => void;
  selectedRate?: ShippingRate | null;
}

export default function ShippingCalculator({ onRateSelect, selectedRate }: ShippingCalculatorProps) {
  const [address, setAddress] = useState<Address>({
    zipCode: '',
    country: 'USA',
    city: '',
    state: ''
  });

  // Mock cart data - replace with actual cart from context
  const cart: Cart = {
    items: [],
    totalWeight: 2,
    subtotal: 150
  };

  const {
    rates,
    isLoading,
    isFetching,
    error,
    hasRates,
    cheapestRate,
    fastestRate,
    selectRate,
    validateAddress,
    isValidating,
    validationResult,
  } = useShippingRates(address, cart);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleValidateAddress = async () => {
    if (!address.zipCode) {
      toast.error('Please enter a ZIP code');
      return;
    }

    try {
      await validateAddress(address);
      if (validationResult?.valid) {
        toast.success('Address is valid!');
      } else {
        toast.warning('Address could not be verified');
      }
    } catch (error) {
      toast.error('Failed to validate address');
    }
  };

  const handleSelectRate = (rate: ShippingRate) => {
    selectRate(rate);
    onRateSelect(rate);
    toast.success(`${rate.methodName} selected - $${rate.rate}`);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Calculate Shipping
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP / Postal Code *</Label>
              <Input
                id="zipCode"
                value={address.zipCode}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                placeholder="10001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="USA">United States</option>
                <option value="Canada">Canada</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                placeholder="NY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="New York"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleValidateAddress}
              variant="outline"
              disabled={isValidating || !address.zipCode}
            >
              {isValidating ? 'Validating...' : 'Validate Address'}
            </Button>

            {validationResult?.valid && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Valid Address
              </Badge>
            )}
          </div>
        </div>

        {/* Shipping Rates */}
        {(isLoading || isFetching) && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Failed to load shipping rates</p>
              <p className="text-sm text-red-700 mt-1">
                Please check your address and try again
              </p>
            </div>
          </div>
        )}

        {hasRates && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Available Shipping Methods</h4>
              <div className="flex gap-2 text-sm">
                {cheapestRate && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Cheapest: ${cheapestRate.rate}
                  </Badge>
                )}
                {fastestRate && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <Clock className="w-3 h-3 mr-1" />
                    Fastest: {fastestRate.estimatedDays.min}-{fastestRate.estimatedDays.max} days
                  </Badge>
                )}
              </div>
            </div>

            <RadioGroup value={selectedRate?.methodId} onValueChange={(value) => {
              const rate = rates.find(r => r.methodId === value);
              if (rate) handleSelectRate(rate);
            }}>
              <div className="space-y-3">
                {rates.map((rate) => (
                  <div
                    key={`${rate.carrierId}-${rate.methodId}`}
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      selectedRate?.methodId === rate.methodId
                        ? 'border-gold bg-gold/5'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectRate(rate)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <RadioGroupItem
                          value={rate.methodId}
                          id={rate.methodId}
                          className="mt-1"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{rate.carrierName}</span>
                            <Badge variant="outline">{rate.methodName}</Badge>
                            {rate.guaranteed && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Guaranteed
                              </Badge>
                            )}
                            {rate.saturdayDelivery && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                Saturday
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{rate.estimatedDays.min}-{rate.estimatedDays.max} days</span>
                            </div>
                            {rate.tracking && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Tracking</span>
                              </div>
                            )}
                            {rate.insurance && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>Insured</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-gold">
                          {rate.rate === 0 ? 'FREE' : `$${rate.rate}`}
                        </p>
                        <p className="text-sm text-gray-500">{rate.currency}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {!isLoading && !hasRates && address.zipCode && (
          <div className="text-center py-8 text-gray-500">
            <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No shipping rates available for this address</p>
          </div>
        )}

        {!address.zipCode && (
          <div className="text-center py-8 text-gray-500">
            <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Enter your ZIP code to calculate shipping</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
