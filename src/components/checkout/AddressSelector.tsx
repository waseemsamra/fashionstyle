import { useState } from 'react';
import { MapPin, ChevronDown, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Address } from '@/services/customerDeliveryPrefs';

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId?: string;
  onSelect: (address: Address) => void;
  onAddNew: () => void;
}

export default function AddressSelector({
  addresses,
  selectedAddressId,
  onSelect,
  onAddNew
}: AddressSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between h-auto py-3"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2 text-left">
          <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {selectedAddress ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedAddress.label}</span>
                  {selectedAddress.isDefault && (
                    <Badge className="bg-gold text-white text-xs">Default</Badge>
                  )}
                </div>
                <span className="text-sm text-gray-600 truncate">
                  {selectedAddress.addressLine1}, {selectedAddress.city}
                </span>
              </div>
            ) : (
              <span className="text-gray-500">Select a delivery address</span>
            )}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Delivery Address</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {addresses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No saved addresses</p>
              </div>
            ) : (
              addresses.map(address => (
                <div
                  key={address.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    address.id === selectedAddressId 
                      ? 'border-gold bg-gold/5 ring-2 ring-gold/20' 
                      : 'hover:border-gold hover:shadow-md'
                  }`}
                  onClick={() => {
                    onSelect(address);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gold mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{address.label}</span>
                        {address.isDefault && (
                          <Badge className="bg-gold text-white text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{address.fullName}</p>
                      <p className="text-sm text-gray-600">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="text-sm text-gray-600">{address.country}</p>
                      {address.phone && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {address.phone}
                        </p>
                      )}
                    </div>
                    {address.id === selectedAddressId && (
                      <div className="flex-shrink-0">
                        <Check className="w-5 h-5 text-gold" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            <Button
              onClick={() => {
                setOpen(false);
                onAddNew();
              }}
              variant="outline"
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Address
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
