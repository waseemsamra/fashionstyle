import { useState, useEffect } from 'react';
import { Save, Upload, Building, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

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

    try {
      // FIRST: Try to load from DynamoDB via API
      console.log('📡 Loading store info from DynamoDB...');
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch('https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/admin/settings-v2/store-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });

      if (response.ok) {
        const data: any = await response.json();
        console.log('✅ Store data loaded from DynamoDB:', data);
        
        // Transform API data to match component's state structure
        setStoreData({
          ...storeData,
          storeName: data.name || data.storeName || '',
          storeEmail: data.email || data.storeEmail || '',
          storePhone: data.phone || data.storePhone || '',
          storeAddress: data.address || data.storeAddress || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
          country: data.country || '',
          website: data.website || '',
          description: data.description || '',
          logo: data.logo || '',
          favicon: data.favicon || '',
          businessHours: data.businessHours || storeData.businessHours
        });
        
        // Save to localStorage as backup
        localStorage.setItem('admin_store', JSON.stringify(data));
      } else {
        // Fallback to localStorage
        console.log('⚠️ API returned', response.status, ', falling back to localStorage');
        const saved = localStorage.getItem('admin_store');
        if (saved) {
          const parsed = JSON.parse(saved);
          setStoreData({
            ...storeData,
            storeName: parsed.name || parsed.storeName || storeData.storeName,
            storeEmail: parsed.email || parsed.storeEmail || storeData.storeEmail,
            storePhone: parsed.phone || parsed.storePhone || storeData.storePhone,
            storeAddress: parsed.address || parsed.storeAddress || storeData.storeAddress,
            city: parsed.city || storeData.city,
            state: parsed.state || storeData.state,
            zipCode: parsed.zipCode || storeData.zipCode,
            country: parsed.country || storeData.country,
            website: parsed.website || storeData.website,
            description: parsed.description || storeData.description,
            logo: parsed.logo || storeData.logo,
            favicon: parsed.favicon || storeData.favicon,
            businessHours: parsed.businessHours || storeData.businessHours
          });
          console.log('✅ Store data loaded from localStorage');
        }
      }
    } catch (error) {
      console.error('❌ Error loading store data:', error);
      
      // Fallback to localStorage
      const saved = localStorage.getItem('admin_store');
      if (saved) {
        const parsed = JSON.parse(saved);
        setStoreData({
          ...storeData,
          storeName: parsed.name || parsed.storeName || storeData.storeName,
          storeEmail: parsed.email || parsed.storeEmail || storeData.storeEmail,
          storePhone: parsed.phone || parsed.storePhone || storeData.storePhone,
          storeAddress: parsed.address || parsed.storeAddress || storeData.storeAddress,
          city: parsed.city || storeData.city,
          state: parsed.state || storeData.state,
          zipCode: parsed.zipCode || storeData.zipCode,
          country: parsed.country || storeData.country,
          website: parsed.website || storeData.website,
          description: parsed.description || storeData.description,
          logo: parsed.logo || storeData.logo,
          favicon: parsed.favicon || storeData.favicon,
          businessHours: parsed.businessHours || storeData.businessHours
        });
        console.log('✅ Store data loaded from localStorage (error fallback)');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Transform data to match API expected format
      const apiData: any = {
        name: storeData.storeName,
        email: storeData.storeEmail,
        phone: storeData.storePhone,
        address: storeData.storeAddress,
        city: storeData.city,
        state: storeData.state,
        zipCode: storeData.zipCode,
        country: storeData.country,
        website: storeData.website,
        description: storeData.description,
        logo: storeData.logo,
        favicon: storeData.favicon,
        businessHours: storeData.businessHours
      };

      // Save to DynamoDB
      console.log('📡 Saving store info to DynamoDB...');
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch('https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/admin/settings-v2/store-info', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(apiData)
      });

      if (response.ok) {
        console.log('✅ Store data saved to DynamoDB');
        // Also save to localStorage as backup
        localStorage.setItem('admin_store', JSON.stringify(storeData));
        console.log('💾 Store data saved to localStorage');
        toast.success('Store information saved successfully!');
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save to DynamoDB:', response.status, errorText);
        throw new Error('Failed to save');
      }
    } catch (err: any) {
      console.error('❌ Failed to save to DynamoDB:', err);
      // Fallback to localStorage
      localStorage.setItem('admin_store', JSON.stringify(storeData));
      toast.success('Store information saved locally (DynamoDB unavailable)');
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
