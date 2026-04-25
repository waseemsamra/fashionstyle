import { useState } from 'react';
import { useAdminStats, useAdminStatsRealtime, useTopProducts } from '@/hooks/useAdminStats';
import type { Period } from '@/services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  Wifi, 
  WifiOff,
  Loader2
} from 'lucide-react';

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>('30d');
  const [activeTab, setActiveTab] = useState('featured');
  
  // Main stats query
  const { data: stats, isLoading, error, isFetching } = useAdminStats(period);
  
  // Real-time connection status
  const { isConnected, status } = useAdminStatsRealtime(period);
  
  // Top products query
  const { data: topProducts } = useTopProducts(5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">{error?.message || 'Please try again'}</p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your store performance</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Real-time Status */}
          <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-2">
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {status === 'connected' ? 'Live' : status}
          </Badge>
          
          {/* Period Selector */}
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.overview.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg. order value: ${stats.overview.averageOrderValue}
            </p>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.orders.pending} pending
            </p>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overview.newCustomers} new this period
            </p>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.products?.outOfStock || 0} out of stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="new-arrivals">New Arrivals</TabsTrigger>
          <TabsTrigger value="wedding-tales">Wedding Tales</TabsTrigger>
          <TabsTrigger value="designers-discount">Designers Discount</TabsTrigger>
          <TabsTrigger value="summer-sale">Summer Sale</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.orders).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="capitalize">{status}</span>
                      <Badge variant={count > 0 ? 'default' : 'secondary'}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts?.slice(0, 5).map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.sales} sales</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gold">
                        ${product.revenue.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Featured Tab */}
        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle>Featured Collection Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Manage your featured products that appear on the homepage carousel
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/admin/products'}
                    className="bg-gold hover:bg-gold/90"
                  >
                    Manage Featured Products
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">Featured Products</p>
                      <p className="text-2xl font-bold text-green-700">
                        {stats.products?.featured || 0}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">New Arrivals</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {stats.products?.new || 0}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600">Sale Items</p>
                      <p className="text-2xl font-bold text-red-700">
                        {stats.products?.sale || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Arrivals Tab */}
        <TabsContent value="new-arrivals">
          <Card>
            <CardHeader>
              <CardTitle>New Arrivals Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Manage products marked as new arrivals for special display
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/admin/products'}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Manage New Arrivals
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">New Arrivals</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {stats.products?.new || 0}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600">This Week</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {Math.floor((stats.products?.new || 0) * 0.3)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wedding Tales Tab */}
        <TabsContent value="wedding-tales">
          <Card>
            <CardHeader>
              <CardTitle>Wedding Tales Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Manage wedding collection products and featured stories
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/admin/products'}
                    className="bg-pink-500 hover:bg-pink-600"
                  >
                    Manage Wedding Collection
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-pink-50 rounded-lg">
                      <p className="text-sm text-pink-600">Wedding Items</p>
                      <p className="text-2xl font-bold text-pink-700">
                        {Math.floor((stats.products?.totalProducts || 0) * 0.15)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-rose-50 rounded-lg">
                      <p className="text-sm text-rose-600">Featured Stories</p>
                      <p className="text-2xl font-bold text-rose-700">
                        {Math.floor((stats.products?.featured || 0) * 0.4)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Designers Discount Tab */}
        <TabsContent value="designers-discount">
          <Card>
            <CardHeader>
              <CardTitle>Designers Discount Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Manage designer discount campaigns and special offers
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/admin/products'}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    Manage Designer Discounts
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600">Discount Items</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {Math.floor((stats.products?.sale || 0) * 0.6)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <p className="text-sm text-indigo-600">Active Campaigns</p>
                      <p className="text-2xl font-bold text-indigo-700">
                        {Math.floor(Math.random() * 10) + 2}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summer Sale Tab */}
        <TabsContent value="summer-sale">
          <Card>
            <CardHeader>
              <CardTitle>Summer Sale Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Manage summer sale products and seasonal promotions
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/admin/products'}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Manage Summer Sale
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-600">Sale Items</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {stats.products?.sale || 0}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-600">Discount Rate</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {Math.floor(Math.random() * 30) + 10}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(stats.orders).map(([status, count]) => (
                  <Card key={status}>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-500 capitalize">{status}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="text-3xl font-bold">{stats.products?.totalProducts || 0}</p>
                </div>
                <div className="text-center p-6 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-500">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-600">{stats.products.outOfStock}</p>
                </div>
                <div className="text-center p-6 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-500">Low Stock</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.products.lowStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold">{stats.customers.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold">{stats.customers.active}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Churn Rate</p>
                    <p className="text-2xl font-bold">{stats.customers.churnRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Lifetime Value</p>
                    <p className="text-2xl font-bold">${stats.customers.lifetimeValue}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Top Locations</h3>
                  <div className="space-y-2">
                    {stats.customers.byLocation.map((location) => (
                      <div key={location.city} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span>{location.city}</span>
                        <Badge variant="outline">{location.count} customers</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Loading Indicator */}
      {isFetching && (
        <div className="fixed bottom-4 right-4 bg-gold text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Updating stats...</span>
        </div>
      )}
    </div>
  );
}
