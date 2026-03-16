import { useState } from 'react';
import type { Address } from '@/services/userService';
import { useAddAddress, useUpdateAddress, useDeleteAddress } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';

interface AddressBookProps {
  addresses: Address[];
}

export function AddressBook({ addresses }: AddressBookProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const handleDelete = (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      deleteAddress.mutate(addressId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Address Book</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gold hover:bg-gold/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Address
        </Button>
      </div>

      {/* Address Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="bg-white rounded-lg shadow-lg p-6 relative group"
          >
            {/* Default Badge */}
            {address.isDefault && (
              <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                Default
              </span>
            )}

            {/* Type Badge */}
            <span className="inline-block bg-gold/10 text-gold text-xs px-2 py-1 rounded mb-3">
              {address.type === 'shipping' ? 'Shipping' : 'Billing'}
            </span>

            {/* Address Content */}
            <div className="mb-4">
              <p className="font-medium">{address.name}</p>
              <p className="text-gray-600 text-sm mt-1">
                {address.line1}<br />
                {address.line2 && <>{address.line2}<br /></>}
                {address.city}, {address.state} {address.postalCode}<br />
                {address.country}
              </p>
              {address.phone && (
                <p className="text-sm text-gray-500 mt-2">📞 {address.phone}</p>
              )}
              {address.instructions && (
                <p className="text-sm text-gray-500 mt-1 italic">
                  Note: {address.instructions}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingAddress(address)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              {!address.isDefault && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(address.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Add New Card */}
        {!showForm && !editingAddress && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-white rounded-lg shadow-lg p-6 border-2 border-dashed border-gray-300 hover:border-gold transition flex flex-col items-center justify-center text-gray-500 hover:text-gold group"
          >
            <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition" />
            <span>Add New Address</span>
          </button>
        )}
      </div>

      {/* Address Form Modal */}
      {(showForm || editingAddress) && (
        <AddressForm
          address={editingAddress}
          onClose={() => {
            setShowForm(false);
            setEditingAddress(null);
          }}
          onSubmit={(data: any) => {
            if (editingAddress) {
              updateAddress.mutate({ addressId: editingAddress.id, data });
            } else {
              addAddress.mutate(data);
            }
            setShowForm(false);
            setEditingAddress(null);
          }}
        />
      )}
    </div>
  );
}

// Address Form Component
function AddressForm({ address, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    type: address?.type || 'shipping',
    isDefault: address?.isDefault || false,
    name: address?.name || '',
    line1: address?.line1 || '',
    line2: address?.line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postalCode || '',
    country: address?.country || 'US',
    phone: address?.phone || '',
    instructions: address?.instructions || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <h2 className="text-2xl font-bold">
            {address ? 'Edit Address' : 'Add New Address'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Address Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Address Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="shipping">Shipping Address</option>
                <option value="billing">Billing Address</option>
              </select>
            </div>

            {/* Default */}
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded text-gold"
                />
                <span className="text-sm">Set as default address</span>
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block text-sm font-medium mb-2">Address Line 1 *</label>
            <input
              type="text"
              value={formData.line1}
              onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-sm font-medium mb-2">Address Line 2</label>
            <input
              type="text"
              value={formData.line2}
              onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* City, State, ZIP */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">State *</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ZIP Code *</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium mb-2">Country *</label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="AU">Australia</option>
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-2">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="+1 (555) 000-0000"
              required
            />
          </div>

          {/* Delivery Instructions */}
          <div>
            <label className="block text-sm font-medium mb-2">Delivery Instructions</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Gate code, building name, etc."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gold text-white py-2 rounded-lg hover:bg-gold/90 transition"
            >
              {address ? 'Update Address' : 'Add Address'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
