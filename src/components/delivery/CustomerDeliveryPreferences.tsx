import { useState, useEffect } from 'react';
import { MapPin, Phone, Bell, Truck, Edit, Trash2, Plus, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import customerDeliveryService, { type Address, type CustomerDeliveryPrefs } from '@/services/customerDeliveryPrefs';
import * as deliveryService from '@/services/deliveryService';

interface CustomerDeliveryPreferencesProps {
  userId: string;
  onPreferencesChange?: (prefs: CustomerDeliveryPrefs) => void;
}

export default function CustomerDeliveryPreferences({ 
  userId, 
  onPreferencesChange 
}: CustomerDeliveryPreferencesProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<CustomerDeliveryPrefs | null>(null);
  const [deliveryMethods, setDeliveryMethods] = useState<deliveryService.DeliveryMethod[]>([]);
  
  // Modal states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: '',
    label: 'Home'
  });

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prefsData, methodsData] = await Promise.all([
        customerDeliveryService.getPreferences(userId),
        deliveryService.getMethods().catch(() => [])
      ]);
      
      setPrefs(prefsData);
      setDeliveryMethods(methodsData);
      
      if (onPreferencesChange) {
        onPreferencesChange(prefsData);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load delivery preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!prefs) return;
    
    setSaving(true);
    try {
      await customerDeliveryService.savePreferences(userId, prefs);
      toast.success('Preferences saved successfully');
      
      if (onPreferencesChange) {
        onPreferencesChange(prefs);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      phone: '',
      label: 'Home'
    });
    setShowAddressModal(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm(address);
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    if (!prefs || !addressForm.fullName || !addressForm.addressLine1 || 
        !addressForm.city || !addressForm.state || !addressForm.zipCode) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingAddress && editingAddress.id) {
        const updated = await customerDeliveryService.updateAddress(
          userId, 
          editingAddress.id,
          addressForm
        );
        setPrefs({
          ...prefs,
          savedAddresses: prefs.savedAddresses.map(a => 
            a.id === editingAddress.id ? updated : a
          )
        });
        toast.success('Address updated successfully');
      } else {
        const newAddress = await customerDeliveryService.addAddress(userId, addressForm as Address);
        setPrefs({
          ...prefs,
          savedAddresses: [...prefs.savedAddresses, newAddress]
        });
        toast.success('Address added successfully');
      }
      setShowAddressModal(false);
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!prefs || !confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await customerDeliveryService.deleteAddress(userId, addressId);
      setPrefs({
        ...prefs,
        savedAddresses: prefs.savedAddresses.filter(a => a.id !== addressId)
      });
      toast.success('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!prefs) return;
    
    try {
      await customerDeliveryService.setDefaultAddress(userId, addressId);
      setPrefs({
        ...prefs,
        savedAddresses: prefs.savedAddresses.map(a => ({
          ...a,
          isDefault: a.id === addressId
        })),
        defaultAddressId: addressId
      });
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to set default address');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Delivery Preferences</h2>
          <p className="text-gray-600">Manage your delivery addresses and preferences</p>
        </div>
        <Button 
          onClick={handleSavePreferences}
          disabled={saving}
          className="bg-gold hover:bg-gold/90"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      <Tabs defaultValue="addresses" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Addresses
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Saved Addresses</CardTitle>
                <CardDescription>Manage your delivery addresses</CardDescription>
              </div>
              <Button onClick={handleAddAddress} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </CardHeader>
            <CardContent>
              {prefs?.savedAddresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No saved addresses yet</p>
                  <p className="text-sm mt-2">Add an address to speed up checkout</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {prefs?.savedAddresses.map(address => (
                    <div
                      key={address.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        address.isDefault ? 'border-gold bg-gold/5' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{address.fullName}</h3>
                            {address.isDefault && (
                              <Badge className="bg-gold">Default</Badge>
                            )}
                            {address.label && (
                              <Badge variant="outline">{address.label}</Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600">
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                          <p className="text-sm text-gray-600">{address.country}</p>
                          
                          {address.phone && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                              <Phone className="w-3 h-3" />
                              {address.phone}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          {!address.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefaultAddress(address.id!)}
                              title="Set as default"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDeleteAddress(address.id!)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Preferences</CardTitle>
              <CardDescription>Customize your delivery options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {prefs && (
                <>
                  <div className="space-y-2">
                    <Label>Preferred Delivery Method</Label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={prefs.preferredMethod || ''}
                      onChange={(e) => setPrefs({
                        ...prefs,
                        preferredMethod: e.target.value || undefined
                      })}
                    >
                      <option value="">No preference</option>
                      {deliveryMethods.map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name} - {method.price === 0 ? 'Free' : `$${method.price}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Instructions</Label>
                    <textarea
                      className="w-full p-2 border rounded-lg h-20"
                      value={prefs.deliveryInstructions || ''}
                      onChange={(e) => setPrefs({
                        ...prefs,
                        deliveryInstructions: e.target.value
                      })}
                      placeholder="e.g., Leave at back door, call upon arrival, etc."
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Delivery Options</h3>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={prefs.leaveAtDoor}
                        onCheckedChange={(checked) => setPrefs({
                          ...prefs,
                          leaveAtDoor: checked
                        })}
                      />
                      <Label>Leave at door if no answer</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={prefs.signatureRequired}
                        onCheckedChange={(checked) => setPrefs({
                          ...prefs,
                          signatureRequired: checked
                        })}
                      />
                      <Label>Require signature on delivery</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={prefs.giftWrapping}
                        onCheckedChange={(checked) => setPrefs({
                          ...prefs,
                          giftWrapping: checked
                        })}
                      />
                      <Label>Gift wrapping by default</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Preferred Delivery Window</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From</Label>
                        <Input
                          type="time"
                          value={prefs.preferredDeliveryWindow?.start || '09:00'}
                          onChange={(e) => setPrefs({
                            ...prefs,
                            preferredDeliveryWindow: {
                              start: e.target.value,
                              end: prefs.preferredDeliveryWindow?.end || '17:00'
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>To</Label>
                        <Input
                          type="time"
                          value={prefs.preferredDeliveryWindow?.end || '17:00'}
                          onChange={(e) => setPrefs({
                            ...prefs,
                            preferredDeliveryWindow: {
                              start: prefs.preferredDeliveryWindow?.start || '09:00',
                              end: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={prefs.weekendDelivery}
                        onCheckedChange={(checked) => setPrefs({
                          ...prefs,
                          weekendDelivery: checked
                        })}
                      />
                      <Label>Accept weekend delivery</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={prefs.holidayDelivery}
                        onCheckedChange={(checked) => setPrefs({
                          ...prefs,
                          holidayDelivery: checked
                        })}
                      />
                      <Label>Accept holiday delivery</Label>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive delivery updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {prefs && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={prefs.notifications.email}
                        onCheckedChange={(checked) => setPrefs({
                          ...prefs,
                          notifications: {
                            ...prefs.notifications,
                            email: checked
                          }
                        })}
                      />
                      <Label>Email notifications</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={prefs.notifications.sms}
                        onCheckedChange={(checked) => setPrefs({
                          ...prefs,
                          notifications: {
                            ...prefs.notifications,
                            sms: checked
                          }
                        })}
                      />
                      <Label>SMS notifications</Label>
                    </div>

                    {prefs.notifications.sms && (
                      <div className="pl-6 space-y-2">
                        <Label>Phone Number for SMS</Label>
                        <Input
                          type="tel"
                          value={prefs.notifications.smsPhone || ''}
                          onChange={(e) => setPrefs({
                            ...prefs,
                            notifications: {
                              ...prefs.notifications,
                              smsPhone: e.target.value
                            }
                          })}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 font-medium">You'll receive notifications for:</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Order confirmation
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Shipping confirmation
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Out for delivery
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Delivery confirmation
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Address Label</Label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="col-span-2">
                <Label>Full Name *</Label>
                <Input
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})}
                  placeholder="John Doe"
                />
              </div>

              <div className="col-span-2">
                <Label>Address Line 1 *</Label>
                <Input
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})}
                  placeholder="123 Main St"
                />
              </div>

              <div className="col-span-2">
                <Label>Address Line 2</Label>
                <Input
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})}
                  placeholder="Apt 4B"
                />
              </div>

              <div className="col-span-1">
                <Label>City *</Label>
                <Input
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                  placeholder="New York"
                />
              </div>

              <div className="col-span-1">
                <Label>State *</Label>
                <Input
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                  placeholder="NY"
                />
              </div>

              <div className="col-span-1">
                <Label>ZIP Code *</Label>
                <Input
                  value={addressForm.zipCode}
                  onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                  placeholder="10001"
                />
              </div>

              <div className="col-span-1">
                <Label>Country</Label>
                <Input
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                  placeholder="USA"
                />
              </div>

              <div className="col-span-2">
                <Label>Phone Number</Label>
                <Input
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddressModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAddress} className="bg-gold hover:bg-gold/90">
                {editingAddress ? 'Update' : 'Add'} Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
