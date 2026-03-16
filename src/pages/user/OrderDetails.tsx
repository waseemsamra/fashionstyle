import { useParams, useNavigate } from 'react-router-dom';
import { useOrder, useTrackOrder, useCancelOrder, useDownloadInvoice } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Download,
  RotateCcw,
  MapPin,
  CreditCard,
  AlertCircle,
  Printer
} from 'lucide-react';
import { useState } from 'react';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showReturnModal, setShowReturnModal] = useState(false);

  const { data: order, isLoading } = useOrder(id!);
  const { data: tracking } = useTrackOrder(id!);
  const cancelOrder = useCancelOrder();
  const downloadInvoice = useDownloadInvoice();

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order not found</h2>
          <Button onClick={() => navigate('/account/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const canCancel = ['pending', 'processing'].includes(order.status);
  const canReturn = order.status === 'delivered';

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/account/orders')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
              <p className="text-gray-600 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>

              <Button
                onClick={() => downloadInvoice.mutate(order.id)}
                disabled={downloadInvoice.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Invoice
              </Button>

              {canCancel && (
                <Button
                  onClick={() => cancelOrder.mutate({ orderId: order.id, reason: 'Cancelled by user' })}
                  disabled={cancelOrder.isPending}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </Button>
              )}

              {canReturn && (
                <Button
                  onClick={() => setShowReturnModal(true)}
                  className="bg-gold hover:bg-gold/90 text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Return Items
                </Button>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusBox
              icon={Package}
              label="Order Status"
              value={order.status}
              color={
                order.status === 'delivered' ? 'green' :
                order.status === 'cancelled' ? 'red' :
                order.status === 'shipped' ? 'purple' :
                'yellow'
              }
            />
            <StatusBox
              icon={CreditCard}
              label="Payment"
              value={order.paymentStatus}
              color={order.paymentStatus === 'paid' ? 'green' : 'yellow'}
            />
            <StatusBox
              icon={Truck}
              label="Shipping"
              value={tracking?.status || 'Pending'}
              color="blue"
            />
          </div>
        </div>

        {/* Tracking Map (if shipped) */}
        {order.status === 'shipped' && tracking && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Track Your Package</h2>
            <TrackingMap tracking={tracking} />
          </div>
        )}

        {/* Order Timeline */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-6">Order Timeline</h2>
          <OrderTimeline timeline={order.timeline} />
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-6">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>Qty: {item.quantity}</span>
                    {item.size && <span>Size: {item.size}</span>}
                    {item.color && <span>Color: {item.color}</span>}
                  </div>
                  {item.returned && (
                    <span className="inline-block mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      Returned
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                  <div className="text-sm text-gray-500">${item.price.toFixed(2)} each</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>${order.shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-3 border-t">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Billing Addresses */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gold" />
              <h3 className="font-semibold">Shipping Address</h3>
            </div>
            <div className="text-gray-600">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p className="mt-2">📞 {order.shippingAddress.phone}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-gold" />
              <h3 className="font-semibold">Billing Address</h3>
            </div>
            <div className="text-gray-600">
              <p className="font-medium">{order.billingAddress.name}</p>
              <p>{order.billingAddress.line1}</p>
              {order.billingAddress.line2 && <p>{order.billingAddress.line2}</p>}
              <p>
                {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}
              </p>
              <p>{order.billingAddress.country}</p>
              <p className="mt-2">📞 {order.billingAddress.phone}</p>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Payment Method: {order.paymentMethod}
            </p>
          </div>
        </div>

        {/* Return Modal */}
        {showReturnModal && (
          <ReturnModal
            order={order}
            onClose={() => setShowReturnModal(false)}
            onSubmit={(_items: string[], _reason: string) => {
              // Handle return
              setShowReturnModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Status Box Component
function StatusBox({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    blue: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-full ${colors[color] || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="font-semibold capitalize">{value.replace('_', ' ')}</div>
      </div>
    </div>
  );
}

// Order Timeline Component
function OrderTimeline({ timeline }: { timeline: any[] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {timeline.map((event, index) => (
          <div key={index} className="relative flex gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
              index === 0 ? 'bg-gold text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {index === 0 ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{event.status}</h4>
                {event.actor && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize">
                    {event.actor}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(event.date).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tracking Map Component (placeholder)
function TrackingMap({ tracking }: { tracking: any }) {
  return (
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center text-gray-500">
        <Truck className="w-12 h-12 mx-auto mb-2" />
        <p>Map integration would go here</p>
        <p className="text-sm">Tracking: {tracking.trackingNumber}</p>
      </div>
    </div>
  );
}

// Return Modal Component
function ReturnModal({ order, onClose, onSubmit }: any) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Please select at least one item to return');
      return;
    }
    if (!reason) {
      alert('Please provide a reason for return');
      return;
    }
    onSubmit(selectedItems, reason);
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <h2 className="text-2xl font-bold">Return Items</h2>
          <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Items to Return</label>
            <div className="space-y-2">
              {order.items.filter((item: any) => !item.returned).map((item: any) => (
                <label key={item.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 text-gold"
                  />
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      ${item.price} × {item.quantity}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Return Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Select a reason</option>
              <option value="defective">Defective or damaged</option>
              <option value="wrong">Wrong item received</option>
              <option value="size">Size doesn't fit</option>
              <option value="color">Color not as expected</option>
              <option value="quality">Quality issues</option>
              <option value="changed">Changed my mind</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gold text-white py-2 rounded-lg hover:bg-gold/90 transition"
            >
              Submit Return Request
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Skeleton Component
function OrderDetailSkeleton() {
  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-48" />
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-96" />
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
