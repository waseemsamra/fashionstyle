import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Package, 
  Heart, 
  Wallet, 
  CreditCard, 
  LogOut, 
  MapPin, 
  ShoppingBag,
  Settings,
  Bell,
  ChevronRight,
  Clock,
  CheckCircle,
  Truck,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, useUserAddresses, useUserOrders, useUserPaymentMethods } from '@/hooks/useUserProfile';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use the working hooks with AuthContext
  const { data: profile } = useUserProfile();
  const { data: addresses } = useUserAddresses();
  const { data: orders } = useUserOrders();
  const { data: paymentMethods } = useUserPaymentMethods();
  const { data: wishlistItems } = useWishlist();
  const { cart } = useCart();

  // Debug addresses when tab changes
  useEffect(() => {
    if (activeTab === 'addresses') {
      console.log('🏠 Addresses Tab Debug:', { 
        addresses, 
        addressesLength: addresses?.length, 
        addressesType: typeof addresses,
        userEmail: user?.email 
      });
    }
  }, [activeTab, addresses, user?.email]);

  // Calculate statistics
  const totalOrders = orders?.length || 0;
  const totalSpent = orders?.reduce((sum: number, order: any) => {
    return sum + (order.totalPrice || order.total || 0);
  }, 0) || 0;
  const pendingOrders = orders?.filter((order: any) => 
    order.status === 'pending' || order.status === 'processing'
  ).length || 0;
  const wishlistCount = wishlistItems?.length || 0;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-beige-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brown-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
              <span className="text-sm text-gray-500">Welcome back, {user.name || user.email?.split('@')[0]}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                <Bell className="w-5 h-5" />
                {pendingOrders > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingOrders}
                  </span>
                )}
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Wishlist</p>
                <p className="text-2xl font-bold text-gray-900">{wishlistCount}</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-lg">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Cart Items</p>
                <p className="text-2xl font-bold text-gray-900">{cart?.items?.length || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8 border border-gray-100">
          <div className="flex space-x-8 p-1">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'orders', label: 'Orders', icon: Package },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'addresses', label: 'Addresses', icon: MapPin },
              { id: 'payment', label: 'Payment Methods', icon: CreditCard },
              { id: 'wishlist', label: 'Wishlist', icon: Heart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brown-100 text-brown-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Account Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="font-medium">{profile?.name || user.name || 'Not set'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="font-medium">{profile?.phone || 'Not set'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Member Since</p>
                    <p className="font-medium">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Recent Orders
                </h2>
                {orders?.slice(0, 3).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Package className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{order.status}</span>
                      </span>
                      <span className="font-medium">${(order.totalPrice || order.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                {(!orders || orders.length === 0) && (
                  <p className="text-gray-500 text-center py-8">No orders yet</p>
                )}
              </div>

              <div className="flex justify-center">
                <Link
                  to="/orders"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors"
                >
                  <span>View All Orders</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-lg font-semibold mb-6">Order History</h2>
              {orders?.map((order: any) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Order #{order.id}</h3>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{order.status}</span>
                      </span>
                      <span className="font-medium text-lg">${(order.totalPrice || order.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {order.items?.length || 0} items
                    </div>
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-brown-600 hover:text-brown-700 font-medium text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
              {(!orders || orders.length === 0) && (
                <p className="text-gray-500 text-center py-8">No orders found</p>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
              <div className="max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={profile?.name || user.name || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profile?.phone || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={profile?.dateOfBirth || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                      readOnly
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/profile"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div>
              <h2 className="text-lg font-semibold mb-6">Shipping Addresses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses?.map((address: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-gray-600" />
                        <h3 className="font-medium">
                          {address.isDefault && 'Default '}Address
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>{address.city}, {address.state} {address.postalCode}</p>
                      <p>{address.country}</p>
                      <p>{address.phone}</p>
                    </div>
                  </div>
                ))}
                {(!addresses || addresses.length === 0) && (
                  <div className="col-span-2 text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No addresses saved</p>
                    <p className="text-sm text-gray-400">Debug: Addresses is {addresses ? 'empty array' : 'undefined/null'}</p>
                    <Link
                      to="/profile"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Add Address</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payment' && (
            <div>
              <h2 className="text-lg font-semibold mb-6">Payment Methods</h2>
              <div className="space-y-4">
                {paymentMethods?.map((method: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {method.type} ending in {method.last4}
                        </p>
                        <p className="text-sm text-gray-500">Expires {method.expiryMonth}/{method.expiryYear}</p>
                      </div>
                    </div>
                    {method.isDefault && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                ))}
                {(!paymentMethods || paymentMethods.length === 0) && (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No payment methods saved</p>
                    <Link
                      to="/profile"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Add Payment Method</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div>
              <h2 className="text-lg font-semibold mb-6">My Wishlist</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems?.map((item: any) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={item.image || '/api/placeholder/300/200'}
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-medium mb-2">{item.name}</h3>
                      <p className="text-lg font-bold text-brown-600 mb-4">
                        ${item.price.toFixed(2)}
                      </p>
                      <div className="flex space-x-2">
                        <Link
                          to={`/products/${item.id}`}
                          className="flex-1 text-center px-4 py-2 border border-brown-600 text-brown-600 rounded-lg hover:bg-brown-50 transition-colors"
                        >
                          View
                        </Link>
                        <button className="flex-1 px-4 py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {(!wishlistItems || wishlistItems.length === 0) && (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Start Shopping</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
