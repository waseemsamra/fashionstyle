import { useState, useEffect } from 'react';
import { Bell, Mail, Phone, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import notificationService, { type NotificationPreferences, type Notification } from '@/services/notificationService';

interface NotificationPreferencesProps {
  customerId: string;
}

export default function NotificationPreferencesComponent({ customerId }: NotificationPreferencesProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [history, setHistory] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('preferences');

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [preferences, notificationHistory] = await Promise.all([
        notificationService.getPreferences(customerId),
        notificationService.getNotificationHistory(customerId, 20)
      ]);
      
      setPrefs(preferences);
      setHistory(notificationHistory);
    } catch (error) {
      console.error('Error loading notification data:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!prefs) return;
    
    setSaving(true);
    try {
      await notificationService.updatePreferences(customerId, prefs);
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to receive delivery updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-6 pt-4">
            {prefs && (
              <>
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Notification Channels</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <Label>Email Notifications</Label>
                      </div>
                      <Switch
                        checked={prefs.email}
                        onCheckedChange={(checked) => setPrefs({ ...prefs, email: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <Label>SMS Notifications</Label>
                      </div>
                      <Switch
                        checked={prefs.sms}
                        onCheckedChange={(checked) => setPrefs({ ...prefs, sms: checked })}
                      />
                    </div>

                    {prefs.sms && (
                      <div className="pl-6 space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          value={prefs.phoneNumber || ''}
                          onChange={(e) => setPrefs({ ...prefs, phoneNumber: e.target.value })}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Notification Types</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Order Confirmed</Label>
                      <Switch
                        checked={prefs.orderConfirmed}
                        onCheckedChange={(checked) => setPrefs({ ...prefs, orderConfirmed: checked })}
                        disabled={!prefs.email && !prefs.sms}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Order Shipped</Label>
                      <Switch
                        checked={prefs.orderShipped}
                        onCheckedChange={(checked) => setPrefs({ ...prefs, orderShipped: checked })}
                        disabled={!prefs.email && !prefs.sms}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Out for Delivery</Label>
                      <Switch
                        checked={prefs.outForDelivery}
                        onCheckedChange={(checked) => setPrefs({ ...prefs, outForDelivery: checked })}
                        disabled={!prefs.email && !prefs.sms}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Delivered</Label>
                      <Switch
                        checked={prefs.delivered}
                        onCheckedChange={(checked) => setPrefs({ ...prefs, delivered: checked })}
                        disabled={!prefs.email && !prefs.sms}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Delivery Exceptions</Label>
                      <Switch
                        checked={prefs.exceptions}
                        onCheckedChange={(checked) => setPrefs({ ...prefs, exceptions: checked })}
                        disabled={!prefs.email && !prefs.sms}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Delivery Reminders</Label>
                      <Switch
                        checked={prefs.reminders}
                        onCheckedChange={(checked) => setPrefs({ ...prefs, reminders: checked })}
                        disabled={!prefs.email && !prefs.sms}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gold hover:bg-gold/90"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="pt-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications sent yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((notification) => (
                  <div
                    key={notification.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {notification.channel === 'email' ? (
                          <Mail className="w-4 h-4 mt-1" />
                        ) : (
                          <Phone className="w-4 h-4 mt-1" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              Order #{notification.orderId}
                            </span>
                            <Badge
                              variant={notification.status === 'sent' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {notification.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.type.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                          {notification.error && (
                            <p className="text-xs text-red-600 mt-1">{notification.error}</p>
                          )}
                        </div>
                      </div>
                      {getStatusIcon(notification.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
