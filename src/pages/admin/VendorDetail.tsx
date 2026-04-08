import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Globe, Edit, Package, DollarSign, Star, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { vendorApi, type Vendor } from '@/services/vendorManagement';

export default function AdminVendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'analytics'>('overview');

  useEffect(() => {
    if (id) fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [vendorData, ordersData] = await Promise.all([
        vendorApi.getVendorById(id),
        vendorApi.getVendorOrders(id, { limit: 50 }),
      ]);
      setVendor(vendorData);
      setOrders(ordersData.orders || ordersData.items || []);
    } catch (error: any) {
      toast.error(`Failed to load vendor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Vendor not found</p>
          <Button onClick={() => navigate('/admin/vendors')} className="mt-4">
            Back to Vendors
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: Vendor['status']) => {
    const config = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' },
    };
    const c = config[status];
    return <Badge className={`${c.bg} ${c.text}`}>{c.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/vendors')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            {vendor.logo ? (
              <img src={vendor.logo} alt={vendor.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold/50 flex items-center justify-center text-white text-2xl font-bold">
                {vendor.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{vendor.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(vendor.status)}
                {vendor.brands.length > 0 && (
                  <Badge variant="outline">{vendor.brands.length} brands</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate(`/admin/vendors/edit/${id}`)} className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Vendor
        </Button>
      </div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
          <Mail className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{vendor.email}</p>
          </div>
        </div>
        {vendor.phone && (
          <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
            <Phone className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{vendor.phone}</p>
            </div>
          </div>
        )}
        {vendor.city && (
          <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
            <MapPin className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">{vendor.city}{vendor.country ? `, ${vendor.country}` : ''}</p>
            </div>
          </div>
        )}
        {vendor.website && (
          <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
            <Globe className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-500">Website</p>
              <p className="font-medium">{vendor.website}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-blue-800">{vendor.metrics.totalOrders || 0}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 mb-1">Revenue</p>
              <p className="text-3xl font-bold text-green-800">${(vendor.metrics.totalRevenue || 0).toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 mb-1">Rating</p>
              <p className="text-3xl font-bold text-purple-800 flex items-center gap-1">
                {vendor.metrics.averageRating || 0}
                <Star className="w-5 h-5 fill-current" />
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 mb-1">Response Time</p>
              <p className="text-3xl font-bold text-orange-800">{vendor.metrics.responseTime || 0}h</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b px-6 flex gap-4">
          {(['overview', 'orders', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {vendor.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{vendor.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Brands</h3>
                  <div className="flex flex-wrap gap-2">
                    {vendor.brands.map((brand, i) => (
                      <Badge key={i} variant="outline">{brand}</Badge>
                    ))}
                    {vendor.brands.length === 0 && <p className="text-sm text-gray-400">No brands assigned</p>}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {vendor.categories.map((cat, i) => (
                      <Badge key={i} variant="outline">{cat}</Badge>
                    ))}
                    {vendor.categories.length === 0 && <p className="text-sm text-gray-400">No categories assigned</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Commission Rate</h3>
                  <p className="text-2xl font-bold text-gold">{vendor.commissionRate}%</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Payment Terms</h3>
                  <p className="text-lg">{vendor.paymentTerms}</p>
                </div>
              </div>

              {vendor.notes && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold mb-2 text-yellow-800">Internal Notes</h3>
                  <p className="text-sm text-yellow-700">{vendor.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No orders found for this vendor</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">#{order.orderNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">{order.items?.length || 0}</td>
                          <td className="px-4 py-3 font-semibold">${order.total.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{order.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-xl">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Completion Rate</h3>
                  <p className="text-3xl font-bold text-blue-800">
                    {vendor.metrics.totalOrders > 0
                      ? Math.round((vendor.metrics.completedOrders / vendor.metrics.totalOrders) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="bg-red-50 p-6 rounded-xl">
                  <h3 className="text-sm font-medium text-red-700 mb-2">Cancellation Rate</h3>
                  <p className="text-3xl font-bold text-red-800">
                    {vendor.metrics.totalOrders > 0
                      ? Math.round((vendor.metrics.cancelledOrders / vendor.metrics.totalOrders) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-4">Performance Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{vendor.metrics.completedOrders}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{vendor.metrics.cancelledOrders}</p>
                    <p className="text-sm text-gray-600">Cancelled</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{vendor.metrics.averageRating || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
