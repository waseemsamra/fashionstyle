import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut, updatePassword } from 'aws-amplify/auth';
import { User, Package, Heart, Wallet, CreditCard, LogOut, Lock, X, Trash2, MapPin, Edit } from 'lucide-react';
import { api } from '../services/api';

export default function UserDashboard() {
  const navigate = useNavigate();
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
    whatsapp: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [orders] = useState([
    { id: 'ORD-001', date: '2024-03-15', items: 3, total: 299, status: 'Delivered' },
    { id: 'ORD-002', date: '2024-03-10', items: 1, total: 89, status: 'Shipped' },
    { id: 'ORD-003', date: '2024-03-05', items: 2, total: 178, status: 'Processing' },
  ]);

  const [wishlist] = useState([
    { id: 1, name: 'Embroidered Lawn Suit', price: 89, image: '/product-1.jpg', brand: 'Al Karam' },
    { id: 2, name: 'Silk Lehenga Set', price: 299, image: '/product-3.jpg', brand: 'Maria B' },
  ]);

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

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      await loadProfile(currentUser.userId);
      setLoading(false);
    } catch {
      navigate('/');
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const data = await api.getUserProfile(userId);
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.log('No profile found, using defaults');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.updateUserProfile(user.userId, profile);
      setEditMode(false);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
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
                      <input type="email" value={user?.signInDetails?.loginId} disabled className="w-full p-3 border rounded-lg bg-gray-50" />
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
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold">My Orders</h2>
                </div>
                <div className="divide-y">
                  {orders.map(order => (
                    <div key={order.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{order.id}</p>
                          <p className="text-sm text-gray-600">{order.date} • {order.items} items</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${order.total}</p>
                          <span className={`text-xs px-3 py-1 rounded-full ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{order.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold">My Wishlist</h2>
                </div>
                <div className="grid grid-cols-2 gap-6 p-6">
                  {wishlist.map(item => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <img src={item.image} alt={item.name} className="w-full h-48 object-contain rounded-lg mb-3" />
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.brand}</p>
                      <p className="text-lg font-bold text-gold mt-2">${item.price}</p>
                      <button className="w-full mt-3 py-2 bg-gold text-white rounded-lg hover:bg-gold/90">
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
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
