import { useState, useEffect } from 'react';
import {
  Clock,
  Settings,
  Plus,
  Edit,
  Trash2,
  Ban,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import timeSlotService, { type TimeSlot, type TimeSlotConfig, type SlotAnalytics } from '@/services/timeSlotService';

const COLORS = ['#D4AF37', '#2D3748', '#718096', '#F56565', '#48BB78', '#4299E1'];

export default function TimeSlotManagement() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const [config, setConfig] = useState<TimeSlotConfig | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [analytics, setAnalytics] = useState<SlotAnalytics | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedZone, setSelectedZone] = useState('all');

  // Modal states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [configForm, setConfigForm] = useState<TimeSlotConfig | null>(null);
  const [slotForm, setSlotForm] = useState<Partial<TimeSlot>>({
    startTime: '09:00',
    endTime: '17:00',
    zone: 'default',
    tier: 'standard',
    maxCapacity: 10,
    price: 0
  });
  const [blockForm, setBlockForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedZone]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configData, slotsData, analyticsData] = await Promise.all([
        timeSlotService.getConfig(),
        timeSlotService.getSlots({ 
          date: selectedDate, 
          zone: selectedZone !== 'all' ? selectedZone : undefined 
        }),
        timeSlotService.getAnalytics({ 
          startDate: getStartDate(), 
          endDate: new Date().toISOString().split('T')[0] 
        })
      ]);

      setConfig(configData);
      setSlots(slotsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading time slot data:', error);
      toast.error('Failed to load time slot data');
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  const handleSaveConfig = async () => {
    if (!configForm) return;
    
    try {
      await timeSlotService.updateConfig(configForm);
      setConfig(configForm);
      setShowConfigModal(false);
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    }
  };

  const handleSaveSlot = async () => {
    try {
      if (editingSlot) {
        const updated = await timeSlotService.updateSlot(editingSlot.id, slotForm);
        setSlots(slots.map(s => s.id === editingSlot.id ? updated : s));
        toast.success('Slot updated successfully');
      } else {
        const newSlot = await timeSlotService.createSlot({
          ...slotForm as any,
          slotDate: selectedDate
        });
        setSlots([...slots, newSlot]);
        toast.success('Slot created successfully');
      }
      setShowSlotModal(false);
    } catch (error) {
      console.error('Error saving slot:', error);
      toast.error('Failed to save slot');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this time slot?')) return;
    
    try {
      await timeSlotService.deleteSlot(slotId);
      setSlots(slots.filter(s => s.id !== slotId));
      toast.success('Slot deleted successfully');
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Failed to delete slot');
    }
  };

  const handleBlockSlots = async () => {
    try {
      const result = await timeSlotService.blockSlots({
        date: selectedDate,
        ...blockForm,
        zone: selectedZone !== 'all' ? selectedZone : 'default'
      });
      toast.success(result.message);
      setShowBlockModal(false);
      loadData();
    } catch (error) {
      console.error('Error blocking slots:', error);
      toast.error('Failed to block slots');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      available: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      limited: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      full: { color: 'bg-red-100 text-red-800', icon: Ban },
      blocked: { color: 'bg-gray-100 text-gray-800', icon: Ban }
    };
    
    const variant = variants[status] || variants.available;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="w-8 h-8" />
            Time Slot Scheduling
          </h1>
          <p className="text-gray-600 mt-1">Manage delivery time slots and availability</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowConfigModal(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </Button>
          <Button variant="outline" onClick={() => setShowBlockModal(true)}>
            <Ban className="w-4 h-4 mr-2" />
            Block Slots
          </Button>
          <Button className="bg-gold hover:bg-gold/90" onClick={() => setShowSlotModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Slot
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Zone</Label>
              <select
                className="w-full p-2 border rounded-lg"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                <option value="all">All Zones</option>
                <option value="default">Default</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={loadData} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Slots for {selectedDate}</CardTitle>
              <CardDescription>
                {slots.length} slots available • {config?.enabled ? 'Scheduling enabled' : 'Scheduling disabled'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slots.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No time slots configured for this date</p>
                  <Button 
                    onClick={() => setShowSlotModal(true)} 
                    variant="outline" 
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Time Slot
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[80px]">
                              <div className="text-lg font-semibold">{slot.startTime}</div>
                              <div className="text-sm text-gray-500">to</div>
                              <div className="text-lg font-semibold">{slot.endTime}</div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{slot.zone}</Badge>
                                <Badge variant="outline" className="bg-gold/10">
                                  {slot.tier}
                                </Badge>
                                {getStatusBadge(slot.status)}
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Capacity</p>
                                  <p className="font-medium">
                                    {slot.bookedCount} / {slot.maxCapacity}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Available</p>
                                  <p className="font-medium">{slot.availableCount}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Price</p>
                                  <p className="font-medium text-gold">
                                    {slot.price === 0 ? 'FREE' : `$${slot.price}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSlot(slot);
                              setSlotForm(slot);
                              setShowSlotModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDeleteSlot(slot.id)}
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Total Slots</p>
                    <p className="text-2xl font-bold">{analytics.summary.totalSlots}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Booked Slots</p>
                    <p className="text-2xl font-bold">{analytics.summary.bookedSlots}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Utilization</p>
                    <p className="text-2xl font-bold">{analytics.summary.utilization}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="text-2xl font-bold">${analytics.summary.totalRevenue}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Bookings by Tier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(analytics.byTier).map(([tier, data]) => ({
                              name: tier,
                              value: data.booked
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            dataKey="value"
                          >
                            {Object.entries(analytics.byTier).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Tier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(analytics.byTier).map(([name, data]) => ({
                              name,
                              value: data.revenue
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            dataKey="value"
                          >
                            {Object.entries(analytics.byTier).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Bookings by Hour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(analytics.byHour).map(([hour, data]) => ({
                            hour: `${hour}:00`,
                            booked: data.booked,
                            total: data.total
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="booked" name="Booked" fill="#D4AF37" />
                          <Bar dataKey="total" name="Total Slots" fill="#718096" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Config Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Time Slot Configuration</DialogTitle>
          </DialogHeader>
          
          {config && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfigForm({ ...config, enabled: checked })}
                />
                <Label>Enable Time Slot Scheduling</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Advance Booking (days)</Label>
                  <Input
                    type="number"
                    value={config.advanceBookingDays}
                    onChange={(e) => setConfigForm({
                      ...config,
                      advanceBookingDays: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slot Duration (hours)</Label>
                  <Input
                    type="number"
                    value={config.slotDuration}
                    onChange={(e) => setConfigForm({
                      ...config,
                      slotDuration: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Slots Per Day</Label>
                  <Input
                    type="number"
                    value={config.maxSlotsPerDay}
                    onChange={(e) => setConfigForm({
                      ...config,
                      maxSlotsPerDay: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Buffer Time (minutes)</Label>
                  <Input
                    type="number"
                    value={config.bufferTime}
                    onChange={(e) => setConfigForm({
                      ...config,
                      bufferTime: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Pricing Tiers</h3>
                {Object.entries(config.pricingTiers).map(([tier, data]) => (
                  <div key={tier} className="border p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Switch
                        checked={data.enabled}
                        onCheckedChange={(checked) => setConfigForm({
                          ...config,
                          pricingTiers: {
                            ...config.pricingTiers,
                            [tier]: { ...data, enabled: checked }
                          }
                        })}
                      />
                      <Label className="capitalize">{tier}</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        type="number"
                        value={data.price}
                        onChange={(e) => setConfigForm({
                          ...config,
                          pricingTiers: {
                            ...config.pricingTiers,
                            [tier]: { ...data, price: parseFloat(e.target.value) }
                          }
                        })}
                        placeholder="Price"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveConfig} className="bg-gold hover:bg-gold/90">
                  Save Configuration
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Slot Modal */}
      <Dialog open={showSlotModal} onOpenChange={setShowSlotModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Zone</Label>
              <Input
                value={slotForm.zone}
                onChange={(e) => setSlotForm({ ...slotForm, zone: e.target.value })}
                placeholder="default"
              />
            </div>

            <div className="space-y-2">
              <Label>Tier</Label>
              <select
                className="w-full p-2 border rounded-lg"
                value={slotForm.tier}
                onChange={(e) => setSlotForm({ ...slotForm, tier: e.target.value })}
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="express">Express</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Capacity</Label>
                <Input
                  type="number"
                  value={slotForm.maxCapacity}
                  onChange={(e) => setSlotForm({ ...slotForm, maxCapacity: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={slotForm.price}
                  onChange={(e) => setSlotForm({ ...slotForm, price: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowSlotModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSlot} className="bg-gold hover:bg-gold/90">
                {editingSlot ? 'Update' : 'Create'} Slot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Slots Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Time Slots</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={blockForm.startTime}
                  onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={blockForm.endTime}
                  onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                placeholder="e.g., Holiday, Maintenance"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowBlockModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleBlockSlots} className="bg-gold hover:bg-gold/90">
                Block Slots
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
