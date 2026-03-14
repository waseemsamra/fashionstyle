import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut, updatePassword } from 'aws-amplify/auth';
import { User, Package, Heart, Wallet, CreditCard, LogOut, Lock, X, Trash2, MapPin, Edit, ShoppingCart } from 'lucide-react';
import { api } from '../../services/api';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    contact: '',
    whatsapp: '',
    address: '',
    city: '',
    postalCode: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [wallet] = useState({ balance: 150, transactions: [
    { id: 1, type: 'Credit', amount: 200, date: '2024-03-01', desc: 'Added funds' },
    { id: 2, type: 'Debit', amount: 50, date: '2024-03-05', desc: 'Order payment' },
  ]});

  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: 'Visa', last4: '4242', expiry: '12/25', default: true },
    { id: 2, type: 'Mastercard', last4: '5555', expiry: '08/26', default: false },
  ]);

  const [addresses, setAddresses] = useState([
    { id: 1, name: 'Home', street: '123 Main Street', city: 'Karachi', state: 'Sindh', zip: '75500', country: 'Pakistan', default: true },
    { id: 2, name: 'Office', street: '456 Business Ave', city: 'Lahore', state: 'Punjab', zip: '54000', country: 'Pakistan', default: false },
  ]);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  // Refresh orders when tab becomes visible (user returns to this tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeTab === 'orders') {
        console.log('🔄 Refreshing orders when tab becomes visible');
        loadOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab, user]);

  // Refresh orders when switching to orders tab
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      console.log('🔄 Refreshing orders when switching to orders tab');
      loadOrders();
    }
  }, [activeTab]);

  const loadUser = async () => {
    try {
      // Check localStorage first (where login stores auth)
      const token = localStorage.getItem('jwt_token');
      const email = localStorage.getItem('user_email');

      if (token && email) {
        // User is logged in via our login flow
        console.log('User authenticated via localStorage:', email);

        // Use the FULL email-based userId (matches DynamoDB)
        const userId = email.replace(/[^a-zA-Z0-9]/g, '-'); // waseem-samra-hotmail-com

        console.log('🆔 Using userId:', userId);

        // Set user with correct userId format
        setUser({ userId: userId, username: email, email });
        
        // Load profile data from API
        await loadProfile(userId);
        
        setLoading(false);
        return;
      }

      // Try Cognito auth as fallback
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        await loadProfile(currentUser.userId);
      } catch (cognitoErr) {
        console.log('Cognito user not available, redirecting to login');
        navigate('/login', { state: { from: '/dashboard' } });
        return;
      }

      setLoading(false);
    } catch (err) {
      console.log('Authentication check failed, redirecting to login');
      navigate('/login', { state: { from: '/dashboard' } });
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      console.log('👤 Loading profile for userId:', userId);
      const data = await api.getUserProfile(userId);
      console.log('👤 Profile response:', data);

      if (data && data.profile) {
        console.log('✅ Profile loaded:', data.profile);
        const profileData = {
          firstName: data.profile.firstName || '',
          lastName: data.profile.lastName || '',
          dob: data.profile.dob || '',
          contact: data.profile.contact || '',
          whatsapp: data.profile.whatsapp || '',
          address: data.profile.address || '',
          city: data.profile.city || '',
          postalCode: data.profile.postalCode || ''
        };
        setProfile(profileData);
        // Cache in localStorage
        localStorage.setItem('user_profile', JSON.stringify(profileData));
      } else if (data && data.userId) {
        // Flat format from API
        console.log('✅ Profile loaded (flat format):', data);
        const profileData = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          dob: data.dob || '',
          contact: data.contact || '',
          whatsapp: data.whatsapp || '',
          address: data.address || '',
          city: data.city || '',
          postalCode: data.postalCode || ''
        };
        setProfile(profileData);
        localStorage.setItem('user_profile', JSON.stringify(profileData));
      } else {
        console.log('ℹ️ No profile found, will create on save');
        // Try to load from localStorage cache
        const cachedProfile = localStorage.getItem('user_profile');
        if (cachedProfile) {
          console.log('📦 Loading cached profile from localStorage');
          setProfile(JSON.parse(cachedProfile));
          return;
        }
        // Initialize with email data
        const email = localStorage.getItem('user_email') || '';
        const nameParts = email.split('@')[0].split(/[._-]/);
        setProfile({
          firstName: nameParts[0] || '',
          lastName: nameParts[1] || '',
          dob: '',
          contact: '',
          whatsapp: '',
          address: '',
          city: '',
          postalCode: ''
        });
      }
    } catch (err: any) {
      console.log('ℹ️ Profile load failed, using cache or defaults');
      // Try to load from localStorage cache
      const cachedProfile = localStorage.getItem('user_profile');
      if (cachedProfile) {
        console.log('📦 Loading cached profile from localStorage');
        setProfile(JSON.parse(cachedProfile));
        return;
      }
      // Profile doesn't exist yet - initialize with email data
      const email = localStorage.getItem('user_email') || '';
      const nameParts = email.split('@')[0].split(/[._-]/);
      setProfile({
        firstName: nameParts[0] || '',
        lastName: nameParts[1] || '',
        dob: '',
        contact: '',
        whatsapp: '',
        address: '',
        city: '',
        postalCode: ''
      });
    }
  };

  const loadOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      console.log('📋 Loading orders for user:', user.userId);
      console.log('📋 User email:', user.email);
      
      // Clear cache and fetch fresh orders
      const response = await api.getUserOrders(user.userId);
      console.log('📋 API response:', response);

      // Handle different response formats
      let data = response;

      // If response has orders property, use that
      if (response && typeof response === 'object' && response.orders) {
        data = response.orders;
      }

      if (data && Array.isArray(data)) {
        console.log('✅ Found orders:', data.length);

        // Filter orders to only show ones that match the logged-in user's exact email
        // This prevents orders from other users with similar userId from showing
        const userOrders = data.filter((order: any) => {
          const orderEmail = (order.email || '').toLowerCase();
          const userEmail = (user.email || '').toLowerCase();
          return orderEmail === userEmail;
        });
        
        console.log('✅ Filtered to user orders:', userOrders.length);

        const formattedOrders = userOrders.map((order: any) => {
          const formatted = {
            id: order.orderId || order.id,
            orderId: order.orderId || order.id,
            date: new Date(order.date || order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            items: order.itemCount || order.items?.length || 0,
            total: order.totalPrice || 0,
            status: order.status || 'Processing',
            itemsData: order.items || [],
            paymentMethod: order.paymentMethod,
            address: order.address,
            city: order.city
          };
          return formatted;
        });

        setOrders(formattedOrders);
        console.log('✅ Orders state updated with', formattedOrders.length, 'orders');
      } else if (data && typeof data === 'object' && data.message) {
        // No orders yet
        setOrders([]);
        console.log('ℹ️ No orders found');
      } else {
        setOrders([]);
        console.log('⚠️ Unexpected response format');
      }
    } catch (error: any) {
      console.error('❌ Failed to load orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      // Send profile data in the format expected by the API
      const profileData = {
        userId: user.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        dob: profile.dob,
        contact: profile.contact,
        whatsapp: profile.whatsapp,
        email: user.email || localStorage.getItem('user_email'),
        address: profile.address,
        city: profile.city,
        postalCode: profile.postalCode
      };
      
      console.log('📝 Saving profile:', profileData);
      await api.updateUserProfile(user.userId, profileData);
      
      // Cache in localStorage
      localStorage.setItem('user_profile', JSON.stringify(profile));
      
      console.log('✅ Profile saved and cached');
      setEditMode(false);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    console.log('🚪 Logging out...');
    
    try {
      // Clear all localStorage data
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('refreshToken');
      
      // Clear any Amplify/Cognito data
      const keysToRemove = Object.keys(localStorage).filter(key =>
        key.startsWith('CognitoIdentityServiceProvider') ||
        key.startsWith('aws-amplify') ||
        key.includes('amplify')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('✅ Cleared localStorage');
      
      // Try to sign out from Amplify
      try {
        await signOut();
        console.log('✅ Signed out from Amplify');
      } catch (e) {
        console.log('Amplify sign out completed or not needed');
      }
      
      // Navigate to home and force reload
      navigate('/');
      window.location.reload();
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even on error
      navigate('/');
      window.location.reload();
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (passwords.new !== passwords.confirm) {
      setError('Passwords do not match');
      return;
    }

    try {
      await updatePassword({ oldPassword: passwords.old, newPassword: passwords.new });
      setMessage('Password changed successfully');
      setPasswords({ old: '', new: '', confirm: '' });
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePayment = (id: number) => {
    if (confirm('Delete this payment method?')) {
      setPaymentMethods(paymentMethods.filter(p => p.id !== id));
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setShowAddressModal(true);
  };

  const handleAddAddress = () => {
    setEditingAddress({ id: Date.now(), name: '', street: '', city: '', state: '', zip: '', country: 'Pakistan', default: false });
    setShowAddressModal(true);
  };

  const handleSaveAddress = () => {
    if (addresses.find(a => a.id === editingAddress.id)) {
      setAddresses(addresses.map(a => a.id === editingAddress.id ? editingAddress : a));
    } else {
      setAddresses([...addresses, editingAddress]);
    }
    setShowAddressModal(false);
  };

  const handleDeleteAddress = (id: number) => {
    if (confirm('Delete this address?')) {
      setAddresses(addresses.filter(a => a.id !== id));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-bold">{user?.signInDetails?.loginId}</h3>
                <p className="text-sm text-gray-600">Customer</p>
              </div>
              <nav className="space-y-2">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'orders', label: 'Orders', icon: Package },
                  { id: 'wishlist', label: 'Wishlist', icon: Heart },
                  { id: 'addresses', label: 'Addresses', icon: MapPin },
                  { id: 'wallet', label: 'Wallet', icon: Wallet },
                  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                      activeTab === item.id ? 'bg-gold text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50">
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          <div className="col-span-9">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Profile Information</h2>
                  <button onClick={() => setEditMode(!editMode)} className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90">
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name</label>
                      <input type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} disabled={!editMode} className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-50' : ''}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name</label>
                      <input type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} disabled={!editMode} className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-50' : ''}`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input 
                        type="email" 
                        value={user?.email || user?.signInDetails?.loginId || localStorage.getItem('user_email') || ''} 
                        disabled 
                        className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Date of Birth</label>
                      <input type="date" value={profile.dob} onChange={(e) => setProfile({...profile, dob: e.target.value})} disabled={!editMode} className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-50' : ''}`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Contact Number</label>
                      <input type="tel" value={profile.contact} onChange={(e) => setProfile({...profile, contact: e.target.value})} disabled={!editMode} className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-50' : ''}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">WhatsApp Number</label>
                      <input type="tel" value={profile.whatsapp} onChange={(e) => setProfile({...profile, whatsapp: e.target.value})} disabled={!editMode} className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-50' : ''}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <input type="text" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} disabled={!editMode} placeholder="Street address" className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-50' : ''}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input type="text" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} disabled={!editMode} className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-50' : ''}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Postal Code</label>
                      <input type="text" value={profile.postalCode} onChange={(e) => setProfile({...profile, postalCode: e.target.value})} disabled={!editMode} className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-50' : ''}`} />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {editMode && (
                      <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    )}
                    <button onClick={() => setShowPasswordModal(true)} className="px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Change Password
                    </button>
                  </div>
                  {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{message}</div>}
                  {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">My Orders</h2>
                    <p className="text-sm text-gray-600 mt-1">Track and manage your orders</p>
                  </div>
                  <button
                    onClick={loadOrders}
                    disabled={ordersLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 disabled:opacity-50"
                  >
                    <svg className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                {ordersLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-6 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Order ID</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Items</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Total</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.map((order) => (
                          <tr key={order.orderId || order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{order.orderId || order.id}</td>
                            <td className="px-6 py-4 text-gray-600">
                              {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 text-gray-600">{order.items?.length || order.itemCount || 0} items</td>
                            <td className="px-6 py-4 font-semibold">${(order.totalPrice || order.total || 0).toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'delivered' || order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'on-delivery' || order.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-700' :
                                order.status === 'shipped' || order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-700' :
                                order.status === 'ready-to-pickup' || order.status === 'Ready for Delivery' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'cancelled' || order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                order.status === 'processing' || order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.status === 'on-delivery' || order.status === 'Out for Delivery' ? '📦 Out for Delivery' :
                                 order.status === 'delivered' || order.status === 'Delivered' ? '✅ Delivered' :
                                 order.status === 'shipped' || order.status === 'Shipped' ? '🚚 Shipped' :
                                 order.status === 'ready-to-pickup' || order.status === 'Ready for Delivery' ? '🔵 Ready to Pickup' :
                                 order.status === 'cancelled' || order.status === 'Cancelled' ? '❌ Cancelled' :
                                 '🟡 Processing'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => navigate(`/dashboard/orders/${order.orderId || order.id}`)}
                                className="text-gold hover:underline text-sm font-medium"
                              >
                                View Details →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold">My Wishlist</h2>
                  <p className="text-gray-600 text-sm mt-1">{wishlistItems.length} items saved</p>
                </div>
                {wishlistItems.length === 0 ? (
                  <div className="p-12 text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-bold mb-2">Your wishlist is empty</h3>
                    <p className="text-gray-600 mb-6">Save your favorite products to view them here</p>
                    <button 
                      onClick={() => navigate('/')}
                      className="px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {wishlistItems.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                        <div className="relative">
                          <img 
                            src={item.image || '/placeholder.png'} 
                            alt={item.name} 
                            className="w-full h-48 object-cover rounded-lg mb-3" 
                          />
                          <button
                            onClick={() => {
                              removeFromWishlist(item.id);
                              toast.success(`Removed ${item.name} from wishlist`);
                            }}
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-red-500 hover:text-white transition-colors"
                            title="Remove from wishlist"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        {item.brand && <p className="text-sm text-gray-600">{item.brand}</p>}
                        {item.category && <p className="text-xs text-gray-500 mt-1">{item.category}</p>}
                        <p className="text-xl font-bold text-gold mt-2">${item.price}</p>
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={() => {
                              addToCart(item);
                              toast.success(`Added ${item.name} to cart`);
                            }}
                            className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </button>
                          <button 
                            onClick={() => navigate(`/product/${item.id}`)}
                            className="px-4 py-2 border border-gold text-gold rounded-lg hover:bg-gold hover:text-white transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b flex justify-between items-center">
                  <h2 className="text-2xl font-bold">My Addresses</h2>
                  <button onClick={handleAddAddress} className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90">
                    Add Address
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {addresses.map(address => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold">{address.name}</p>
                            {address.default && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">Default</span>
                            )}
                          </div>
                          <p className="text-gray-600">{address.street}</p>
                          <p className="text-gray-600">{address.city}, {address.state} {address.zip}</p>
                          <p className="text-gray-600">{address.country}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditAddress(address)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteAddress(address.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gold to-yellow-600 rounded-lg shadow p-6 text-white">
                  <p className="text-sm opacity-90">Wallet Balance</p>
                  <p className="text-4xl font-bold mt-2">${wallet.balance}</p>
                  <button className="mt-4 px-6 py-2 bg-white text-gold rounded-lg hover:bg-gray-100">
                    Add Funds
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">Transactions</h2>
                  </div>
                  <div className="divide-y">
                    {wallet.transactions.map(tx => (
                      <div key={tx.id} className="p-6 flex justify-between">
                        <div>
                          <p className="font-medium">{tx.desc}</p>
                          <p className="text-sm text-gray-600">{tx.date}</p>
                        </div>
                        <p className={`font-bold ${tx.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'Credit' ? '+' : '-'}${tx.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Payment Methods</h2>
                  <button onClick={() => setShowPaymentModal(true)} className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90">
                    Add Card
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {paymentMethods.map(method => (
                    <div key={method.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <CreditCard className="w-8 h-8 text-gray-600" />
                        <div>
                          <p className="font-bold">{method.type} •••• {method.last4}</p>
                          <p className="text-sm text-gray-600">Expires {method.expiry}</p>
                        </div>
                        {method.default && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">Default</span>
                        )}
                      </div>
                      <button onClick={() => handleDeletePayment(method.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{message}</div>}
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <input type="password" placeholder="Current Password" value={passwords.old} onChange={(e) => setPasswords({...passwords, old: e.target.value})} className="w-full p-3 border rounded-lg" required />
              <input type="password" placeholder="New Password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} className="w-full p-3 border rounded-lg" required />
              <input type="password" placeholder="Confirm Password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} className="w-full p-3 border rounded-lg" required />
              <button type="submit" className="w-full py-3 bg-gold text-white rounded-lg hover:bg-gold/90">Change Password</button>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Payment Method</h2>
              <button onClick={() => setShowPaymentModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Card Number" className="w-full p-3 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="MM/YY" className="w-full p-3 border rounded-lg" />
                <input type="text" placeholder="CVV" className="w-full p-3 border rounded-lg" />
              </div>
              <input type="text" placeholder="Cardholder Name" className="w-full p-3 border rounded-lg" />
              <button onClick={() => setShowPaymentModal(false)} className="w-full py-3 bg-gold text-white rounded-lg hover:bg-gold/90">Add Card</button>
            </div>
          </div>
        </div>
      )}
      {showAddressModal && editingAddress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingAddress.id > 1000 ? 'Add Address' : 'Edit Address'}</h2>
              <button onClick={() => setShowAddressModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Label (Home, Office, etc.)" value={editingAddress.name} onChange={(e) => setEditingAddress({...editingAddress, name: e.target.value})} className="w-full p-3 border rounded-lg" />
              <input type="text" placeholder="Street Address" value={editingAddress.street} onChange={(e) => setEditingAddress({...editingAddress, street: e.target.value})} className="w-full p-3 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="City" value={editingAddress.city} onChange={(e) => setEditingAddress({...editingAddress, city: e.target.value})} className="w-full p-3 border rounded-lg" />
                <input type="text" placeholder="State" value={editingAddress.state} onChange={(e) => setEditingAddress({...editingAddress, state: e.target.value})} className="w-full p-3 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Zip Code" value={editingAddress.zip} onChange={(e) => setEditingAddress({...editingAddress, zip: e.target.value})} className="w-full p-3 border rounded-lg" />
                <input type="text" placeholder="Country" value={editingAddress.country} onChange={(e) => setEditingAddress({...editingAddress, country: e.target.value})} className="w-full p-3 border rounded-lg" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editingAddress.default} onChange={(e) => setEditingAddress({...editingAddress, default: e.target.checked})} className="w-4 h-4" />
                <span className="text-sm">Set as default address</span>
              </label>
              <button onClick={handleSaveAddress} className="w-full py-3 bg-gold text-white rounded-lg hover:bg-gold/90">Save Address</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
