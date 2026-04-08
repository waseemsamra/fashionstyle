import { useState } from 'react';
import { Package, TrendingDown, TrendingUp, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { orderManagementApi, type Order } from '@/services/orderManagement';

interface InventoryManagerProps {
  order: Order;
  onStatusUpdate?: () => void;
}

export default function InventoryManager({ order, onStatusUpdate }: InventoryManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleReserveStock = async () => {
    setIsUpdating(true);
    try {
      await orderManagementApi.updateOrderStatus(order.orderId || order.id, 'confirmed', 'Stock reserved');
      toast.success(`✅ Stock reserved for ${order.items.length} item(s)`);
      onStatusUpdate?.();
    } catch (error: any) {
      toast.error(`Failed to reserve stock: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReleaseStock = async () => {
    if (!confirm('Release reserved stock back to inventory?')) return;

    setIsUpdating(true);
    try {
      await orderManagementApi.updateOrderStatus(order.orderId || order.id, 'cancelled', 'Stock released');
      toast.success('Stock released back to inventory');
      onStatusUpdate?.();
    } catch (error: any) {
      toast.error(`Failed to release stock: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate total items
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-lg">Inventory Management</h3>
        </div>
        {order.inventoryReserved && (
          <Badge className="bg-blue-100 text-blue-800">
            <Check className="w-3 h-3 mr-1" />
            Reserved
          </Badge>
        )}
        {order.inventoryDeducted && (
          <Badge className="bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Deducted
          </Badge>
        )}
      </div>

      {/* Order Items */}
      <div className="space-y-3 mb-4">
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.brand && `${item.brand} • `}Qty: {item.quantity}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
              <p className="text-xs text-gray-500">${item.price} each</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
          <p className="text-xs text-blue-700">Total Items</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-purple-600">{order.items.length}</p>
          <p className="text-xs text-purple-700">Products</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">${order.total.toFixed(2)}</p>
          <p className="text-xs text-green-700">Total Value</p>
        </div>
      </div>

      {/* Inventory Status */}
      <div className={`p-4 rounded-lg mb-4 ${
        order.inventoryDeducted
          ? 'bg-green-50 border border-green-200'
          : order.inventoryReserved
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {order.inventoryDeducted ? (
            <>
              <TrendingDown className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-green-700">Stock Deducted</span>
            </>
          ) : order.inventoryReserved ? (
            <>
              <Package className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-700">Stock Reserved</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="font-semibold text-yellow-700">Stock Not Reserved</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-600">
          {order.inventoryDeducted
            ? 'Stock has been permanently deducted from inventory'
            : order.inventoryReserved
            ? 'Stock is reserved and unavailable for other orders'
            : 'Stock needs to be reserved when order is confirmed'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Reserve Stock */}
        {order.status === 'confirmed' && !order.inventoryReserved && (
          <Button
            onClick={handleReserveStock}
            disabled={isUpdating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            Reserve Stock
          </Button>
        )}

        {/* Release Stock */}
        {order.inventoryReserved && !order.inventoryDeducted && order.status === 'cancelled' && (
          <Button
            onClick={handleReleaseStock}
            disabled={isUpdating}
            variant="outline"
            className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Release Stock
          </Button>
        )}
      </div>
    </div>
  );
}

// Low Stock Alert Component
export function LowStockAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    orderManagementApi.getLowStockAlerts(10)
      .then(data => setAlerts(data.products || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (alerts.length === 0) return null;

  return (
    <div className="bg-white border border-red-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="font-bold text-lg text-red-700">Low Stock Alerts</h3>
        <Badge className="bg-red-100 text-red-800 ml-auto">
          {alerts.length} products
        </Badge>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.map((product, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">{product.name}</p>
              <p className="text-xs text-gray-600">{product.brand}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-red-600">{product.stock}</p>
              <p className="text-xs text-gray-500">left in stock</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
