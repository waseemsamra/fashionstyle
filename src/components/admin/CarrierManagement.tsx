import { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  DollarSign,
  MapPin,
  Settings,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Printer,
  Search,
  History,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import carrierService, { 
  type Carrier, type Rate, type ShipmentResponse, type TrackingInfo 
} from '@/services/carrierService';

const CARRIER_LOGOS: Record<string, { icon: string; color: string }> = {
  UPS: { icon: '📦', color: 'bg-amber-100 text-amber-800' },
  FEDEX: { icon: '📮', color: 'bg-purple-100 text-purple-800' },
  USPS: { icon: '✉️', color: 'bg-blue-100 text-blue-800' },
  DHL: { icon: '🚚', color: 'bg-yellow-100 text-yellow-800' }
};

const COUNTRY_OPTIONS = ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'France', 'Japan'];
const STATE_OPTIONS: Record<string, string[]> = {
  USA: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
  Canada: ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT']
};

export default function CarrierManagement() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('carriers');
  
  // Data states
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [shipmentHistory, setShipmentHistory] = useState<ShipmentResponse[]>([]);
  const [currentShipment, setCurrentShipment] = useState<ShipmentResponse | null>(null);
  
  // Form states
  const [credentials, setCredentials] = useState<any>({});
  const [shipmentForm, setShipmentForm] = useState({
    fromAddress: {
      name: 'Fashion Store',
      company: 'Fashion Store Inc.',
      street1: '123 Fashion Ave',
      street2: '',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
      phone: '+1-212-555-0123',
      email: 'shipping@fashionstore.com'
    },
    toAddress: {
      name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA',
      phone: '',
      email: ''
    },
    package: {
      weight: 1,
      weightUnit: 'lb' as 'lb' | 'kg',
      length: 10,
      width: 8,
      height: 2,
      dimensionUnit: 'in' as 'in' | 'cm',
      value: 100,
      description: 'Merchandise',
      hazardous: false,
      signatureRequired: false
    },
    selectedCarriers: [] as string[],
    saturdayDelivery: false,
    insurance: false
  });

  const [pickupForm, setPickupForm] = useState({
    date: new Date().toISOString().split('T')[0],
    timeWindow: { start: '09:00', end: '17:00' },
    packages: [{ count: 1, weight: 10, type: 'package' as const }],
    location: 'front_door' as const,
    instructions: ''
  });

  // Modal states
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Tracking state
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [carriersData, historyData] = await Promise.all([
        carrierService.getAllCarriers(),
        carrierService.getShipmentHistory()
      ]);
      
      setCarriers(carriersData);
      setShipmentHistory(historyData);
    } catch (error) {
      console.error('Error loading carrier data:', error);
      toast.error('Failed to load carrier data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCarrier = async (carrierId: string, enabled: boolean) => {
    try {
      await carrierService.updateCarrier(carrierId, { enabled });
      setCarriers(carriers.map(c => 
        c.id === carrierId ? { ...c, enabled } : c
      ));
      toast.success(`${carrierId} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating carrier:', error);
      toast.error('Failed to update carrier');
    }
  };

  const handleSaveCredentials = async () => {
    if (!selectedCarrier) return;
    
    try {
      await carrierService.saveCredentials(selectedCarrier.id, credentials);
      await carrierService.updateCarrier(selectedCarrier.id, { configured: true });
      await loadData();
      setShowCredentialsModal(false);
      toast.success('Credentials saved successfully');
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Failed to save credentials');
    }
  };

  const handleGetRates = async () => {
    try {
      const result = await carrierService.getRates(
        shipmentForm.fromAddress,
        shipmentForm.toAddress,
        shipmentForm.package,
        shipmentForm.selectedCarriers.length ? shipmentForm.selectedCarriers : undefined
      );
      setRates(result.rates);
      setShowRatesModal(true);
    } catch (error) {
      console.error('Error getting rates:', error);
      toast.error('Failed to get rates');
    }
  };

  const handleCreateShipment = async (rate: Rate) => {
    try {
      const result = await carrierService.createShipment({
        carrierId: rate.carrier,
        serviceId: rate.serviceId,
        fromAddress: shipmentForm.fromAddress,
        toAddress: shipmentForm.toAddress,
        package: shipmentForm.package,
        reference: `ORDER-${Date.now()}`,
        saturdayDelivery: shipmentForm.saturdayDelivery,
        signature: shipmentForm.package.signatureRequired,
        insurance: shipmentForm.insurance ? { value: shipmentForm.package.value || 100, type: 'basic' } : undefined
      });
      
      setShipmentHistory(prev => [result, ...prev]);
      setCurrentShipment(result);
      toast.success('Shipment created successfully');
      setShowRatesModal(false);
      setShowShipModal(true);
      const trackingData = await carrierService.trackShipment(result.carrier, result.trackingNumber);
      setTracking(trackingData);
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast.error('Failed to create shipment');
    }
  };

  const handleTrackShipment = async (carrierId: string, trackNum: string) => {
    try {
      const result = await carrierService.trackShipment(carrierId, trackNum);
      setTracking(result);
      setShowTrackModal(true);
    } catch (error) {
      console.error('Error tracking shipment:', error);
      toast.error('Failed to track shipment');
    }
  };

  const handleValidateAddress = async () => {
    try {
      const result = await carrierService.validateAddress(shipmentForm.toAddress);
      if (result.valid && result.normalizedAddress) {
        toast.success('Address is valid');
        setShipmentForm({
          ...shipmentForm,
          toAddress: {
            ...shipmentForm.toAddress,
            ...result.normalizedAddress
          }
        });
      } else if (result.suggestions && result.suggestions.length > 0) {
        toast.warning('Address could not be verified');
      } else {
        toast.warning('Address could not be verified');
      }
    } catch (error) {
      console.error('Error validating address:', error);
      toast.error('Failed to validate address');
    }
  };

  const handleSchedulePickup = async () => {
    try {
      const result = await carrierService.schedulePickup({
        carrierId: selectedCarrier?.id || 'UPS',
        address: shipmentForm.fromAddress,
        date: pickupForm.date,
        timeWindow: pickupForm.timeWindow,
        packages: pickupForm.packages,
        location: pickupForm.location,
        instructions: pickupForm.instructions
      });
      
      toast.success(`Pickup scheduled: ${result.confirmationNumber}`);
      setShowPickupModal(false);
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      toast.error('Failed to schedule pickup');
    }
  };

  const downloadLabel = (url: string) => {
    window.open(url, '_blank');
  };

  const printLabel = (url: string) => {
    const printWindow = window.open(url, '_blank');
    printWindow?.print();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      exception: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status] || 'bg-gray-100'}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="w-8 h-8" />
            Carrier Management
          </h1>
          <p className="text-gray-600 mt-1">Manage shipping carriers, rates, and shipments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPickupModal(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Pickup
          </Button>
          <Button variant="outline" onClick={() => setShowHistoryModal(true)}>
            <History className="w-4 h-4 mr-2" />
            Shipment History
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="carriers" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Carriers
          </TabsTrigger>
          <TabsTrigger value="ship" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Create Shipment
          </TabsTrigger>
          <TabsTrigger value="rates" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Rate Comparison
          </TabsTrigger>
          <TabsTrigger value="track" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Track
          </TabsTrigger>
        </TabsList>

        {/* Carriers Tab */}
        <TabsContent value="carriers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {carriers.map((carrier) => {
              const logo = CARRIER_LOGOS[carrier.id] || { icon: '🚚', color: 'bg-gray-100' };
              return (
                <Card key={carrier.id} className={`${carrier.enabled ? 'border-gold' : 'opacity-60'}`}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`text-4xl p-3 rounded-lg ${logo.color}`}>
                        {logo.icon}
                      </div>
                      <Switch
                        checked={carrier.enabled}
                        onCheckedChange={(checked) => handleToggleCarrier(carrier.id, checked)}
                      />
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{carrier.name}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        {carrier.configured ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Configured
                          </span>
                        ) : (
                          <span className="text-yellow-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Not Configured
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Services</span>
                        <span>{Object.keys(carrier.services || {}).length}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCarrier(carrier);
                          setCredentials({});
                          setShowCredentialsModal(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Carrier Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Carrier Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Carriers</p>
                  <p className="text-2xl font-bold">{carriers.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Enabled</p>
                  <p className="text-2xl font-bold text-green-600">
                    {carriers.filter(c => c.enabled).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Configured</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {carriers.filter(c => c.configured).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Shipments</p>
                  <p className="text-2xl font-bold">{shipmentHistory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Shipment Tab */}
        <TabsContent value="ship" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Shipment</CardTitle>
              <CardDescription>Enter shipment details to get rates and create labels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* From Address */}
              <div>
                <h3 className="font-medium mb-4">From Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={shipmentForm.fromAddress.name}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        fromAddress: { ...shipmentForm.fromAddress, name: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={shipmentForm.fromAddress.company}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        fromAddress: { ...shipmentForm.fromAddress, company: e.target.value }
                      })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Street Address</Label>
                    <Input
                      value={shipmentForm.fromAddress.street1}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        fromAddress: { ...shipmentForm.fromAddress, street1: e.target.value }
                      })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Street Address 2 (Optional)</Label>
                    <Input
                      value={shipmentForm.fromAddress.street2}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        fromAddress: { ...shipmentForm.fromAddress, street2: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={shipmentForm.fromAddress.city}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        fromAddress: { ...shipmentForm.fromAddress, city: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={shipmentForm.fromAddress.state}
                      onValueChange={(value) => setShipmentForm({
                        ...shipmentForm,
                        fromAddress: { ...shipmentForm.fromAddress, state: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATE_OPTIONS.USA.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ZIP Code</Label>
                    <Input
                      value={shipmentForm.fromAddress.zip}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        fromAddress: { ...shipmentForm.fromAddress, zip: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select
                      value={shipmentForm.fromAddress.country}
                      onValueChange={(value) => setShipmentForm({
                        ...shipmentForm,
                        fromAddress: { ...shipmentForm.fromAddress, country: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* To Address */}
              <div className="pt-6 border-t">
                <h3 className="font-medium mb-4">To Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={shipmentForm.toAddress.name}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        toAddress: { ...shipmentForm.toAddress, name: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={shipmentForm.toAddress.company}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        toAddress: { ...shipmentForm.toAddress, company: e.target.value }
                      })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Street Address</Label>
                    <Input
                      value={shipmentForm.toAddress.street1}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        toAddress: { ...shipmentForm.toAddress, street1: e.target.value }
                      })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Street Address 2 (Optional)</Label>
                    <Input
                      value={shipmentForm.toAddress.street2}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        toAddress: { ...shipmentForm.toAddress, street2: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={shipmentForm.toAddress.city}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        toAddress: { ...shipmentForm.toAddress, city: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={shipmentForm.toAddress.state}
                      onValueChange={(value) => setShipmentForm({
                        ...shipmentForm,
                        toAddress: { ...shipmentForm.toAddress, state: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATE_OPTIONS.USA.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ZIP Code</Label>
                    <Input
                      value={shipmentForm.toAddress.zip}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        toAddress: { ...shipmentForm.toAddress, zip: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select
                      value={shipmentForm.toAddress.country}
                      onValueChange={(value) => setShipmentForm({
                        ...shipmentForm,
                        toAddress: { ...shipmentForm.toAddress, country: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidateAddress}
                  className="mt-4"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Validate Address
                </Button>
              </div>

              {/* Package Details */}
              <div className="pt-6 border-t">
                <h3 className="font-medium mb-4">Package Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Weight</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={shipmentForm.package.weight}
                        onChange={(e) => setShipmentForm({
                          ...shipmentForm,
                          package: { ...shipmentForm.package, weight: parseFloat(e.target.value) }
                        })}
                        className="flex-1"
                      />
                      <Select
                        value={shipmentForm.package.weightUnit}
                        onValueChange={(value) => setShipmentForm({
                          ...shipmentForm,
                          package: { ...shipmentForm.package, weightUnit: value as 'lb' | 'kg' }
                        })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Length</Label>
                    <Input
                      type="number"
                      value={shipmentForm.package.length}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        package: { ...shipmentForm.package, length: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Width</Label>
                    <Input
                      type="number"
                      value={shipmentForm.package.width}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        package: { ...shipmentForm.package, width: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <Input
                      type="number"
                      value={shipmentForm.package.height}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        package: { ...shipmentForm.package, height: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Value ($)</Label>
                    <Input
                      type="number"
                      value={shipmentForm.package.value}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        package: { ...shipmentForm.package, value: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={shipmentForm.package.description}
                      onChange={(e) => setShipmentForm({
                        ...shipmentForm,
                        package: { ...shipmentForm.package, description: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={shipmentForm.package.hazardous}
                      onCheckedChange={(checked) => setShipmentForm({
                        ...shipmentForm,
                        package: { ...shipmentForm.package, hazardous: checked }
                      })}
                    />
                    <Label>Hazardous Materials</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={shipmentForm.package.signatureRequired}
                      onCheckedChange={(checked) => setShipmentForm({
                        ...shipmentForm,
                        package: { ...shipmentForm.package, signatureRequired: checked }
                      })}
                    />
                    <Label>Signature Required</Label>
                  </div>
                </div>
              </div>

              {/* Shipping Options */}
              <div className="pt-6 border-t">
                <h3 className="font-medium mb-4">Shipping Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Carriers</Label>
                    <Select
                      value={shipmentForm.selectedCarriers.join(',')}
                      onValueChange={(value) => setShipmentForm({
                        ...shipmentForm,
                        selectedCarriers: value ? value.split(',') : []
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select carriers" />
                      </SelectTrigger>
                      <SelectContent>
                        {carriers.filter(c => c.enabled).map(carrier => (
                          <SelectItem key={carrier.id} value={carrier.id}>
                            {carrier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 pt-8">
                    <Switch
                      checked={shipmentForm.saturdayDelivery}
                      onCheckedChange={(checked) => setShipmentForm({
                        ...shipmentForm,
                        saturdayDelivery: checked
                      })}
                    />
                    <Label>Saturday Delivery</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={shipmentForm.insurance}
                      onCheckedChange={(checked) => setShipmentForm({
                        ...shipmentForm,
                        insurance: checked
                      })}
                    />
                    <Label>Add Insurance</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <Button onClick={handleGetRates} className="bg-gold hover:bg-gold/90">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Get Rates & Ship
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Comparison Tab */}
        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Comparison</CardTitle>
              <CardDescription>Compare rates across multiple carriers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Use the shipment form to compare rates
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Track Tab */}
        <TabsContent value="track" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Track Shipment</CardTitle>
              <CardDescription>Enter tracking number to track your package</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Select
                  onValueChange={(value) => setSelectedCarrier(carriers.find(c => c.id === value) || null)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.filter(c => c.enabled).map(carrier => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        {carrier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Enter tracking number"
                  className="flex-1"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
                
                <Button 
                  className="bg-gold hover:bg-gold/90"
                  onClick={() => selectedCarrier && handleTrackShipment(selectedCarrier.id, trackingNumber)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Track
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Shipments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shipmentHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No shipments yet</p>
                ) : (
                  shipmentHistory.slice(0, 5).map((shipment) => (
                    <div
                      key={shipment.shipmentId}
                      className="flex justify-between items-center p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{shipment.carrier}</span>
                          <span className="text-sm text-gray-500 font-mono">{shipment.trackingNumber}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Est. Delivery: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadLabel(shipment.labelUrl)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => printLabel(shipment.labelUrl)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTrackShipment(shipment.carrier, shipment.trackingNumber)}
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Credentials Modal */}
      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure {selectedCarrier?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={credentials.apiKey || ''}
                  onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>API Secret</Label>
                <Input
                  type="password"
                  value={credentials.apiSecret || ''}
                  onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={credentials.accountNumber || ''}
                  onChange={(e) => setCredentials({ ...credentials, accountNumber: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Meter Number</Label>
                <Input
                  value={credentials.meterNumber || ''}
                  onChange={(e) => setCredentials({ ...credentials, meterNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={credentials.testMode || false}
                onCheckedChange={(checked) => setCredentials({ ...credentials, testMode: checked })}
              />
              <Label>Test Mode</Label>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Company Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={credentials.companyName || ''}
                    onChange={(e) => setCredentials({ ...credentials, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={credentials.phone || ''}
                    onChange={(e) => setCredentials({ ...credentials, phone: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={credentials.email || ''}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCredentialsModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCredentials} className="bg-gold hover:bg-gold/90">
                Save Credentials
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rates Modal */}
      <Dialog open={showRatesModal} onOpenChange={setShowRatesModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shipping Rates</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {rates.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No rates available</p>
            ) : (
              rates.map((rate, index) => {
                const logo = CARRIER_LOGOS[rate.carrier] || { icon: '🚚', color: 'bg-gray-100' };
                return (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleCreateShipment(rate)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`text-2xl p-2 rounded-lg ${logo.color}`}>
                            {logo.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{rate.carrierName}</span>
                              <Badge variant="outline">{rate.serviceName}</Badge>
                              {rate.guaranteed && (
                                <Badge className="bg-green-100 text-green-800">Guaranteed</Badge>
                              )}
                              {rate.SaturdayDelivery && (
                                <Badge className="bg-purple-100 text-purple-800">Sat Delivery</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">Transit: {rate.transitDays} days</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm ml-14">
                          <div>
                            <p className="text-gray-500">Delivery</p>
                            <p className="font-medium">{new Date(rate.estimatedDelivery).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Cutoff</p>
                            <p className="font-medium">{rate.cutoffTime || '5:00 PM'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Insurance</p>
                            <p className="font-medium">{rate.insurance?.available ? 'Available' : 'Not Available'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-gold">${rate.totalPrice}</p>
                        <p className="text-sm text-gray-500">{rate.currency}</p>
                        <Button size="sm" className="mt-2 bg-gold hover:bg-gold/90">
                          Select
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipment Confirmation Modal */}
      <Dialog open={showShipModal} onOpenChange={setShowShipModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shipment Created</DialogTitle>
          </DialogHeader>
          
          {currentShipment && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 p-6 rounded-lg text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Shipment Created Successfully!</h3>
                <p className="text-gray-600">Your shipping label is ready to print</p>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-500">Tracking Number</span>
                  <span className="font-mono font-semibold text-lg">{currentShipment.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Carrier</span>
                  <span className="font-medium">{currentShipment.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium">{currentShipment.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Delivery</span>
                  <span className="font-medium">{new Date(currentShipment.estimatedDelivery).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost</span>
                  <span className="font-bold text-gold">${currentShipment.cost} {currentShipment.currency}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="w-full bg-gold hover:bg-gold/90"
                  onClick={() => downloadLabel(currentShipment.labelUrl)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Label
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => printLabel(currentShipment.labelUrl)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowShipModal(false);
                  if (tracking) {
                    handleTrackShipment(tracking.carrier, tracking.trackingNumber);
                  }
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Track Shipment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tracking Modal */}
      <Dialog open={showTrackModal} onOpenChange={setShowTrackModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Track Shipment</DialogTitle>
          </DialogHeader>
          
          {tracking && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl p-3 rounded-lg ${CARRIER_LOGOS[tracking.carrier]?.color || 'bg-gray-100'}`}>
                    {CARRIER_LOGOS[tracking.carrier]?.icon || '🚚'}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{tracking.carrier}</p>
                    <p className="text-sm text-gray-500 font-mono">{tracking.trackingNumber}</p>
                  </div>
                </div>
                {getStatusBadge(tracking.status)}
              </div>

              <div className="space-y-4">
                {tracking.events.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${
                        index === 0 ? 'bg-gold' : 'bg-gray-300'
                      }`}></div>
                      {index < tracking.events.length - 1 && (
                        <div className="absolute top-4 left-1.5 w-0.5 h-full bg-gray-200"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{event.status.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-gray-600">{event.location}</p>
                          {event.signedBy && (
                            <p className="text-xs text-gray-500 mt-1">Signed by: {event.signedBy}</p>
                          )}
                          {event.exception && (
                            <p className="text-xs text-red-600 mt-1">{event.exception}</p>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {tracking.deliveredTo && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600">
                    Delivered to: {tracking.deliveredTo}
                    {tracking.signature && ` • Signed: ${tracking.signature}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pickup Modal */}
      <Dialog open={showPickupModal} onOpenChange={setShowPickupModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Pickup</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Carrier</Label>
              <Select
                onValueChange={(value) => setSelectedCarrier(carriers.find(c => c.id === value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  {carriers.filter(c => c.enabled).map(carrier => (
                    <SelectItem key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pickup Date</Label>
              <Input
                type="date"
                value={pickupForm.date}
                onChange={(e) => setPickupForm({ ...pickupForm, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Time</Label>
                <Input
                  type="time"
                  value={pickupForm.timeWindow.start}
                  onChange={(e) => setPickupForm({
                    ...pickupForm,
                    timeWindow: { ...pickupForm.timeWindow, start: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>To Time</Label>
                <Input
                  type="time"
                  value={pickupForm.timeWindow.end}
                  onChange={(e) => setPickupForm({
                    ...pickupForm,
                    timeWindow: { ...pickupForm.timeWindow, end: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pickup Location</Label>
              <Select
                value={pickupForm.location}
                onValueChange={(value: any) => setPickupForm({ ...pickupForm, location: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front_door">Front Door</SelectItem>
                  <SelectItem value="back_door">Back Door</SelectItem>
                  <SelectItem value="loading_dock">Loading Dock</SelectItem>
                  <SelectItem value="reception">Reception</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Instructions (Optional)</Label>
              <Input
                value={pickupForm.instructions}
                onChange={(e) => setPickupForm({ ...pickupForm, instructions: e.target.value })}
                placeholder="e.g., Call upon arrival, gate code 1234"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Packages</h4>
              {pickupForm.packages.map((pkg, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    type="number"
                    value={pkg.count}
                    onChange={(e) => {
                      const newPackages = [...pickupForm.packages];
                      newPackages[index].count = parseInt(e.target.value);
                      setPickupForm({ ...pickupForm, packages: newPackages });
                    }}
                    placeholder="Count"
                    className="w-24"
                  />
                  <Input
                    type="number"
                    value={pkg.weight}
                    onChange={(e) => {
                      const newPackages = [...pickupForm.packages];
                      newPackages[index].weight = parseFloat(e.target.value);
                      setPickupForm({ ...pickupForm, packages: newPackages });
                    }}
                    placeholder="Weight"
                    className="w-24"
                  />
                  <Select
                    value={pkg.type}
                    onValueChange={(value: any) => {
                      const newPackages = [...pickupForm.packages];
                      newPackages[index].type = value;
                      setPickupForm({ ...pickupForm, packages: newPackages });
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="envelope">Envelope</SelectItem>
                      <SelectItem value="package">Package</SelectItem>
                      <SelectItem value="pallet">Pallet</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newPackages = pickupForm.packages.filter((_, i) => i !== index);
                      setPickupForm({ ...pickupForm, packages: newPackages });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setPickupForm({
                  ...pickupForm,
                  packages: [...pickupForm.packages, { count: 1, weight: 10, type: 'package' }]
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Package
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPickupModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSchedulePickup} className="bg-gold hover:bg-gold/90">
                Schedule Pickup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipment History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shipment History</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {shipmentHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No shipments yet</p>
            ) : (
              shipmentHistory.map((shipment) => (
                <div
                  key={shipment.shipmentId}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{shipment.carrier}</span>
                        <span className="text-sm text-gray-500 font-mono">{shipment.trackingNumber}</span>
                        <Badge variant="outline">{shipment.service}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(shipment.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Est. Delivery: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-semibold text-gold mt-1">${shipment.cost}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadLabel(shipment.labelUrl)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => printLabel(shipment.labelUrl)}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTrackShipment(shipment.carrier, shipment.trackingNumber)}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
