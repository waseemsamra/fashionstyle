import { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { vendorApi, type Vendor } from '@/services/vendorManagement';

interface VendorFormProps {
  vendor: Vendor | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function VendorForm({ vendor, onSuccess, onCancel }: VendorFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    address: '',
    city: '',
    country: '',
    website: '',
    description: '',
    logo: '',
    brands: [] as string[],
    categories: [] as string[],
    status: 'active' as Vendor['status'],
    commissionRate: 0,
    paymentTerms: 'Net 30',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    taxId: '',
    taxRate: 0,
    notes: '',
  });

  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        contactPerson: vendor.contactPerson || '',
        address: vendor.address || '',
        city: vendor.city || '',
        country: vendor.country || '',
        website: vendor.website || '',
        description: vendor.description || '',
        logo: vendor.logo || '',
        brands: vendor.brands || [],
        categories: vendor.categories || [],
        status: vendor.status || 'active',
        commissionRate: vendor.commissionRate || 0,
        paymentTerms: vendor.paymentTerms || 'Net 30',
        bankName: vendor.bankDetails?.bankName || '',
        accountNumber: vendor.bankDetails?.accountNumber || '',
        routingNumber: vendor.bankDetails?.routingNumber || '',
        taxId: vendor.taxInfo?.taxId || '',
        taxRate: vendor.taxInfo?.taxRate || 0,
        notes: vendor.notes || '',
      });
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    setLoading(true);
    try {
      const vendorData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        contactPerson: formData.contactPerson,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        website: formData.website,
        description: formData.description,
        logo: formData.logo,
        brands: formData.brands,
        categories: formData.categories,
        status: formData.status,
        commissionRate: formData.commissionRate,
        paymentTerms: formData.paymentTerms,
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          routingNumber: formData.routingNumber,
        },
        taxInfo: {
          taxId: formData.taxId,
          taxRate: formData.taxRate,
        },
        notes: formData.notes,
      };

      if (vendor) {
        await vendorApi.updateVendor(vendor.id, vendorData);
        toast.success(`Vendor "${formData.name}" updated successfully`);
      } else {
        await vendorApi.createVendor(vendorData);
        toast.success(`Vendor "${formData.name}" created successfully`);
      }

      onSuccess();
    } catch (error: any) {
      toast.error(`Failed to save vendor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addBrand = () => {
    if (newBrand.trim() && !formData.brands.includes(newBrand.trim())) {
      setFormData(prev => ({ ...prev, brands: [...prev.brands, newBrand.trim()] }));
      setNewBrand('');
    }
  };

  const removeBrand = (brand: string) => {
    setFormData(prev => ({ ...prev, brands: prev.brands.filter(b => b !== brand) }));
  };

  const addCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      setFormData(prev => ({ ...prev, categories: [...prev.categories, newCategory.trim()] }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setFormData(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold">{vendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vendor Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>
          </div>

          {/* Brands & Categories */}
          <div className="grid grid-cols-2 gap-6">
            {/* Brands */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Brands</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBrand())}
                  placeholder="Add brand..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold"
                />
                <button type="button" onClick={addBrand} className="p-2 bg-gold text-white rounded-lg hover:bg-gold/90">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {formData.brands.map((brand) => (
                  <div key={brand} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">{brand}</span>
                    <button type="button" onClick={() => removeBrand(brand)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  placeholder="Add category..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold"
                />
                <button type="button" onClick={addCategory} className="p-2 bg-gold text-white rounded-lg hover:bg-gold/90">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {formData.categories.map((category) => (
                  <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">{category}</span>
                    <button type="button" onClick={() => removeCategory(category)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Financial Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Commission Rate (%)</label>
                <input
                  type="number"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Terms</label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                >
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Net 90">Net 90</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Vendor['status'] }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Bank Details (Optional)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Routing Number</label>
                <input
                  type="text"
                  value={formData.routingNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, routingNumber: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              rows={3}
              placeholder="Internal notes about this vendor..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gold hover:bg-gold/90 text-white" disabled={loading}>
              {loading ? 'Saving...' : vendor ? 'Update Vendor' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
