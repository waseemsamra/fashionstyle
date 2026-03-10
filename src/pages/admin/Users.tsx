import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Users as UsersIcon, Edit, Trash2, UserPlus, X, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getUsers();
      console.log('Loaded users:', data);
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Make sure the API is deployed.');
      // Fallback to empty array
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    // Pre-fill all user data for editing
    setEditingUser({
      userId: user.userId,
      cognitoSub: user.cognitoSub,
      email: user.email || '',
      name: user.name || user.firstName + ' ' + user.lastName || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'customer',
      status: user.status || 'active',
      contact: user.contact || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      postalCode: user.postalCode || '',
      enabled: user.enabled !== false,
      cognitoStatus: user.cognitoStatus || user.status
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUser({ id: Date.now(), email: '', name: '', role: 'Customer', status: 'Active', created: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingUser.userId) {
        // Update existing user - send all profile fields
        await api.updateUser(editingUser.userId, {
          name: editingUser.name,
          email: editingUser.email,
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          contact: editingUser.contact,
          phone: editingUser.phone,
          address: editingUser.address,
          city: editingUser.city,
          postalCode: editingUser.postalCode,
          role: editingUser.role?.toLowerCase() || 'customer',
          status: editingUser.status?.toLowerCase() || 'active'
        });
        setUsers(users.map(u => u.userId === editingUser.userId ? editingUser : u));
      } else {
        // Create new user
        const result = await api.createUser({
          email: editingUser.email,
          name: editingUser.name,
          role: editingUser.role?.toLowerCase() || 'customer',
          status: editingUser.status?.toLowerCase() || 'active'
        });
        setUsers([...users, { ...result.user, userId: result.user.userId }]);
      }
      setShowModal(false);
      loadUsers(); // Reload to get fresh data
    } catch (err: any) {
      console.error('Failed to save user:', err);
      alert('Failed to save user: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Delete this user? This action cannot be undone.')) {
      try {
        console.log('🗑️ Deleting user:', userId);
        const token = localStorage.getItem('jwt_token');
        console.log('Token:', token ? 'Present' : 'Missing');
        
        const response = await api.deleteUser(userId);
        console.log('✅ Delete response:', response);
        
        setUsers(users.filter(u => u.userId !== userId));
        loadUsers(); // Reload to get fresh data
      } catch (err: any) {
        console.error('❌ Delete failed:', err);
        console.error('Response:', err.response);
        console.error('Status:', err.response?.status);
        console.error('Data:', err.response?.data);
        alert('Failed to delete user: ' + (err.response?.data?.error || err.message || 'Unknown error'));
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <UsersIcon className="w-6 h-6" />
            <h3 className="text-xl font-bold">Users Management</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={loadUsers} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={handleAdd} className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
            <p className="mt-4 text-gray-600 text-sm">
              Note: The users API needs to be deployed. Run the deployment script to add the /users endpoint.
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
            <p className="text-sm text-gray-500 mt-2">Users will appear here after they sign up</p>
          </div>
        ) : (
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.userId || user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">
                  {(user.firstName || user.lastName) ? `${user.firstName} ${user.lastName}`.trim() : 
                   user.name || 'N/A'}
                </td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role || 'customer'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.status || user.cognitoStatus || 'active'}
                    </span>
                    {user.enabled === false && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Disabled
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
                    <button 
                      onClick={() => handleEdit(user)} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.userId)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {showModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingUser.userId ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    value={editingUser.firstName || ''}
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editingUser.lastName || ''}
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact / Phone</label>
                <input
                  type="tel"
                  value={editingUser.contact || editingUser.phone || ''}
                  onChange={(e) => setEditingUser({...editingUser, contact: e.target.value, phone: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={editingUser.address || ''}
                  onChange={(e) => setEditingUser({...editingUser, address: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={editingUser.city || ''}
                    onChange={(e) => setEditingUser({...editingUser, city: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={editingUser.postalCode || ''}
                    onChange={(e) => setEditingUser({...editingUser, postalCode: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="10001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    value={editingUser.role || 'customer'}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={editingUser.status || 'active'}
                    onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t mt-4">
                <button onClick={handleSave} className="flex-1 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 font-medium">
                  {editingUser.userId ? 'Update User' : 'Create User'}
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
