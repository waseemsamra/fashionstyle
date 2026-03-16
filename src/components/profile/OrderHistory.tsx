import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders, useDownloadInvoice } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Download, Eye, Package, CheckCircle, XCircle, Clock, Truck } from 'lucide-react';

export function OrderHistory() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useOrders({
    status: statusFilter === 'all' ? undefined : statusFilter
  });
  const downloadInvoice = useDownloadInvoice();

  const orders = data?.pages.flatMap(page => page.orders) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'processing':
        return <Package className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
          <Link to="/shop">
            <Button className="bg-gold hover:bg-gold/90">
              Start Shopping
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order History</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{order.status.toUpperCase()}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-bold text-lg">${order.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Items</p>
                  <p className="font-medium">{order.items.length} items</p>
                </div>
                {order.trackingNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Tracking</p>
                    <p className="font-medium">{order.trackingNumber}</p>
                  </div>
                )}
              </div>

              {/* Order Items Preview */}
              <div className="border-t pt-4 mb-4">
                <div className="flex gap-4 overflow-x-auto">
                  {order.items.slice(0, 4).map((item: any) => (
                    <div key={item.id} className="flex-shrink-0 w-24">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg mb-2"
                      />
                      <p className="text-xs text-gray-600 line-clamp-2">{item.name}</p>
                      <p className="text-xs font-medium">${item.price}</p>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="flex-shrink-0 w-24 flex items-center justify-center bg-gray-100 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">
                        +{order.items.length - 4} more
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link to={`/orders/${order.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </Link>
                {order.status === 'delivered' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadInvoice.mutate(order.id)}
                    disabled={downloadInvoice.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Invoice
                  </Button>
                )}
                {order.status === 'delivered' && (
                  <Button variant="outline" size="sm">
                    Write Review
                  </Button>
                )}
                {(order.status === 'pending' || order.status === 'processing') && (
                  <Button variant="outline" size="sm" className="text-red-600">
                    Cancel Order
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More Orders'}
          </Button>
        </div>
      )}
    </div>
  );
}
