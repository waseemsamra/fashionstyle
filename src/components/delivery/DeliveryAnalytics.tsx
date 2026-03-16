import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Clock, CheckCircle, AlertCircle, Package, MapPin } from 'lucide-react';

interface DeliveryMetrics {
  totalOrders: number;
  averageDeliveryTime: number;
  onTimeRate: number;
  costPerOrder: number;
  popularMethods: { method: string; count: number }[];
  dailyVolume: { date: string; orders: number }[];
  pendingDeliveries: number;
  exceptionCount: number;
}

export default function DeliveryAnalytics() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DeliveryMetrics | null>(null);

  useEffect(() => {
    fetchDeliveryMetrics();
  }, []);

  const fetchDeliveryMetrics = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockMetrics: DeliveryMetrics = {
        totalOrders: 1247,
        averageDeliveryTime: 3.2,
        onTimeRate: 94.5,
        costPerOrder: 8.45,
        popularMethods: [
          { method: 'Standard', count: 687 },
          { method: 'Express', count: 423 },
          { method: 'Next Day', count: 137 }
        ],
        dailyVolume: [
          { date: 'Mon', orders: 45 },
          { date: 'Tue', orders: 52 },
          { date: 'Wed', orders: 48 },
          { date: 'Thu', orders: 61 },
          { date: 'Fri', orders: 58 },
          { date: 'Sat', orders: 34 },
          { date: 'Sun', orders: 28 }
        ],
        pendingDeliveries: 23,
        exceptionCount: 5
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="w-8 h-8" />
            Delivery Analytics
          </h1>
          <p className="text-gray-600 mt-1">Track delivery performance and metrics</p>
        </div>
        <Button onClick={fetchDeliveryMetrics} className="bg-gold hover:bg-gold/90">
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageDeliveryTime} days</div>
            <p className="text-xs text-muted-foreground">From order to delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.onTimeRate}%</div>
            <p className="text-xs text-muted-foreground">Delivered on time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Order</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.costPerOrder}</div>
            <p className="text-xs text-muted-foreground">Average shipping cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Pending Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{metrics?.pendingDeliveries}</div>
            <p className="text-sm text-gray-600 mt-2">Orders in transit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Exceptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{metrics?.exceptionCount}</div>
            <p className="text-sm text-gray-600 mt-2">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">47</div>
            <p className="text-sm text-gray-600 mt-2">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Order Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {metrics?.dailyVolume.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-gold/80 hover:bg-gold transition-colors rounded-t"
                  style={{ height: `${(day.orders / 70) * 100}%` }}
                />
                <span className="text-xs text-gray-600">{day.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Delivery Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.popularMethods.map((method) => {
              const percentage = ((method.count / (metrics.totalOrders / 30)) * 100).toFixed(1);
              return (
                <div key={method.method} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{method.method}</span>
                    <span className="text-gray-600">{method.count} orders ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gold transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Delivery Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { order: '#ORD-2847', status: 'Delivered', time: '2 hours ago', icon: CheckCircle, color: 'text-green-600' },
              { order: '#ORD-2846', status: 'Out for Delivery', time: '3 hours ago', icon: Truck, color: 'text-blue-600' },
              { order: '#ORD-2845', status: 'Exception', time: '5 hours ago', icon: AlertCircle, color: 'text-red-600' },
              { order: '#ORD-2844', status: 'In Transit', time: '6 hours ago', icon: Package, color: 'text-purple-600' },
              { order: '#ORD-2843', status: 'Delivered', time: '8 hours ago', icon: CheckCircle, color: 'text-green-600' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  <div>
                    <p className="font-medium">{activity.order}</p>
                    <p className="text-sm text-gray-600">{activity.status}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
