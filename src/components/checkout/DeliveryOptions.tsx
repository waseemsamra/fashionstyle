import { useState, useEffect } from 'react';
import { Truck, Package, Zap, Clock, Gift, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import checkoutDeliveryService from '@/services/checkoutDeliveryService';
import type { ShippingOption, ShippingCalculationParams } from '@/services/checkoutDeliveryService';

interface CartItem {
  id: string;
  name: string;
  price: number;
  weight?: number;
  quantity: number;
  image?: string;
}

interface DeliveryOptionsProps {
  cartItems: CartItem[];
  onDeliverySelect: (option: ShippingOption) => void;
  onAddressChange: (address: any) => void;
}

export default function DeliveryOptions({ 
  cartItems, 
  onDeliverySelect,
  onAddressChange 
}: DeliveryOptionsProps) {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('');
  const [subtotal, setSubtotal] = useState(0);
  
  const [address, setAddress] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });

  useEffect(() => {
    calculateSubtotal();
  }, [cartItems]);

  const calculateSubtotal = () => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setSubtotal(total);
  };

  const calculateShipping = async () => {
    if (!address.city || !address.state || !address.zipCode) {
      toast.error('Please enter complete address');
      return;
    }

    setCalculating(true);
    try {
      const params: ShippingCalculationParams = {
        items: cartItems.map(item => ({
          weight: item.weight,
          price: item.price,
          quantity: item.quantity
        })),
        destination: {
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country
        }
      };

      const result = await checkoutDeliveryService.calculateShipping(params);
      
      setShippingOptions(result.options);
      setSubtotal(result.subtotal);
      setEstimatedDelivery(result.estimatedDelivery || '');
      
      if (result.selectedOption) {
        setSelectedOption(result.selectedOption.methodId);
        onDeliverySelect(result.selectedOption);
      }

      if (result.options.length > 0) {
        toast.success('Shipping options calculated');
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      toast.error('Failed to calculate shipping options');
    } finally {
      setCalculating(false);
      setLoading(false);
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    const updatedAddress = { ...address, [field]: value };
    setAddress(updatedAddress);
    onAddressChange(updatedAddress);
  };

  const handleOptionSelect = (methodId: string) => {
    setSelectedOption(methodId);
    const option = shippingOptions.find(opt => opt.methodId === methodId);
    if (option) {
      onDeliverySelect(option);
    }
  };

  const getMethodIcon = (methodId: string) => {
    const iconMap: Record<string, any> = {
      'standard': Package,
      'express': Zap,
      'next-day': Clock,
      'free-shipping': Gift
    };
    const Icon = iconMap[methodId] || Truck;
    return <Icon className="w-5 h-5" />;
  };

  const selectedShipping = shippingOptions.find(opt => opt.methodId === selectedOption);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Delivery Information
        </CardTitle>
        <CardDescription>
          Enter your delivery address and select a shipping method
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Address Form */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gold" />
            <h3 className="font-medium">Delivery Address</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={address.fullName}
                onChange={(e) => handleAddressChange('fullName', e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                value={address.addressLine1}
                onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                placeholder="123 Main St"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                value={address.addressLine2}
                onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                placeholder="Apt 4B"
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
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={address.zipCode}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                placeholder="10001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                placeholder="USA"
              />
            </div>
          </div>

          <Button 
            onClick={calculateShipping}
            disabled={calculating || !address.city || !address.state || !address.zipCode}
            className="w-full bg-gold hover:bg-gold/90"
          >
            {calculating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Calculating...
              </>
            ) : (
              <>
                <Truck className="w-4 h-4 mr-2" />
                Calculate Shipping
              </>
            )}
          </Button>
        </div>

        {/* Shipping Options */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gold" />
              <h3 className="font-medium">Shipping Methods</h3>
            </div>
            {estimatedDelivery && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Est. Delivery: {estimatedDelivery}
              </Badge>
            )}
          </div>

          {loading || calculating ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : shippingOptions.length > 0 ? (
            <RadioGroup value={selectedOption} onValueChange={handleOptionSelect} className="space-y-3">
              {shippingOptions.map((option) => (
                <div
                  key={option.methodId}
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedOption === option.methodId
                      ? 'border-gold bg-gold/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleOptionSelect(option.methodId)}
                >
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value={option.methodId} id={option.methodId} className="w-5 h-5" />
                    <div className={`p-2 rounded-lg ${option.isFree ? 'bg-green-100' : 'bg-gold/10'}`}>
                      {getMethodIcon(option.methodId)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={option.methodId} className="font-medium cursor-pointer">
                          {option.methodName}
                        </Label>
                        {option.isFree && (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">FREE</Badge>
                        )}
                      </div>
                      {option.description && (
                        <p className="text-sm text-gray-600">{option.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {option.estimatedDays}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${option.isFree ? 'text-green-600' : 'text-gold'}`}>
                      {option.isFree ? 'FREE' : `$${option.price.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
              <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              {address.city && address.state && address.zipCode ? (
                <p>No shipping options available for this address</p>
              ) : (
                <p>Enter your delivery address to see shipping options</p>
              )}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {shippingOptions.length > 0 && (
          <div className="border-t-2 pt-4">
            <h3 className="font-medium text-lg mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className={`font-medium ${selectedShipping?.isFree ? 'text-green-600' : 'text-gold'}`}>
                  {selectedShipping ? (
                    selectedShipping.isFree ? 'FREE' : `$${selectedShipping.price.toFixed(2)}`
                  ) : (
                    <span className="text-gray-400">Select a method</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t-2 font-semibold text-lg">
                <span>Total:</span>
                <span className="text-gold">
                  ${(subtotal + (selectedShipping?.price || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
