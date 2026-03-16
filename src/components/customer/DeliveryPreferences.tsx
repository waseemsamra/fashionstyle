import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Save, Home, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import customerDeliveryPrefs, { type Address, type CustomerDeliveryPrefs } from '@/services/customerDeliveryPrefs';

interface DeliveryPreferencesProps {
  userId: string;
}

export default function DeliveryPreferences({ userId }: DeliveryPreferencesProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<CustomerDeliveryPrefs | null>(null);
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
    label: ''
  });

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const loadedPrefs = await customerDeliveryPrefs.getPreferences(userId);
      setPrefs(loadedPrefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load delivery preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!prefs) return;
    
    setSaving(true);
    try {
      await customerDeliveryPrefs.savePreferences(userId, prefs);
      toast.success('Preferences saved successfully');
    } catch (error) {
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
      label: ''
    });
    setShowAddressModal(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm(address);
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.fullName || !addressForm.addressLine1 || !addressForm.city || !addressForm.state || !addressForm.zipCode) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingAddress && editingAddress.id) {
        await customerDeliveryPrefs.updateAddress(userId, editingAddress.id, addressForm);
        toast.success('Address updated');
      } else {
        await customerDeliveryPrefs.addAddress(userId, addressForm as Address);
        toast.success('Address added');
      }
      setShowAddressModal(false);
      await loadPreferences();
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Delete this address?')) return;
    
    try {
      await customerDeliveryPrefs.deleteAddress(userId, addressId);
      toast.success('Address deleted');
      await loadPreferences();
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await customerDeliveryPrefs.setDefaultAddress(userId, addressId);
      toast.success('Default address updated');
      await loadPreferences();
    } catch (error) {
      toast.error('Failed to set default address');
    }
  };

  const updateNotificationPrefs = (type: 'email' | 'sms', value: boolean) => {
    if (!prefs) return;
    setPrefs({ ...prefs, notifications: { ...prefs.notifications, [type]: value } });
  };

  const getAddressIcon = (label?: string) => {
    if (label?.toLowerCase() === 'work') return <Building className="w-4 h-4" />;
    return <Home className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="w-8 h-8" />
            Delivery Preferences
          </h1>
          <p className="text-gray-600 mt-1">Manage your delivery addresses and preferences</p>
        </div>
        <Button onClick={handleSavePreferences} disabled={saving} className="bg-gold hover:bg-gold/90">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {/* Saved Addresses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Saved Addresses
            </CardTitle>
            <CardDescription>Your delivery addresses</CardDescription>
          </div>
          <Button onClick={handleAddAddress} className="bg-gold hover:bg-gold/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        </CardHeader>
        <CardContent>
          {prefs?.savedAddresses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No addresses saved yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prefs?.savedAddresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-lg p-4 ${address.isDefault ? 'border-gold bg-gold/5' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${address.isDefault ? 'bg-gold/20' : 'bg-gray-100'}`}>
                        {getAddressIcon(address.label)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{address.fullName}</h3>
                          {address.isDefault && (
                            <Badge className="bg-gold text-white">Default</Badge>
                          )}
                          {address.label && (
                            <Badge variant="outline">{address.label}</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-gray-600">
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                        {address.phone && (
                          <p className="text-gray-600 text-sm mt-1">📞 {address.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!address.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefaultAddress(address.id!)}
                        >
                          Set Default
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

      {/* Delivery Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Instructions</CardTitle>
          <CardDescription>Special instructions for delivery</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Delivery Instructions</Label>
            <textarea
              id="instructions"
              className="w-full p-2 border rounded-lg h-24"
              value={prefs?.deliveryInstructions || ''}
              onChange={(e) => setPrefs({ ...prefs!, deliveryInstructions: e.target.value })}
              placeholder="e.g., Leave at front door, ring doorbell, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={prefs?.leaveAtDoor}
                onCheckedChange={(checked) => setPrefs({ ...prefs!, leaveAtDoor: checked })}
              />
              <Label>Leave at Door</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={prefs?.signatureRequired}
                onCheckedChange={(checked) => setPrefs({ ...prefs!, signatureRequired: checked })}
              />
              <Label>Signature Required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={prefs?.giftWrapping}
                onCheckedChange={(checked) => setPrefs({ ...prefs!, giftWrapping: checked })}
              />
              <Label>Gift Wrapping</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={prefs?.weekendDelivery}
                onCheckedChange={(checked) => setPrefs({ ...prefs!, weekendDelivery: checked })}
              />
              <Label>Weekend Delivery</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Notifications</CardTitle>
          <CardDescription>How would you like to be notified?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
            <Switch
              checked={prefs?.notifications.email}
              onCheckedChange={(checked) => updateNotificationPrefs('email', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>SMS Notifications</Label>
              <p className="text-sm text-gray-600">Receive updates via text message</p>
            </div>
            <Switch
              checked={prefs?.notifications.sms}
              onCheckedChange={(checked) => updateNotificationPrefs('sms', checked)}
            />
          </div>
          {prefs?.notifications.sms && (
            <div className="space-y-2">
              <Label htmlFor="smsPhone">SMS Phone Number</Label>
              <Input
                id="smsPhone"
                value={prefs.notifications.smsPhone || ''}
                onChange={(e) => setPrefs({ ...prefs!, notifications: { ...prefs.notifications, smsPhone: e.target.value } })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit' : 'Add'} Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Address Line 1 *</Label>
                <Input
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Address Line 2</Label>
                <Input
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP Code *</Label>
                <Input
                  value={addressForm.zipCode}
                  onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Phone</Label>
                <Input
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Label (e.g., Home, Work)</Label>
                <Input
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  placeholder="Home"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddressModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAddress} className="bg-gold">
                {editingAddress ? 'Update' : 'Add'} Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
