import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';
import { Package, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/components/admin/AdminLayout';
import OrderRow from '@/components/admin/OrderRow';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface Order {
  orderId: string;
  date: string;
  items: any[];
  totalPrice: number;
  total?: number;
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    } catch {
      navigate('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllOrders = async () => {
    setIsRefreshing(true);
    try {
      console.log('📋 Admin Orders: Fetching all orders...');
      
      // Use the admin orders API endpoint
      const response = await api.getAllOrders();
      console.log('📋 Admin Orders: Response:', response);
      
      if (response && response.orders) {
        const ordersList = response.orders.map((order: Order) => ({
          ...order,
          total: order.totalPrice || order.total || 0
        }));
        
        setOrders(ordersList);
        setAllOrders(ordersList);
        console.log(`📋 Admin Orders: Loaded ${ordersList.length} orders`);
      } else {
        setOrders([]);
        setAllOrders([]);
        console.log('📋 Admin Orders: No orders found');
      }
    } catch (err: any) {
      console.error('❌ Admin Orders: Failed to load orders:', err);
      toast.error('Failed to load orders');
      setOrders([]);
      setAllOrders([]);
    } finally {
      setIsRefreshing(false);
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

    if (search) {
      filtered = filtered.filter(order =>
        order.orderId.toLowerCase().includes(search.toLowerCase()) ||
        order.email.toLowerCase().includes(search.toLowerCase()) ||
        order.fullName.toLowerCase().includes(search.toLowerCase()) ||
        order.city.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(order =>
        order.status.toLowerCase() === status.toLowerCase()
      );
    }

    setOrders(filtered);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    console.log('🔄 Updating order status:', orderId, '→', newStatus);
    
    try {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.orderId === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      setAllOrders(prevOrders =>
        prevOrders.map(order =>
          order.orderId === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      toast.success(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">All Orders</h1>
              <p className="text-gray-600">View and manage orders from all users</p>
            </div>
            <Button
              onClick={loadAllOrders}
              disabled={isRefreshing}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
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
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Processing</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'processing').length}
                </p>
              </div>
              <Package className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Delivered</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
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
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="ready-to-pickup">Ready to Pickup</option>
                <option value="on-delivery">On Delivery</option>
                <option value="delivered">Delivered</option>
              </select>
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No orders found</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <OrderRow
                      key={order.orderId}
                      order={{
                        orderId: order.orderId,
                        date: order.date,
                        status: order.status || 'pending',
                        total: order.totalPrice || order.total || 0,
                        items: order.items || [],
                        customer: {
                          fullName: order.fullName,
                          email: order.email
                        }
                      }}
                      onStatusChange={handleStatusChange}
                      showActions={true}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
