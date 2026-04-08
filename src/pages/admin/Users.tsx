import { useState, useEffect } from 'react';
import { Users as UsersIcon, Edit, Trash2, UserPlus, X, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Using correct API Gateway for users
const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

interface User {
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

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
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

      if (!token) {
        // Demo mode - show message but still try API
        console.log('📡 Trying API without token (may fail)...');
      }

      console.log('📡 Fetching users from API...');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'GET',
        headers,
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Loaded users:', data);

      // Handle different response structures
      let userList: User[] = [];
      
      if (data && data.users && Array.isArray(data.users)) {
        userList = data.users;
      } else if (data && data.items && Array.isArray(data.items)) {
        // Check if it's actually users data (has email field) vs brands data
        const firstItem = data.items[0];
        if (firstItem && firstItem.email) {
          userList = data.items;
        } else {
          console.warn('⚠️ API returned brands data instead of users');
          toast.error('User service temporarily unavailable. Please contact support.');
          setError('User service is returning incorrect data. Backend needs to be fixed.');
          setLoading(false);
          return;
        }
      } else if (data && data.message) {
        console.warn('⚠️ User service returned status message:', data.message);
        toast.info('User service is initializing. Please try again in a moment.');
        setError('User service is not fully initialized yet.');
        setLoading(false);
        return;
      }

      setUsers(userList);
      if (userList.length > 0) {
        toast.success(`Loaded ${userList.length} user(s)`);
      } else {
        toast.info('No users found');
      }
    } catch (err: any) {
      console.error('❌ Failed to load users:', err);
      setError(err.message || 'Failed to load users');
      toast.error('Failed to load users: ' + err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    // Map backend 'id' field to frontend 'userId'
    const userId = user.id || user.userId || user.PK?.replace('USER#', '') || user.email || '';
    
    console.log('📝 Editing user:', { userId, user });
    
    setEditingUser({
      userId: userId,
      cognitoSub: user.cognitoSub || user.cognito_sub || '',
      email: user.email || '',
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'customer',
      status: user.status || 'active',
      contact: user.contact || user.phone || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      postalCode: user.postalCode || '',
      enabled: user.enabled !== false,
      cognitoStatus: user.cognitoStatus || user.cognito_status || user.status,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUser({
      email: '',
      name: '',
      firstName: '',
      lastName: '',
      role: 'customer',
      status: 'active',
      contact: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        toast.error('Please login to save users');
        return;
      }

      const userData = {
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
        status: editingUser.status?.toLowerCase() || 'active',
      };

      if (editingUser.userId) {
        // Update existing user
        console.log('📝 Updating user:', editingUser.userId);
        const response = await fetch(`${API_URL}/admin/users/${editingUser.userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to update user');
        }

        toast.success('User updated successfully!');
      } else {
        // Create new user
        console.log('➕ Creating new user');
        const response = await fetch(`${API_URL}/admin/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to create user');
        }

        toast.success('User created successfully!');
      }

      setShowModal(false);
      loadUsers(); // Reload to get fresh data
    } catch (err: any) {
      console.error('Failed to save user:', err);
      toast.error('Failed to save user: ' + err.message);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        toast.error('Please login to delete users');
        return;
      }

      console.log('🗑️ Deleting user:', userId);

      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete user');
      }

      toast.success('User deleted successfully!');
      setUsers(users.filter(u => u.userId !== userId));
    } catch (err: any) {
      console.error('❌ Delete failed:', err);
      toast.error('Failed to delete user: ' + err.message);
    }
  };

  const getStatusBadge = (user: User) => {
    const status = user.status || user.cognitoStatus || 'active';
    const enabled = user.enabled !== false;

    if (!enabled) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Disabled
        </span>
      );
    }

    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      confirmed: 'bg-green-100 text-green-700',
      inactive: 'bg-yellow-100 text-yellow-700',
      pending: 'bg-blue-100 text-blue-700',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      customer: 'bg-blue-100 text-blue-700',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[role?.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>
        {role || 'customer'}
      </span>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold/10 rounded-lg">
              <UsersIcon className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Users Management</h3>
              <p className="text-sm text-gray-500">Manage your customer accounts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadUsers}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-gold text-white hover:bg-gold/90 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : error && users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg inline-block mb-4">
              <p className="font-semibold">❌ {error}</p>
            </div>
            <p className="text-gray-600 text-sm">
              Make sure you're logged in as an admin
            </p>
            <Button onClick={loadUsers} className="mt-4 bg-gold text-white">
              Try Again
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No users found</p>
            <p className="text-sm text-gray-500 mt-2">Users will appear here after they sign up</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold/50 rounded-full flex items-center justify-center text-white font-semibold">
                          {(user.name || user.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'N/A')}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                        {user.city && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {user.city}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
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
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {showModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingUser.userId ? '✏️ Edit User' : '➕ Add New User'}
                {!editingUser.userId && editingUser.email && (
                  <span className="text-xs text-gray-400 ml-2">(Editing: {editingUser.email})</span>
                )}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={editingUser.firstName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editingUser.lastName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editingUser.contact || editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, contact: e.target.value, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Address
                </label>
                <input
                  type="text"
                  value={editingUser.address || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="123 Main Street"
                />
              </div>

              {/* City and Postal Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={editingUser.city || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={editingUser.postalCode || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, postalCode: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="10001"
                  />
                </div>
              </div>

              {/* Role and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={editingUser.role || 'customer'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingUser.status || 'active'}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 rounded-b-xl flex gap-3">
              <Button
                onClick={handleSave}
                className="flex-1 bg-gold text-white hover:bg-gold/90 py-3"
              >
                {editingUser.userId ? 'Update User' : 'Create User'}
              </Button>
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                className="flex-1 py-3"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
