import { useState, useEffect } from 'react';
import {
  Truck, MapPin, Clock, Settings, History, Plus, Edit, Trash2, Save,
  Package, Zap, Gift, Store, DollarSign, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as deliveryService from '@/services/deliveryService';
import DeliveryAnalytics from '@/components/delivery/DeliveryAnalytics';

export default function DeliveryManagement() {
  const [activeTab, setActiveTab] = useState('zones');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [zones, setZones] = useState<deliveryService.DeliveryZone[]>([]);
  const [methods, setMethods] = useState<deliveryService.DeliveryMethod[]>([]);
  const [rates, setRates] = useState<deliveryService.RateRule[]>([]);
  const [settings, setSettings] = useState<deliveryService.DeliverySettings | null>(null);
  const [tracking, setTracking] = useState<deliveryService.TrackingInfo[]>([]);
  
  // Modal states
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  
  // Editing states
  const [editingZone, setEditingZone] = useState<deliveryService.DeliveryZone | null>(null);
  const [editingMethod, setEditingMethod] = useState<deliveryService.DeliveryMethod | null>(null);
  const [editingRate, setEditingRate] = useState<deliveryService.RateRule | null>(null);
  const [editingRule, setEditingRule] = useState<{rateId: string, rule: any, index: number} | null>(null);
  
  // Form states
  const [zoneForm, setZoneForm] = useState<Partial<deliveryService.DeliveryZone>>({
    name: '',
    type: 'local',
    baseRate: 0,
    estimatedDays: '',
    active: true,
    cities: []
  });
  
  const [methodForm, setMethodForm] = useState<Partial<deliveryService.DeliveryMethod>>({
    name: '',
    description: '',
    days: '',
    price: 0,
    active: true
  });
  
  const [rateForm, setRateForm] = useState<Partial<deliveryService.RateRule>>({
    name: '',
    description: '',
    calculationType: 'price',
    rules: [],
    active: true
  });
  
  const [ruleForm, setRuleForm] = useState({
    min: 0,
    max: 100,
    rate: 0,
    free: false,
    description: ''
  });
  
  const [expandedRules, setExpandedRules] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      console.log('📦 Loading delivery data from DynamoDB...');
      
      const [zonesData, methodsData, ratesData, settingsData, trackingData] = await Promise.all([
        deliveryService.getZones().catch(() => []),
        deliveryService.getMethods().catch(() => []),
        deliveryService.getRates().catch(() => []),
        deliveryService.getDeliverySettings().catch(() => null),
        deliveryService.getTracking().catch(() => [])
      ]);

      setZones(zonesData);
      setMethods(methodsData);
      setRates(ratesData);
      setSettings(settingsData);
      setTracking(trackingData);

      // Cache in localStorage
      localStorage.setItem('admin_delivery_zones', JSON.stringify(zonesData));
      localStorage.setItem('admin_delivery_methods', JSON.stringify(methodsData));
      localStorage.setItem('admin_delivery_rates', JSON.stringify(ratesData));
      localStorage.setItem('admin_delivery_settings', JSON.stringify(settingsData));
      
      toast.success('Delivery data loaded successfully');
    } catch (error) {
      console.error('Error loading delivery data:', error);
      
      // Fallback to localStorage
      const cached = localStorage.getItem('admin_delivery_zones');
      if (cached) setZones(JSON.parse(cached));
      toast.error('Failed to load from backend');
    } finally {
      setLoading(false);
    }
  };

  // ============ ZONE CRUD ============
  const handleAddZone = () => {
    setEditingZone(null);
    setZoneForm({ name: '', type: 'local', baseRate: 0, estimatedDays: '', active: true, cities: [] });
    setCityInput('');
    setShowZoneModal(true);
  };

  const handleEditZone = (zone: deliveryService.DeliveryZone) => {
    setEditingZone(zone);
    setZoneForm(zone);
    setShowZoneModal(true);
  };

  const handleAddCity = () => {
    if (cityInput.trim()) {
      setZoneForm({ ...zoneForm, cities: [...(zoneForm.cities || []), cityInput.trim()] });
      setCityInput('');
    }
  };

  const handleRemoveCity = (city: string) => {
    setZoneForm({ ...zoneForm, cities: (zoneForm.cities || []).filter(c => c !== city) });
  };

  const handleSaveZone = async () => {
    if (!zoneForm.name || !zoneForm.baseRate || !zoneForm.estimatedDays) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingZone) {
        await deliveryService.updateZone(editingZone.id, zoneForm);
        setZones(zones.map(z => z.id === editingZone.id ? { ...z, ...zoneForm } : z));
        toast.success('Zone updated successfully');
      } else {
        const newZone = await deliveryService.createZone(zoneForm as any);
        setZones([...zones, newZone]);
        toast.success('Zone created successfully');
      }
      setShowZoneModal(false);
    } catch (error) {
      toast.error('Failed to save zone');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm('Delete this zone?')) return;
    try {
      await deliveryService.deleteZone(id);
      setZones(zones.filter(z => z.id !== id));
      toast.success('Zone deleted');
    } catch (error) {
      toast.error('Failed to delete zone');
    }
  };

  // ============ METHOD CRUD ============
  const handleAddMethod = () => {
    setEditingMethod(null);
    setMethodForm({ name: '', description: '', days: '', price: 0, active: true });
    setShowMethodModal(true);
  };

  const handleEditMethod = (method: deliveryService.DeliveryMethod) => {
    setEditingMethod(method);
    setMethodForm(method);
    setShowMethodModal(true);
  };

  const handleSaveMethod = async () => {
    if (!methodForm.name || !methodForm.days) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingMethod) {
        await deliveryService.updateMethod(editingMethod.id, methodForm);
        setMethods(methods.map(m => m.id === editingMethod.id ? { ...m, ...methodForm } : m));
        toast.success('Method updated');
      } else {
        const newMethod = await deliveryService.createMethod(methodForm as any);
        setMethods([...methods, newMethod]);
        toast.success('Method created');
      }
      setShowMethodModal(false);
    } catch (error) {
      toast.error('Failed to save method');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm('Delete this method?')) return;
    try {
      await deliveryService.deleteMethod(id);
      setMethods(methods.filter(m => m.id !== id));
      toast.success('Method deleted');
    } catch (error) {
      toast.error('Failed to delete method');
    }
  };

  // ============ RATE CRUD ============
  const handleAddRate = () => {
    setEditingRate(null);
    setRateForm({ name: '', description: '', calculationType: 'price', rules: [], active: true });
    setShowRateModal(true);
  };

  const handleEditRate = (rate: deliveryService.RateRule) => {
    setEditingRate(rate);
    setRateForm(rate);
    setShowRateModal(true);
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setRuleForm({ min: 0, max: 100, rate: 0, free: false, description: '' });
    setShowRuleModal(true);
  };

  const handleEditRule = (rateId: string, rule: any, index: number) => {
    setEditingRule({ rateId, rule, index });
    setRuleForm(rule);
    setShowRuleModal(true);
  };

  const handleSaveRule = () => {
    const rules = rateForm.rules || [];
    if (editingRule) {
      const updated = [...rules];
      updated[editingRule.index] = ruleForm;
      setRateForm({ ...rateForm, rules: updated });
    } else {
      setRateForm({ ...rateForm, rules: [...rules, ruleForm] });
    }
    setShowRuleModal(false);
  };

  const handleRemoveRule = (index: number) => {
    setRateForm({ ...rateForm, rules: (rateForm.rules || []).filter((_, i) => i !== index) });
  };

  const handleSaveRate = async () => {
    if (!rateForm.name || !rateForm.rules?.length) {
      toast.error('Please add at least one rule');
      return;
    }

    setSaving(true);
    try {
      if (editingRate) {
        await deliveryService.updateRate(editingRate.id, rateForm);
        setRates(rates.map(r => r.id === editingRate.id ? { ...r, ...rateForm } : r));
        toast.success('Rate updated');
      } else {
        const newRate = await deliveryService.createRate(rateForm as any);
        setRates([...rates, newRate]);
        toast.success('Rate created');
      }
      setShowRateModal(false);
    } catch (error) {
      toast.error('Failed to save rate');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Delete this rate?')) return;
    try {
      await deliveryService.deleteRate(id);
      setRates(rates.filter(r => r.id !== id));
      toast.success('Rate deleted');
    } catch (error) {
      toast.error('Failed to delete rate');
    }
  };

  // ============ SETTINGS ============
  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await deliveryService.updateDeliverySettings(settings);
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleRules = (id: string) => {
    setExpandedRules(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getIcon = (id: string) => {
    const icons: Record<string, any> = { standard: Package, express: Zap, 'next-day': Clock, 'free-shipping': Gift, 'store-pickup': Store };
    return icons[id] || Truck;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div><p className="text-gray-600">Loading...</p></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Truck className="w-8 h-8" />Delivery Management</h1>
          <p className="text-gray-600 mt-1">Configure delivery zones, methods, rates and tracking</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="zones"><MapPin className="w-4 h-4 mr-2" />Zones</TabsTrigger>
          <TabsTrigger value="methods"><Truck className="w-4 h-4 mr-2" />Methods</TabsTrigger>
          <TabsTrigger value="rates"><DollarSign className="w-4 h-4 mr-2" />Rates</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
          <TabsTrigger value="tracking"><History className="w-4 h-4 mr-2" />Tracking</TabsTrigger>
          <TabsTrigger value="analytics"><Package className="w-4 h-4 mr-2" />Analytics</TabsTrigger>
        </TabsList>

        {/* ZONES */}
        <TabsContent value="zones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Delivery Zones</CardTitle><CardDescription>Manage delivery zones</CardDescription></div>
              <Button onClick={handleAddZone} className="bg-gold"><Plus className="w-4 h-4 mr-2" />Add Zone</Button>
            </CardHeader>
            <CardContent>
              {zones.length === 0 ? <p className="text-center text-gray-500 py-8">No zones yet</p> : (
                <div className="space-y-4">
                  {zones.map(zone => (
                    <div key={zone.id} className="border rounded-lg p-4 flex justify-between items-start">
                      <div className="flex gap-3 flex-1">
                        <div className="p-2 bg-gold/10 rounded-lg"><Truck className="w-5 h-5 text-gold" /></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2"><h3 className="font-semibold">{zone.name}</h3><Badge variant={zone.active ? 'default' : 'secondary'}>{zone.active ? 'Active' : 'Inactive'}</Badge></div>
                          <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                            <div><p className="text-gray-500">Type</p><p className="font-medium capitalize">{zone.type}</p></div>
                            <div><p className="text-gray-500">Base Rate</p><p className="font-medium text-gold">${zone.baseRate}</p></div>
                            <div><p className="text-gray-500">Delivery</p><p className="font-medium">{zone.estimatedDays}</p></div>
                          </div>
                          {zone.cities?.length ? <div className="mt-2 flex flex-wrap gap-1">{zone.cities.map(c => <Badge key={c} variant="outline">{c}</Badge>)}</div> : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditZone(zone)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteZone(zone.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* METHODS */}
        <TabsContent value="methods">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Delivery Methods</CardTitle><CardDescription>Configure delivery options</CardDescription></div>
              <Button onClick={handleAddMethod} className="bg-gold"><Plus className="w-4 h-4 mr-2" />Add Method</Button>
            </CardHeader>
            <CardContent>
              {methods.length === 0 ? <p className="text-center text-gray-500 py-8">No methods yet</p> : (
                <div className="space-y-4">
                  {methods.map(method => (
                    <div key={method.id} className="border rounded-lg p-4 flex justify-between items-start">
                      <div className="flex gap-3 flex-1">
                        <div className="p-2 bg-gold/10 rounded-lg">{getIcon(method.id)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2"><h3 className="font-semibold">{method.name}</h3><Badge variant={method.active ? 'default' : 'secondary'}>{method.active ? 'Active' : 'Inactive'}</Badge></div>
                          {method.description && <p className="text-sm text-gray-600 mt-1">{method.description}</p>}
                          <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                            <div><p className="text-gray-500">Price</p><p className="font-semibold text-gold">{method.price === 0 ? 'FREE' : `$${method.price}`}</p></div>
                            <div><p className="text-gray-500">Time</p><p className="font-medium">{method.days}</p></div>
                            {method.minOrder && <div><p className="text-gray-500">Min Order</p><p className="font-medium">${method.minOrder}</p></div>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditMethod(method)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteMethod(method.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RATES */}
        <TabsContent value="rates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Rate Rules</CardTitle><CardDescription>Shipping rate calculation</CardDescription></div>
              <Button onClick={handleAddRate} className="bg-gold"><Plus className="w-4 h-4 mr-2" />Add Rate</Button>
            </CardHeader>
            <CardContent>
              {rates.length === 0 ? <p className="text-center text-gray-500 py-8">No rates yet</p> : (
                <div className="space-y-4">
                  {rates.map(rate => (
                    <div key={rate.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{rate.name}</h3>
                            <Badge variant={rate.active ? 'default' : 'secondary'}>{rate.active ? 'Active' : 'Inactive'}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => toggleRules(rate.id)}>{expandedRules.includes(rate.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</Button>
                          </div>
                          {rate.description && <p className="text-sm text-gray-600 mt-1">{rate.description}</p>}
                          <p className="text-sm text-gray-500 mt-1">Calculation: <span className="capitalize">{rate.calculationType}</span></p>
                          
                          {expandedRules.includes(rate.id) && (
                            <div className="mt-4 space-y-2 pl-4 border-l-2 border-gold/30">
                              <div className="flex justify-between mb-2">
                                <h4 className="font-medium">Rules</h4>
                                <Button size="sm" variant="outline" onClick={() => { setEditingRate(rate); handleAddRule(); }}><Plus className="w-3 h-3 mr-1" />Add Rule</Button>
                              </div>
                              {rate.rules.map((rule, i) => (
                                <div key={i} className="flex justify-between bg-gray-50 p-2 rounded text-sm">
                                  <span>{rule.min}-{rule.max === 999 ? '∞' : rule.max} {rate.calculationType === 'weight' ? 'lbs' : rate.calculationType === 'price' ? '$' : 'mi'} → <span className="font-semibold text-gold">{rule.free ? 'FREE' : `$${rule.rate}`}</span></span>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => handleEditRule(rate.id, rule, i)}><Edit className="w-3 h-3" /></Button>
                                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleRemoveRule(i)}><X className="w-3 h-3" /></Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditRate(rate)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteRate(rate.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>Delivery Settings</CardTitle><CardDescription>Global configuration</CardDescription></CardHeader>
            <CardContent>
              {settings && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">General</h3>
                      <div><Label>Default Method</Label><select className="w-full p-2 border rounded" value={settings.defaultMethod} onChange={(e) => setSettings({...settings, defaultMethod: e.target.value})}>{methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                      <div><Label>Processing Time</Label><Input value={settings.processingTime} onChange={(e) => setSettings({...settings, processingTime: e.target.value})} /></div>
                      <div><Label>Cut-off Time</Label><Input value={settings.cutOffTime} onChange={(e) => setSettings({...settings, cutOffTime: e.target.value})} /></div>
                      <div><Label>Max Days</Label><Input type="number" value={settings.maxDeliveryDays} onChange={(e) => setSettings({...settings, maxDeliveryDays: parseInt(e.target.value)})} /></div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-medium">Free Shipping</h3>
                      <div className="flex items-center gap-2"><Switch checked={settings.enableFreeShipping} onCheckedChange={(c) => setSettings({...settings, enableFreeShipping: c})} /><Label>Enable</Label></div>
                      {settings.enableFreeShipping && <div className="pl-6"><Label>Threshold ($)</Label><Input type="number" value={settings.freeShippingThreshold} onChange={(e) => setSettings({...settings, freeShippingThreshold: parseInt(e.target.value)})} /></div>}
                      <h3 className="font-medium mt-4">Tracking</h3>
                      <div className="flex items-center gap-2"><Switch checked={settings.enableTracking} onCheckedChange={(c) => setSettings({...settings, enableTracking: c})} /><Label>Enable</Label></div>
                      {settings.enableTracking && <div className="pl-6"><Label>URL Template</Label><Input value={settings.trackingUrl} onChange={(e) => setSettings({...settings, trackingUrl: e.target.value})} placeholder="https://track.com/{tracking}" /></div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-6 border-t">
                    <div className="space-y-2">
                      <h3 className="font-medium">Options</h3>
                      <div className="flex items-center gap-2"><Switch checked={settings.weekendDelivery} onCheckedChange={(c) => setSettings({...settings, weekendDelivery: c})} /><Label>Weekend</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={settings.holidayDelivery} onCheckedChange={(c) => setSettings({...settings, holidayDelivery: c})} /><Label>Holiday</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={settings.addressValidation} onCheckedChange={(c) => setSettings({...settings, addressValidation: c})} /><Label>Address Validation</Label></div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Additional</h3>
                      <div className="flex items-center gap-2"><Switch checked={settings.signatureRequired} onCheckedChange={(c) => setSettings({...settings, signatureRequired: c})} /><Label>Signature</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={settings.insuranceRequired} onCheckedChange={(c) => setSettings({...settings, insuranceRequired: c})} /><Label>Insurance</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={settings.internationalCustoms} onCheckedChange={(c) => setSettings({...settings, internationalCustoms: c})} /><Label>Customs</Label></div>
                    </div>
                  </div>
                  <div className="pt-6 border-t"><Label>Return Policy</Label><textarea className="w-full p-2 border rounded h-20" value={settings.returnPolicy} onChange={(e) => setSettings({...settings, returnPolicy: e.target.value})} /></div>
                  <div className="flex justify-end"><Button onClick={handleSaveSettings} disabled={saving} className="bg-gold"><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}</Button></div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRACKING */}
        <TabsContent value="tracking">
          <Card>
            <CardHeader><CardTitle>Order Tracking</CardTitle><CardDescription>Track deliveries</CardDescription></CardHeader>
            <CardContent>
              {tracking.length === 0 ? <p className="text-center text-gray-500 py-8">No tracking data</p> : (
                <div className="space-y-4">
                  {tracking.map(t => (
                    <div key={t.id} className="border rounded-lg p-4">
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center gap-2"><h3 className="font-semibold">Order #{t.orderId}</h3><Badge className={t.status === 'delivered' ? 'bg-green-100 text-green-800' : t.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>{t.status.replace(/_/g, ' ')}</Badge></div>
                          <p className="text-sm text-gray-600 mt-1">{t.customerName} • {t.carrier} • {t.trackingNumber}</p>
                          <p className="text-sm text-gray-600">Est: {t.estimatedDelivery || 'N/A'}{t.actualDelivery ? ` • Delivered: ${t.actualDelivery}` : ''}</p>
                          <div className="mt-3 space-y-1">{t.updates.map((u, i) => <div key={i} className="text-sm flex gap-3"><span className="text-gray-500 w-32">{u.date} {u.time}</span><span className="font-medium">{u.status}</span><span className="text-gray-500">- {u.location}</span></div>)}</div>
                        </div>
                        <Button variant="outline" size="sm">Update</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics">
          <DeliveryAnalytics />
        </TabsContent>
      </Tabs>

      {/* ZONE MODAL */}
      <Dialog open={showZoneModal} onOpenChange={setShowZoneModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingZone ? 'Edit' : 'Add'} Zone</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name *</Label><Input value={zoneForm.name} onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})} /></div>
              <div><Label>Type *</Label><select className="w-full p-2 border rounded" value={zoneForm.type} onChange={(e) => setZoneForm({...zoneForm, type: e.target.value as any})}><option value="local">Local</option><option value="regional">Regional</option><option value="national">National</option><option value="international">International</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Base Rate ($) *</Label><Input type="number" step="0.01" value={zoneForm.baseRate} onChange={(e) => setZoneForm({...zoneForm, baseRate: parseFloat(e.target.value)})} /></div>
              <div><Label>Delivery Time *</Label><Input value={zoneForm.estimatedDays} onChange={(e) => setZoneForm({...zoneForm, estimatedDays: e.target.value})} placeholder="3-5 days" /></div>
            </div>
            <div><Label>Cities</Label><div className="flex gap-2"><Input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="City" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCity())} /><Button type="button" variant="outline" onClick={handleAddCity}>Add</Button></div>{zoneForm.cities?.length ? <div className="flex flex-wrap gap-1 mt-2">{zoneForm.cities.map(c => <Badge key={c} variant="secondary" className="gap-1">{c}<button onClick={() => handleRemoveCity(c)}><X className="w-3 h-3" /></button></Badge>)}</div> : null}</div>
            <div className="flex items-center gap-2"><Switch checked={zoneForm.active} onCheckedChange={(c) => setZoneForm({...zoneForm, active: c})} /><Label>Active</Label></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowZoneModal(false)}>Cancel</Button><Button onClick={handleSaveZone} disabled={saving} className="bg-gold">{saving ? 'Saving...' : (editingZone ? 'Update' : 'Create')}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* METHOD MODAL */}
      <Dialog open={showMethodModal} onOpenChange={setShowMethodModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingMethod ? 'Edit' : 'Add'} Method</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={methodForm.name} onChange={(e) => setMethodForm({...methodForm, name: e.target.value})} /></div>
            <div><Label>Description</Label><Input value={methodForm.description} onChange={(e) => setMethodForm({...methodForm, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price ($) *</Label><Input type="number" step="0.01" value={methodForm.price} onChange={(e) => setMethodForm({...methodForm, price: parseFloat(e.target.value)})} /></div>
              <div><Label>Time *</Label><Input value={methodForm.days} onChange={(e) => setMethodForm({...methodForm, days: e.target.value})} /></div>
            </div>
            <div><Label>Min Order (Optional)</Label><Input type="number" value={methodForm.minOrder || ''} onChange={(e) => setMethodForm({...methodForm, minOrder: e.target.value ? parseInt(e.target.value) : undefined})} /></div>
            <div className="flex items-center gap-2"><Switch checked={methodForm.active} onCheckedChange={(c) => setMethodForm({...methodForm, active: c})} /><Label>Active</Label></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowMethodModal(false)}>Cancel</Button><Button onClick={handleSaveMethod} disabled={saving} className="bg-gold">{saving ? 'Saving...' : (editingMethod ? 'Update' : 'Create')}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RATE MODAL */}
      <Dialog open={showRateModal} onOpenChange={setShowRateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingRate ? 'Edit' : 'Add'} Rate Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={rateForm.name} onChange={(e) => setRateForm({...rateForm, name: e.target.value})} /></div>
            <div><Label>Description</Label><Input value={rateForm.description} onChange={(e) => setRateForm({...rateForm, description: e.target.value})} /></div>
            <div><Label>Calculation Type *</Label><select className="w-full p-2 border rounded" value={rateForm.calculationType} onChange={(e) => setRateForm({...rateForm, calculationType: e.target.value as any})}><option value="price">Price</option><option value="weight">Weight</option><option value="distance">Distance</option></select></div>
            <div><div className="flex justify-between"><Label>Rules</Label><Button size="sm" variant="outline" onClick={handleAddRule}><Plus className="w-3 h-3 mr-1" />Add</Button></div>{rateForm.rules?.map((r, i) => <div key={i} className="flex justify-between bg-gray-50 p-2 rounded text-sm mt-1"><span>{r.min}-{r.max === 999 ? '∞' : r.max} → <span className="font-semibold text-gold">{r.free ? 'FREE' : `$${r.rate}`}</span></span><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => handleEditRule('', r, i)}><Edit className="w-3 h-3" /></Button><Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleRemoveRule(i)}><X className="w-3 h-3" /></Button></div></div>)}</div>
            <div className="flex items-center gap-2"><Switch checked={rateForm.active} onCheckedChange={(c) => setRateForm({...rateForm, active: c})} /><Label>Active</Label></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowRateModal(false)}>Cancel</Button><Button onClick={handleSaveRate} disabled={saving} className="bg-gold">{saving ? 'Saving...' : (editingRate ? 'Update' : 'Create')}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RULE MODAL */}
      <Dialog open={showRuleModal} onOpenChange={setShowRuleModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingRule ? 'Edit' : 'Add'} Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Min</Label><Input type="number" value={ruleForm.min} onChange={(e) => setRuleForm({...ruleForm, min: parseFloat(e.target.value)})} /></div>
              <div><Label>Max</Label><Input type="number" value={ruleForm.max} onChange={(e) => setRuleForm({...ruleForm, max: parseFloat(e.target.value)})} /></div>
            </div>
            <div><Label>Rate ($)</Label><Input type="number" step="0.01" value={ruleForm.rate} onChange={(e) => setRuleForm({...ruleForm, rate: parseFloat(e.target.value)})} disabled={ruleForm.free} /></div>
            <div className="flex items-center gap-2"><Switch checked={ruleForm.free} onCheckedChange={(c) => setRuleForm({...ruleForm, free: c, rate: c ? 0 : ruleForm.rate})} /><Label>Free Shipping</Label></div>
            <div><Label>Description</Label><Input value={ruleForm.description} onChange={(e) => setRuleForm({...ruleForm, description: e.target.value})} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowRuleModal(false)}>Cancel</Button><Button onClick={handleSaveRule} className="bg-gold">{editingRule ? 'Update' : 'Add'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
