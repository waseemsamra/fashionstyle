import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Clock,
  DollarSign,
  AlertCircle,
  Calendar,
  Download,
  RefreshCw,
  MapPin,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import deliveryAnalyticsService, {
  type AnalyticsOverview,
  type TimelineData,
  type MethodPerformance,
  type ZonePerformance,
  type DeliveryForecast,
  type DeliveryCosts,
  type ReturnAnalytics
} from '@/services/deliveryAnalyticsService';

const COLORS = ['#D4AF37', '#2D3748', '#718096', '#F56565', '#48BB78', '#4299E1', '#9F7AEA', '#ED8936'];

export default function DeliveryAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [methodPerformance, setMethodPerformance] = useState<MethodPerformance[]>([]);
  const [zonePerformance, setZonePerformance] = useState<ZonePerformance[]>([]);
  const [forecast, setForecast] = useState<DeliveryForecast | null>(null);
  const [costs, setCosts] = useState<DeliveryCosts | null>(null);
  const [returns, setReturns] = useState<ReturnAnalytics | null>(null);

  useEffect(() => {
    loadAllData();
  }, [period]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        overviewData,
        timelineData,
        methodData,
        zoneData,
        forecastData,
        costsData,
        returnsData
      ] = await Promise.all([
        deliveryAnalyticsService.getOverview(period),
        deliveryAnalyticsService.getTimeline(period, 'day'),
        deliveryAnalyticsService.getMethodPerformance(period),
        deliveryAnalyticsService.getZonePerformance(period),
        deliveryAnalyticsService.getDeliveryForecast(14),
        deliveryAnalyticsService.getDeliveryCosts(period, 'day'),
        deliveryAnalyticsService.getReturnAnalytics(period)
      ]);

      setOverview(overviewData);
      setTimeline(timelineData);
      setMethodPerformance(methodData);
      setZonePerformance(zoneData);
      setForecast(forecastData);
      setCosts(costsData);
      setReturns(returnsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
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

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getStatusBadge = (rate: number) => {
    if (rate >= 95) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rate >= 85) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Delivery Analytics
          </h1>
          <p className="text-gray-600 mt-1">Monitor delivery performance and trends</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAllData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-3xl font-bold">{overview.summary.totalOrders}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(overview.trends.orders)}
                    <span className={`text-sm ${overview.trends.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {overview.trends.orders > 0 ? '+' : ''}{overview.trends.orders.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className="p-3 bg-gold/10 rounded-lg">
                  <Package className="w-6 h-6 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">On-Time Rate</p>
                  <p className="text-3xl font-bold">{overview.summary.onTimeRate.toFixed(1)}%</p>
                  <div className="mt-2">
                    {getStatusBadge(overview.summary.onTimeRate)}
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Avg Delivery Time</p>
                  <p className="text-3xl font-bold">{overview.summary.averageDeliveryTime} days</p>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(-overview.trends.deliveryTime)}
                    <span className={`text-sm ${overview.trends.deliveryTime <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {overview.trends.deliveryTime > 0 ? '+' : ''}{overview.trends.deliveryTime.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Shipping Cost</p>
                  <p className="text-3xl font-bold">{formatCurrency(parseFloat(overview.summary.totalShippingCost))}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(overview.trends.cost)}
                    <span className={`text-sm ${overview.trends.cost <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {overview.trends.cost > 0 ? '+' : ''}{overview.trends.cost.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <LineChartIcon className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="methods" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Methods
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Zones
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Costs
          </TabsTrigger>
          <TabsTrigger value="returns" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Returns
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {overview && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Delivered</p>
                    <p className="text-2xl font-bold">{overview.summary.deliveredOrders}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">In Transit</p>
                    <p className="text-2xl font-bold">{overview.summary.inTransitOrders}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Returns</p>
                    <p className="text-2xl font-bold">{overview.summary.totalReturns}</p>
                    <p className="text-xs text-gray-500">{overview.summary.returnRate}% rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Exceptions</p>
                    <p className="text-2xl font-bold">{overview.summary.exceptions}</p>
                    <p className="text-xs text-gray-500">{overview.summary.exceptionRate.toFixed(1)}% rate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Performance</CardTitle>
                  <CardDescription>Daily delivery volume and on-time rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeline?.data?.slice(-14)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="orders"
                          name="Orders"
                          stroke="#D4AF37"
                          fill="#D4AF37"
                          fillOpacity={0.2}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="onTimeRate"
                          name="On-Time Rate %"
                          stroke="#48BB78"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Method Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Method Performance</CardTitle>
                  <CardDescription>Top delivery methods by volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={methodPerformance.slice(0, 5)}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="method" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="orders" name="Orders" fill="#D4AF37" />
                        <Bar dataKey="onTimeRate" name="On-Time %" fill="#48BB78" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Volume Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeline?.data}>
                      <Line type="monotone" dataKey="orders" stroke="#D4AF37" strokeWidth={2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeline?.data}>
                      <Line type="monotone" dataKey="avgDeliveryTime" stroke="#48BB78" strokeWidth={2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exception Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeline?.data}>
                      <Line type="monotone" dataKey="exceptions" stroke="#F56565" strokeWidth={2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Cost Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeline?.data}>
                      <Line type="monotone" dataKey="shippingCost" stroke="#9F7AEA" strokeWidth={2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forecast */}
          {forecast && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Delivery Forecast (Next 14 Days)
                </CardTitle>
                <CardDescription>
                  Based on {forecast.metadata.basedOn} historical orders | Avg daily: {forecast.metadata.avgDailyVolume}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast.forecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="forecastVolume"
                        name="Forecast"
                        stroke="#D4AF37"
                        fill="#D4AF37"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        name="Upper Bound"
                        stroke="#718096"
                        fill="#718096"
                        fillOpacity={0.1}
                      />
                      <Area
                        type="monotone"
                        dataKey="lowerBound"
                        name="Lower Bound"
                        stroke="#718096"
                        fill="#718096"
                        fillOpacity={0.1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Methods Tab */}
        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Method Performance</CardTitle>
              <CardDescription>Compare delivery methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Method</th>
                      <th className="text-right py-3">Orders</th>
                      <th className="text-right py-3">Delivered</th>
                      <th className="text-right py-3">On-Time %</th>
                      <th className="text-right py-3">Avg Days</th>
                      <th className="text-right py-3">Avg Cost</th>
                      <th className="text-right py-3">Exception %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {methodPerformance.map((method, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{method.method}</td>
                        <td className="text-right py-3">{method.orders}</td>
                        <td className="text-right py-3">{method.delivered}</td>
                        <td className="text-right py-3">
                          <span className={method.onTimeRate >= 95 ? 'text-green-600' : 'text-yellow-600'}>
                            {method.onTimeRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3">{method.avgDeliveryTime}</td>
                        <td className="text-right py-3">{formatCurrency(parseFloat(method.avgShippingCost))}</td>
                        <td className="text-right py-3">
                          <span className={method.exceptionRate < 5 ? 'text-green-600' : 'text-red-600'}>
                            {method.exceptionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zone Performance</CardTitle>
              <CardDescription>Delivery performance by zone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Zone</th>
                      <th className="text-right py-3">Orders</th>
                      <th className="text-right py-3">On-Time %</th>
                      <th className="text-right py-3">Avg Days</th>
                      <th className="text-right py-3">Avg Cost</th>
                      <th className="text-right py-3">Exception %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zonePerformance.map((zone, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{zone.zone}</td>
                        <td className="text-right py-3">{zone.orders}</td>
                        <td className="text-right py-3">
                          <span className={zone.onTimeRate >= 95 ? 'text-green-600' : 'text-yellow-600'}>
                            {zone.onTimeRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3">{zone.avgDeliveryTime}</td>
                        <td className="text-right py-3">{formatCurrency(parseFloat(zone.avgShippingCost))}</td>
                        <td className="text-right py-3">
                          <span className={zone.exceptionRate < 5 ? 'text-green-600' : 'text-red-600'}>
                            {zone.exceptionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          {costs && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Total Shipping Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(parseFloat(costs.summary.totalCost))}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Average Cost/Order</p>
                    <p className="text-2xl font-bold">{formatCurrency(parseFloat(costs.summary.avgCostPerOrder))}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold">{costs.summary.totalOrders}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown by Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(costs.breakdown.byMethod).map(([name, value]) => ({
                            name,
                            value
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(costs.breakdown.byMethod).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Returns Tab */}
        <TabsContent value="returns" className="space-y-4">
          {returns && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Total Returns</p>
                    <p className="text-2xl font-bold">{returns.summary.totalReturns}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Return Rate</p>
                    <p className="text-2xl font-bold">{returns.summary.returnRate.toFixed(1)}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Total Refund Amount</p>
                    <p className="text-2xl font-bold">{formatCurrency(parseFloat(returns.summary.totalRefundAmount))}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-500">Avg Refund</p>
                    <p className="text-2xl font-bold">{formatCurrency(parseFloat(returns.summary.avgRefundAmount))}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Returns by Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(returns.byReason).map(([reason, count]) => ({ reason, count }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="reason" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#F56565" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
