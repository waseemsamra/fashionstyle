import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit, Trash2, Eye, Mail, Phone, MapPin,
  CheckCircle, XCircle, Pause, RefreshCw, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { vendorApi, type Vendor } from '@/services/vendorManagement';
import VendorForm from '@/components/admin/VendorForm';

export default function AdminVendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Vendor['status']>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, suspended: 0 });

  useEffect(() => {
    fetchVendors();
  }, [statusFilter]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const filters: any = { limit: 100 };
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (search) filters.search = search;

      const response = await vendorApi.getAllVendors(filters);
      const vendorList = response.vendors || response.items || [];
      setVendors(vendorList);

      // Calculate stats
      setStats({
        total: vendorList.length,
        active: vendorList.filter((v: Vendor) => v.status === 'active').length,
        inactive: vendorList.filter((v: Vendor) => v.status === 'inactive').length,
        suspended: vendorList.filter((v: Vendor) => v.status === 'suspended').length,
      });
    } catch (error: any) {
      console.error('Failed to fetch vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVendors();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

    try {
      await vendorApi.deleteVendor(id);
      toast.success(`Vendor "${name}" deleted successfully`);
      fetchVendors();
    } catch (error: any) {
      toast.error(`Failed to delete vendor: ${error.message}`);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'suspend' | 'delete') => {
    if (selectedVendors.length === 0) {
      toast.error('No vendors selected');
      return;
    }

    const actionText = action === 'delete' ? 'delete' : `update status to ${action}`;
    if (!confirm(`Are you sure you want to ${actionText} ${selectedVendors.length} vendor(s)?`)) return;

    try {
      if (action === 'delete') {
        for (const id of selectedVendors) {
          await vendorApi.deleteVendor(id);
        }
        toast.success(`${selectedVendors.length} vendor(s) deleted`);
      } else {
        await vendorApi.bulkUpdateStatus(selectedVendors, action === 'activate' ? 'active' : action === 'deactivate' ? 'inactive' : 'suspended');
        toast.success(`${selectedVendors.length} vendor(s) updated`);
      }
      setSelectedVendors([]);
      fetchVendors();
    } catch (error: any) {
      toast.error(`Bulk action failed: ${error.message}`);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingVendor(null);
    fetchVendors();
  };

  const getStatusBadge = (status: Vendor['status']) => {
    const config = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-3 h-3 mr-1" />, label: 'Active' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Pause className="w-3 h-3 mr-1" />, label: 'Inactive' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-3 h-3 mr-1" />, label: 'Suspended' },
    };
    const c = config[status];
    return (
      <Badge className={`${c.bg} ${c.text}`}>
        {c.icon}
        {c.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendor Management</h1>
          <p className="text-gray-600 mt-1">Manage your vendors, track performance, and handle orders</p>
        </div>
        <Button
          onClick={() => { setEditingVendor(null); setShowForm(true); }}
          className="bg-gold hover:bg-gold/90 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Vendors</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Pause className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inactive}</p>
              <p className="text-sm text-gray-600">Inactive</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.suspended}</p>
              <p className="text-sm text-gray-600">Suspended</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendors by name, email, brand..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Bulk Actions */}
          {selectedVendors.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedVendors.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>Activate</Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>Deactivate</Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('suspend')}>Suspend</Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => handleBulkAction('delete')}>Delete</Button>
            </div>
          )}

          <Button size="sm" variant="outline" onClick={fetchVendors}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Vendors Table */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-lg border">
          <RefreshCw className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
          <p className="text-gray-600">Loading vendors...</p>
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Vendors Found</h3>
          <p className="text-gray-500 mb-6">Add your first vendor to get started</p>
          <Button onClick={() => setShowForm(true)} className="bg-gold hover:bg-gold/90 text-white gap-2">
            <Plus className="w-4 h-4" />
            Add Vendor
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedVendors.length === vendors.length && vendors.length > 0}
                      onChange={(e) => setSelectedVendors(e.target.checked ? vendors.map(v => v.id) : [])}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Brands</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVendors([...selectedVendors, vendor.id]);
                          } else {
                            setSelectedVendors(selectedVendors.filter(id => id !== vendor.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {vendor.logo ? (
                          <img src={vendor.logo} alt={vendor.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold/50 flex items-center justify-center text-white font-semibold">
                            {vendor.name[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{vendor.name}</p>
                          {vendor.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{vendor.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{vendor.email}</span>
                        </div>
                        {vendor.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{vendor.phone}</span>
                          </div>
                        )}
                        {vendor.city && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-3 h-3" />
                            <span>{vendor.city}{vendor.country ? `, ${vendor.country}` : ''}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {vendor.brands.slice(0, 2).map((brand, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{brand}</Badge>
                        ))}
                        {vendor.brands.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{vendor.brands.length - 2}</Badge>
                        )}
                        {vendor.brands.length === 0 && (
                          <span className="text-xs text-gray-400">No brands</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(vendor.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-semibold">{vendor.metrics.totalOrders || 0}</p>
                        <p className="text-xs text-gray-500">orders</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-semibold">${(vendor.metrics.totalRevenue || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">revenue</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingVendor(vendor); setShowForm(true); }}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id, vendor.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vendor Form Modal */}
      {showForm && (
        <VendorForm
          vendor={editingVendor}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditingVendor(null); }}
        />
      )}
    </div>
  );
}
