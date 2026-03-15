import { useState, useEffect } from 'react';
import { Save, Upload, Building, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { api } from '@/services/api';

export default function StoreSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storeData, setStoreData] = useState({
    storeName: '',
    storeEmail: '',
    storePhone: '',
    storeAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
    description: '',
    logo: '',
    favicon: '',
    businessHours: {
      monday: { open: '9:00 AM', close: '6:00 PM', closed: false },
      tuesday: { open: '9:00 AM', close: '6:00 PM', closed: false },
      wednesday: { open: '9:00 AM', close: '6:00 PM', closed: false },
      thursday: { open: '9:00 AM', close: '6:00 PM', closed: false },
      friday: { open: '9:00 AM', close: '6:00 PM', closed: false },
      saturday: { open: '10:00 AM', close: '4:00 PM', closed: false },
      sunday: { open: '', close: '', closed: true }
    }
  });

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    setLoading(true);
    
    // ALWAYS load from localStorage first - it's the source of truth
    const saved = localStorage.getItem('admin_store');
    if (saved) {
      const parsed = JSON.parse(saved);
      setStoreData({
        ...storeData,
        ...parsed,
        businessHours: parsed.businessHours || storeData.businessHours
      });
      console.log('✅ Store data loaded from localStorage');
    }
    
    // Try DynamoDB in background (don't wait, don't overwrite)
    try {
      const response = await api.getAllSettings();
      if (response.settings && response.settings.store) {
        const apiStore = response.settings.store;
        // Only update if API has data and localStorage doesn't
        if (!saved) {
          setStoreData({
            ...storeData,
            ...apiStore,
            businessHours: apiStore.businessHours || storeData.businessHours
          });
          localStorage.setItem('admin_store', JSON.stringify(apiStore));
          console.log('✅ Store data loaded from DynamoDB');
        }
      }
    } catch (apiErr) {
      console.log('⚠️ DynamoDB load skipped, using localStorage');
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to DynamoDB
      await api.saveSettingsSection('store', storeData);
      console.log('✅ Store data saved to DynamoDB');
      
      // Also save to localStorage as backup
      localStorage.setItem('admin_store', JSON.stringify(storeData));
      console.log('💾 Store data saved to localStorage');
      
      toast.success('Store information saved successfully!');
    } catch (err: any) {
      console.error('❌ Failed to save to DynamoDB:', err);
      // Fallback to localStorage
      localStorage.setItem('admin_store', JSON.stringify(storeData));
      toast.success('Store information saved locally');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setStoreData({ ...storeData, [field]: value });
  };

  const handleBusinessHoursChange = (day: string, field: string, value: any) => {
    setStoreData({
      ...storeData,
      businessHours: {
        ...storeData.businessHours,
        [day]: {
          ...storeData.businessHours[day as keyof typeof storeData.businessHours],
          [field]: value
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Store Information</h2>
          <p className="text-gray-600 mt-1">Manage your store details and business hours</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gold hover:bg-gold/90"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Basic Information
          </CardTitle>
          <CardDescription>Essential store details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                value={storeData.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                placeholder="Fashion Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={storeData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://fashionstore.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={storeData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Your store description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Store Email *
              </Label>
              <Input
                id="storeEmail"
                type="email"
                value={storeData.storeEmail}
                onChange={(e) => handleChange('storeEmail', e.target.value)}
                placeholder="info@fashionstore.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storePhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Store Phone *
              </Label>
              <Input
                id="storePhone"
                value={storeData.storePhone}
                onChange={(e) => handleChange('storePhone', e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Store Address
          </CardTitle>
          <CardDescription>Where customers can find you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeAddress">Street Address</Label>
            <Input
              id="storeAddress"
              value={storeData.storeAddress}
              onChange={(e) => handleChange('storeAddress', e.target.value)}
              placeholder="123 Fashion Street"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={storeData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="New York"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={storeData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="NY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              <Input
                id="zipCode"
                value={storeData.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                placeholder="10001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={storeData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="United States"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Business Hours
          </CardTitle>
          <CardDescription>When your store is open</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(storeData.businessHours).map(([day, hours]) => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-32 font-medium capitalize">{day}</div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!hours.closed}
                  onChange={(e) => handleBusinessHoursChange(day, 'closed', !e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Open</span>
              </label>
              {!hours.closed && (
                <>
                  <Input
                    value={hours.open}
                    onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                    className="w-32"
                    placeholder="9:00 AM"
                  />
                  <span>to</span>
                  <Input
                    value={hours.close}
                    onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                    className="w-32"
                    placeholder="6:00 PM"
                  />
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Media Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Store Media
          </CardTitle>
          <CardDescription>Logo and favicon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              value={storeData.logo}
              onChange={(e) => handleChange('logo', e.target.value)}
              placeholder="https://..."
            />
            {storeData.logo && (
              <img src={storeData.logo} alt="Logo" className="h-20 mt-2 rounded" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="favicon">Favicon URL</Label>
            <Input
              id="favicon"
              value={storeData.favicon}
              onChange={(e) => handleChange('favicon', e.target.value)}
              placeholder="https://..."
            />
            {storeData.favicon && (
              <img src={storeData.favicon} alt="Favicon" className="h-8 mt-2" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
