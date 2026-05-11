import { useState, useEffect } from 'react';
import { Edit, Trash2, UserPlus, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Using correct Users API endpoint
import { API_CONFIG } from '../../config/api';
const API_URL = API_CONFIG.usersApi;

interface Customer {
  userId: string;
  cognitoSub: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  contact: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  role: string;
  status: string;
  enabled: boolean;
  cognitoStatus: string;
  createdAt: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      let token = localStorage.getItem('jwt_token');

      // For testing - if no token, try to get from Cognito session
      if (!token) {
        console.log('⚠️ No token in localStorage, trying Cognito...');
        try {
          const { fetchAuthSession } = await import('aws-amplify/auth');
          const session = await fetchAuthSession();
          if (session.tokens) {
            token = session.tokens.accessToken.toString();
            localStorage.setItem('jwt_token', token);
            console.log('✅ Got token from Cognito session');
          }
        } catch (e) {
          console.log('❌ Could not get token from Cognito');
        }
      }

      console.log('📡 Fetching customers from API...');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers,
      });

      console.log('📊 Response status:', response.status);

      // Users API is now working, handle normal errors only

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Loaded users:', data);

      // Handle different response structures
      let userList: Customer[] = [];
      
      if (data && data.users && Array.isArray(data.users)) {
        userList = data.users;
      } else if (data && data.items && Array.isArray(data.items)) {
        userList = data.items;
      } else if (data && Array.isArray(data)) {
        userList = data;
      } else {
        console.warn('⚠️ API returned unexpected data structure');
        toast.error('User service temporarily unavailable. Please contact support.');
        setError('User service is returning incorrect data. Backend needs to be fixed.');
        setLoading(false);
        return;
      }

      if (data && data.message) {
        console.warn('⚠️ User service returned status message:', data.message);
        toast.info('User service is initializing. Please try again in a moment.');
        setError('User service is not fully initialized yet.');
        setLoading(false);
        return;
      }

      // Filter to show only customers (role = 'customer')
      const customerList = userList.filter(user => 
        user.role?.toLowerCase() === 'customer'
      );

      setCustomers(customerList);
      if (customerList.length > 0) {
        toast.success(`Loaded ${customerList.length} customer(s)`);
      } else {
        toast.info('No customers found');
      }
    } catch (err: any) {
      console.error('❌ Failed to load customers:', err);
      setError(err.message || 'Failed to load customers');
      toast.error('Failed to load customers: ' + err.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: any) => {
    // Map backend 'id' field to frontend 'userId'
    const userId = customer.id || customer.userId || customer.PK?.replace('USER#', '') || customer.email || '';
    
    console.log('📝 Editing customer:', { userId, customer });
    
    setEditingCustomer({
      userId: userId,
      cognitoSub: customer.cognitoSub || customer.cognito_sub || '',
      email: customer.email || '',
      name: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '',
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      role: customer.role || 'customer',
      status: customer.status || 'active',
      contact: customer.contact || customer.phone || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      postalCode: customer.postalCode || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingCustomer || !editingCustomer.email) {
      toast.error('Email is required');
      return;
    }

    const fullName = editingCustomer.name || `${editingCustomer.firstName || ''} ${editingCustomer.lastName || ''}`.trim();

    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        toast.error('Please login to save customers');
        return;
      }

      if (editingCustomer.userId && editingCustomer.email) {
        // Update existing customer - use email as key (backend uses email as primary key)
        const encodedEmail = encodeURIComponent(editingCustomer.email);
        const url = `${API_URL}/users/${encodedEmail}`;

        // Payload matches backend structure
        const payload = {
          name: fullName,
          phone: editingCustomer.phone,
          role: 'customer', // Force role to be customer
          status: editingCustomer.status?.toLowerCase() || 'active',
          address: editingCustomer.address,
          city: editingCustomer.city,
        };

        console.log('📝 PUT Request URL:', url);
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Customer updated:', result);
        toast.success('Customer updated successfully!');
      } else {
        // Create new customer
        const url = `${API_URL}/users`;

        const payload = {
          email: editingCustomer.email,
          name: fullName,
          phone: editingCustomer.phone,
          role: 'customer', // Force role to be customer
          status: 'active',
        };

        console.log('➕ POST Request URL:', url);
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Customer created:', result);
        toast.success('Customer created successfully!');
      }

      setShowModal(false);
      setEditingCustomer(null);
      loadCustomers(); // Reload to get fresh data
    } catch (err: any) {
      console.error('Failed to save customer:', err);
      toast.error('Failed to save customer: ' + err.message);
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm('Delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        toast.error('Please login to delete customers');
        return;
      }

      console.log('🗑️ Deleting customer:', email);

      const encodedEmail = encodeURIComponent(email);
      const response = await fetch(`${API_URL}/users/${encodedEmail}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete customer');
      }

      toast.success('Customer deleted successfully!');
      setCustomers(customers.filter(c => c.email !== email));
    } catch (err: any) {
      console.error('❌ Delete failed:', err);
      toast.error('Failed to delete customer: ' + err.message);
    }
  };

  const getStatusBadge = (customer: Customer) => {
    const status = customer.status || customer.cognitoStatus || 'active';
    const enabled = customer.enabled !== false;

    if (!enabled) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Disabled</span>;
    }

    switch (status.toLowerCase()) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <Button
            onClick={loadCustomers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingCustomer({
                role: 'customer',
                status: 'active',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
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
            {customers.map((customer) => (
              <tr key={customer.email} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {customer.name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {customer.phone || 'No phone'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {customer.city || 'No city'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(customer)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit customer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.email)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No customers found
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {showModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingCustomer.userId ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCustomer(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={editingCustomer.email || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingCustomer.userId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingCustomer.name || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editingCustomer.phone || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={editingCustomer.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={editingCustomer.city || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editingCustomer.status || 'active'}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCustomer(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingCustomer.userId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
