import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface OrderItem {
  id?: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  orderId: string;
  date: string;
  status: string;
  total: number;
  items: OrderItem[];
  customer: {
    fullName: string;
    email: string;
  };
}

interface OrderRowProps {
  order: Order;
  onStatusChange?: (orderId: string, status: string) => void;
  showActions?: boolean;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Package },
  'ready-to-pickup': { label: 'Ready to Pickup', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  'on-delivery': { label: 'On Delivery', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export default function OrderRow({ order, onStatusChange, showActions = false }: OrderRowProps) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await onStatusChange?.(order.orderId, newStatus);
      setShowDetails(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <tr className="border-b hover:bg-beige-50">
        <td className="p-4">
          <div className="font-medium">{order.orderId}</div>
          <div className="text-sm text-gray-500">{formatDate(order.date)}</div>
        </td>
        <td className="p-4">
          <div className="font-medium">{order.customer?.fullName || 'N/A'}</div>
          <div className="text-sm text-gray-500">{order.customer?.email || ''}</div>
        </td>
        <td className="p-4">
          <StatusBadge status={order.status} />
        </td>
        <td className="p-4">
          <div className="font-medium">${order.total?.toFixed(2) || '0.00'}</div>
          <div className="text-sm text-gray-500">{order.items?.length || 0} items</div>
        </td>
        <td className="p-4">
          <div className="flex gap-2">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Order Details - {order.orderId}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="font-medium">{formatDate(order.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{order.customer?.fullName || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{order.customer?.email || ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-medium text-lg">${order.total?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Order Items</h3>
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-beige-50 rounded">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Update Actions (Admin Only) */}
                  {showActions && onStatusChange && (
                    <div>
                      <h3 className="font-semibold mb-3">Update Status</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(statusConfig).map(([key, config]) => {
                          const Icon = config.icon;
                          const isCurrentStatus = order.status === key;
                          
                          return (
                            <Button
                              key={key}
                              variant={isCurrentStatus ? 'default' : 'outline'}
                              className={`justify-start gap-2 ${isCurrentStatus ? 'bg-gold hover:bg-gold/90' : ''}`}
                              onClick={() => handleStatusChange(key)}
                              disabled={isUpdating || isCurrentStatus}
                            >
                              <Icon className="w-4 h-4" />
                              {config.label}
                              {isCurrentStatus && ' ✓'}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/admin/orders/${order.orderId}`)}
                    >
                      View Full Details
                    </Button>
                    <Button
                      variant="default"
                      className="bg-gold hover:bg-gold/90"
                      onClick={() => {
                        navigator.clipboard.writeText(order.orderId);
                        alert('Order ID copied!');
                      }}
                    >
                      Copy Order ID
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {showActions && onStatusChange && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('processing')}
                  disabled={order.status === 'processing' || isUpdating}
                >
                  <Package className="w-4 h-4" />
                  Process
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('on-delivery')}
                  disabled={order.status === 'on-delivery' || isUpdating}
                >
                  <Truck className="w-4 h-4" />
                  Ship
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('delivered')}
                  disabled={order.status === 'delivered' || isUpdating}
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}
