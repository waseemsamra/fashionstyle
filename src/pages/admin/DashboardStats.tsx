import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Box,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck
} from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function DashboardStats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    lowStockProducts: 0,
    averageOrderValue: 0,
    conversionRate: 0
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // Load orders
      const ordersResponse: any = await api.getAllOrders();
      const orders = ordersResponse.orders || [];
      
      // Calculate order statistics
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
      const processingOrders = orders.filter((o: any) => o.status === 'processing').length;
      const shippedOrders = orders.filter((o: any) => o.status === 'shipped' || o.status === 'on-delivery').length;
      const deliveredOrders = orders.filter((o: any) => o.status === 'delivered').length;
      const cancelledOrders = orders.filter((o: any) => o.status === 'cancelled').length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Load users
      const usersResponse: any = await api.getUsers();
      const totalCustomers = usersResponse.length || 0;

      // Load products (from localStorage or API)
      const savedProducts = localStorage.getItem('admin_products');
      const products = savedProducts ? JSON.parse(savedProducts) : [];
      const totalProducts = products.length;
      const lowStockProducts = products.filter((p: any) => (p.stock || 0) < 10).length;

      setStats({
        totalOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        lowStockProducts,
        averageOrderValue,
        conversionRate: 0 // Would need analytics data
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle }: any) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            <span>{trendValue}% from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const OrderStatusCard = ({ title, count, icon: Icon, color, bgColor }: any) => (
    <Card className={`hover:shadow-md transition-shadow duration-200 ${bgColor}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-1">{count}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Track your store performance</p>
        </div>
        <button
          onClick={loadDashboardStats}
          className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90"
        >
          Refresh Data
        </button>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          trend="up"
          trendValue={12.5}
          color="text-green-600"
          subtitle="All time revenue"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          trend="up"
          trendValue={8.2}
          color="text-blue-600"
          subtitle="All time orders"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          trend="up"
          trendValue={15.3}
          color="text-purple-600"
          subtitle="Registered users"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="text-orange-600"
          subtitle={`${stats.lowStockProducts} low stock`}
        />
      </div>

      {/* Order Statistics */}
      <div>
        <h2 className="text-xl font-bold mb-4">Order Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <OrderStatusCard
            title="Pending"
            count={stats.pendingOrders}
            icon={Clock}
            color="bg-yellow-500"
            bgColor="bg-yellow-50"
          />
          <OrderStatusCard
            title="Processing"
            count={stats.processingOrders}
            icon={Box}
            color="bg-blue-500"
            bgColor="bg-blue-50"
          />
          <OrderStatusCard
            title="Shipped"
            count={stats.shippedOrders}
            icon={Truck}
            color="bg-indigo-500"
            bgColor="bg-indigo-50"
          />
          <OrderStatusCard
            title="Delivered"
            count={stats.deliveredOrders}
            icon={CheckCircle}
            color="bg-green-500"
            bgColor="bg-green-50"
          />
          <OrderStatusCard
            title="Cancelled"
            count={stats.cancelledOrders}
            icon={AlertCircle}
            color="bg-red-500"
            bgColor="bg-red-50"
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
            <p className="text-blue-100 mt-2">Per order average</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-green-100 mt-2">Visitors to customers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.lowStockProducts}</div>
            <p className="text-purple-100 mt-2">Products need restock</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/orders')}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">View Orders</p>
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium">Manage Users</p>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard?tab=products')}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Package className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <p className="text-sm font-medium">Add Product</p>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Tag className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Settings</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
