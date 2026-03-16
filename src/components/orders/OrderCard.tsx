import { useState } from 'react';
import { Order } from '@/services/ordersService';
import { useCancelOrder, useReturnOrder, useReorder, useDownloadInvoice } from '@/hooks/useOrders';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  ShoppingBag,
  MapPin,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface OrderCardProps {
  order: Order;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  returned: RotateCcw,
};

export function OrderCard({ order }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  
  const StatusIcon = statusIcons[order.status];
  const cancelOrder = useCancelOrder();
  const returnOrder = useReturnOrder();
  const reorder = useReorder();
  const downloadInvoice = useDownloadInvoice();

  const canCancel = ['pending', 'processing'].includes(order.status);
  const canReturn = order.status === 'delivered' && !order.items.every(item => item.returned);
  const canReorder = ['delivered', 'cancelled'].includes(order.status);

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      cancelOrder.mutate({ orderId: order.id, reason: 'Cancelled by user' });
    }
  };

  const handleReorder = () => {
    reorder.mutate(order.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">
                Order #{order.orderNumber}
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${statusColors[order.status]}`}>
                <StatusIcon className="w-4 h-4" />
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold">${order.total.toFixed(2)}</div>
            <p className="text-sm text-gray-500">
              {order.items.length} item{order.items.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Payment Status */}
        <div className="flex items-center gap-2 mt-2">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            Payment: <span className={
              order.paymentStatus === 'paid' ? 'text-green-600' :
              order.paymentStatus === 'unpaid' ? 'text-red-600' :
              'text-orange-600'
            }>
              {order.paymentStatus.replace('_', ' ')}
            </span>
          </span>
        </div>
      </div>

      {/* Items Preview */}
      <div className="p-6">
        <div className="space-y-3">
          {order.items.slice(0, isExpanded ? undefined : 2).map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <Link 
                  to={`/product/${item.productId}`}
                  className="font-medium hover:text-gold transition"
                >
                  {item.name}
                </Link>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span>Qty: {item.quantity}</span>
                  {item.size && <span>Size: {item.size}</span>}
                  {item.color && <span>Color: {item.color}</span>}
                </div>
                {item.returned && (
                  <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                    Returned
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            </div>
          ))}

          {order.items.length > 2 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-gold hover:underline flex items-center gap-1 mt-2"
            >
              {isExpanded ? (
                <>Show less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Show {order.items.length - 2} more items <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>

        {/* Tracking Info */}
        {order.tracking && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gold" />
                <span className="font-medium">Tracking #{order.tracking.trackingNumber}</span>
              </div>
              <span className="text-sm text-gray-600">{order.tracking.carrier}</span>
            </div>
            
            {order.tracking.events.length > 0 && (
              <div className="text-sm">
                <p className="text-gray-700">
                  Latest: {order.tracking.events[0].description}
                </p>
                {order.tracking.estimatedDelivery && (
                  <p className="text-xs text-gray-500 mt-1">
                    Est. Delivery: {new Date(order.tracking.estimatedDelivery).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timeline Preview */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date(order.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap gap-3">
        <Link
          to={`/account/orders/${order.id}`}
          className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 transition flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          View Details
        </Link>

        {canReorder && (
          <button
            onClick={handleReorder}
            disabled={reorder.isLoading}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4" />
            Buy Again
          </button>
        )}

        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelOrder.isLoading}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center gap-2 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Cancel Order
          </button>
        )}

        {canReturn && (
          <button
            onClick={() => setShowReturnModal(true)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Return Items
          </button>
        )}

        <button
          onClick={() => downloadInvoice.mutate(order.id)}
          disabled={downloadInvoice.isLoading}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Invoice
        </button>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <ReturnModal
          order={order}
          onClose={() => setShowReturnModal(false)}
          onSubmit={(items, reason) => {
            returnOrder.mutate({ orderId: order.id, items, reason });
            setShowReturnModal(false);
          }}
        />
      )}
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
              {order.items.filter(item => !item.returned).map((item: any) => (
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
