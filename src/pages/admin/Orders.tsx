import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';
import { Package, Search, DollarSign, CheckCircle, Clock, Truck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/components/admin/AdminLayout';

interface Order {
  orderId: string;
  date: string;
  items: any[];
  totalPrice: number;
  paymentMethod: string;
  status: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  itemCount: number;
  userId?: string;
}

export default function AdminOrders() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllOrders();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      await getCurrentUser();
      setIsAuthenticated(true);
      // Check if admin (you can add admin check here)
    } catch {
      navigate('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllOrders = async () => {
    try {
      // Get list of all users first (you might need to create this endpoint)
      // For now, we'll use a sample approach
      // In production, you'd query DynamoDB for all orders across all users
      
      // Sample: Query orders from multiple test users
      const testUserIds = [
        '04f8a4f8-d031-7033-8bbe-c171ac0ff8f1',
        // Add more user IDs as needed
      ];

      const allUserOrders: Order[] = [];
      
      for (const userId of testUserIds) {
        try {
          const response = await fetch(
            `https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod/users/${userId}/orders`
          );
          const data = await response.json();
          
          if (data.orders && Array.isArray(data.orders)) {
            const ordersWithUserId = data.orders.map((order: Order) => ({
              ...order,
              userId
            }));
            allUserOrders.push(...ordersWithUserId);
          }
        } catch (error) {
          console.error(`Failed to load orders for user ${userId}:`, error);
        }
      }

      setAllOrders(allUserOrders);
      setOrders(allUserOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterOrders(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterOrders(searchTerm, status);
  };

  const filterOrders = (search: string, status: string) => {
    let filtered = allOrders;

    // Search filter
    if (search) {
      filtered = filtered.filter(order =>
        order.orderId.toLowerCase().includes(search.toLowerCase()) ||
        order.email.toLowerCase().includes(search.toLowerCase()) ||
        order.fullName.toLowerCase().includes(search.toLowerCase()) ||
        order.city.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (status && status !== 'all') {
      filtered = filtered.filter(order =>
        order.status.toLowerCase() === status.toLowerCase()
      );
    }

    setOrders(filtered);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Shipped':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'Delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const totalOrdersCount = orders.length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Orders</h1>
          <p className="text-gray-600">View and manage orders from all users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrdersCount}</p>
              </div>
              <Package className="w-8 h-8 text-gold" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Processing</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'Processing').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Delivered</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'Delivered').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by order ID, email, name, or city..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="all">All Statuses</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setOrders(allOrders);
                }}
                variant="outline"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No orders found</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.orderId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.fullName}</div>
                        <div className="text-sm text-gray-500">{order.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(order.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.date).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.itemCount} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${order.totalPrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handleViewOrder(order)}
                          variant="outline"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <Button onClick={() => setShowModal(false)} variant="ghost" size="sm">
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order ID</p>
                  <p className="font-semibold">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Date</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Customer Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-medium">{selectedOrder.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-medium">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-medium">{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">User ID</p>
                    <p className="font-medium text-xs">{selectedOrder.userId}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Shipping Address</h3>
                <div className="text-gray-700">
                  <p>{selectedOrder.address}</p>
                  <p>{selectedOrder.city}, {selectedOrder.postalCode}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 border rounded-lg p-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-24 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        {item.selectedSize && (
                          <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>
                        )}
                        {item.selectedColor && (
                          <p className="text-sm text-gray-500">Color: {item.selectedColor}</p>
                        )}
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-gold">${selectedOrder.totalPrice.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Payment Method: {selectedOrder.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
