import { useState, useEffect } from 'react';
import { Package, CheckCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import notificationService from '@/services/notificationService';

interface OrderTrackingProps {
  orderId: string;
  customerId: string;
  status: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
}

export default function OrderTracking({
  orderId,
  customerId,
  status,
  estimatedDelivery,
  trackingNumber,
  carrier,
  trackingUrl
}: OrderTrackingProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [orderId]);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getOrderNotifications(orderId);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleRequestNotification = async (type: string) => {
    setLoading(true);
    try {
      await notificationService.sendNotification({
        type,
        orderId,
        customerId
      });
      toast.success('Notification sent');
      loadNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (orderStatus: string) => {
    switch (orderStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'exception':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const steps = [
    { status: 'pending', label: 'Order Placed' },
    { status: 'processing', label: 'Processing' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'delivered', label: 'Delivered' }
  ];

  const currentStepIndex = steps.findIndex(step => step.status === status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Tracking
          </div>
          <Badge className={getStatusColor(status)}>
            {status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="relative">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.status} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex
                      ? 'bg-gold text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs mt-1 text-gray-600">{step.label}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
            <div
              className="h-full bg-gold transition-all duration-500"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Tracking Details */}
        {trackingNumber && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Carrier:</span>
              <span className="font-medium">{carrier || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tracking Number:</span>
              <span className="font-medium">{trackingNumber}</span>
            </div>
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline text-sm block text-right"
              >
                Track Package →
              </a>
            )}
          </div>
        )}

        {/* Estimated Delivery */}
        {estimatedDelivery && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">Estimated Delivery</p>
            <p className="font-semibold text-gold">{estimatedDelivery}</p>
          </div>
        )}

        {/* Notification History */}
        {notifications.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </h4>
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div key={notif.id} className="text-sm flex items-center gap-2">
                  {notif.channel === 'email' ? '📧' : '📱'}
                  <span className="text-gray-600">
                    {notif.type.replace(/_/g, ' ')} - {new Date(notif.timestamp).toLocaleString()}
                  </span>
                  {notif.status === 'sent' && (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Notification Buttons (for development/testing) */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Send Test Notification</h4>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRequestNotification('order_shipped')}
              disabled={loading}
            >
              Shipped
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRequestNotification('out_for_delivery')}
              disabled={loading}
            >
              Out for Delivery
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRequestNotification('delivered')}
              disabled={loading}
            >
              Delivered
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
