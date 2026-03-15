import { useState, useEffect } from 'react';
import { Save, DollarSign, Percent, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { api } from '@/services/api';

export default function GeneralSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generalData, setGeneralData] = useState({
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 0,
    taxEnabled: false,
    shippingFee: 0,
    freeShippingThreshold: 100,
    shippingEnabled: true
  });

  useEffect(() => {
    loadGeneralData();
  }, []);

  const loadGeneralData = async () => {
    setLoading(true);
    
    // ALWAYS load from localStorage first - it's the source of truth
    const saved = localStorage.getItem('admin_general');
    if (saved) {
      const parsed = JSON.parse(saved);
      setGeneralData({
        ...generalData,
        ...parsed
      });
      console.log('✅ General settings loaded from localStorage');
    }
    
    // Try DynamoDB in background (don't wait, don't overwrite)
    try {
      const response = await api.getAllSettings();
      if (response.settings && response.settings.general) {
        const apiGeneral = response.settings.general;
        // Only update if API has data and localStorage doesn't
        if (!saved) {
          setGeneralData({
            ...generalData,
            ...apiGeneral
          });
          localStorage.setItem('admin_general', JSON.stringify(apiGeneral));
          console.log('✅ General settings loaded from DynamoDB');
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
      await api.saveSettingsSection('general', generalData);
      console.log('✅ General settings saved to DynamoDB');
      
      // Also save to localStorage as backup
      localStorage.setItem('admin_general', JSON.stringify(generalData));
      console.log('💾 General settings saved to localStorage');
      
      toast.success('General settings saved successfully!');
    } catch (err: any) {
      console.error('❌ Failed to save to DynamoDB:', err);
      // Fallback to localStorage
      localStorage.setItem('admin_general', JSON.stringify(generalData));
      toast.success('General settings saved locally');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setGeneralData({ ...generalData, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading general settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">General Settings</h2>
          <p className="text-gray-600 mt-1">Currency, tax, and shipping configuration</p>
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

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Currency Settings
          </CardTitle>
          <CardDescription>Configure your store currency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency Code</Label>
              <Input
                id="currency"
                value={generalData.currency}
                onChange={(e) => handleChange('currency', e.target.value.toUpperCase())}
                placeholder="USD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currencySymbol">Currency Symbol</Label>
              <Input
                id="currencySymbol"
                value={generalData.currencySymbol}
                onChange={(e) => handleChange('currencySymbol', e.target.value)}
                placeholder="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Tax Configuration
          </CardTitle>
          <CardDescription>Configure tax rates for your store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={generalData.taxEnabled}
              onChange={(e) => handleChange('taxEnabled', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">Enable Tax</span>
          </label>
          
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              value={generalData.taxRate}
              onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
              placeholder="0"
              disabled={!generalData.taxEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipping Configuration
          </CardTitle>
          <CardDescription>Configure shipping fees and free shipping threshold</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={generalData.shippingEnabled}
              onChange={(e) => handleChange('shippingEnabled', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">Enable Shipping</span>
          </label>
          
          <div className="space-y-2">
            <Label htmlFor="shippingFee">Standard Shipping Fee ($)</Label>
            <Input
              id="shippingFee"
              type="number"
              value={generalData.shippingFee}
              onChange={(e) => handleChange('shippingFee', parseFloat(e.target.value) || 0)}
              placeholder="0"
              disabled={!generalData.shippingEnabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="freeShippingThreshold">Free Shipping Threshold ($)</Label>
            <Input
              id="freeShippingThreshold"
              type="number"
              value={generalData.freeShippingThreshold}
              onChange={(e) => handleChange('freeShippingThreshold', parseFloat(e.target.value) || 100)}
              placeholder="100"
              disabled={!generalData.shippingEnabled}
            />
            <p className="text-sm text-gray-600">Orders above this amount qualify for free shipping</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
