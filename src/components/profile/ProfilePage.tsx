import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, useUpdateProfile, useUserAddresses, useUserOrders } from '@/hooks/useUserProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileInfo } from './ProfileInfo';
import { AddressBook } from './AddressBook';
import { OrderHistory } from './OrderHistory';
import { PaymentMethods } from './PaymentMethods';
import { Settings } from './Settings';
import { User, MapPin, ShoppingBag, CreditCard, Settings as SettingsIcon, Camera } from 'lucide-react';

export default function ProfilePage() {
  const { logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: addresses, isLoading: addressesLoading } = useUserAddresses();
  const { isLoading: ordersLoading } = useUserOrders();
  const updateProfile = useUpdateProfile();

  if (profileLoading || addressesLoading || ordersLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden">
                {profile?.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gold" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-gold text-white p-1 rounded-full hover:bg-gold/90">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{profile?.name}</h1>
              <p className="text-gray-600">{profile?.email}</p>
              
              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div>
                  <span className="text-2xl font-bold text-gold">{profile?.stats.totalOrders}</span>
                  <span className="text-gray-600 ml-2">Orders</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gold">${profile?.stats.totalSpent}</span>
                  <span className="text-gray-600 ml-2">Total Spent</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gold">
                    {new Date(profile?.stats.memberSince || '').toLocaleDateString()}
                  </span>
                  <span className="text-gray-600 ml-2">Member Since</span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="bg-white p-1 rounded-lg shadow">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Methods
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileInfo profile={profile!} onUpdate={updateProfile.mutate} />
          </TabsContent>

          <TabsContent value="addresses">
            <AddressBook addresses={addresses || []} />
          </TabsContent>

          <TabsContent value="orders">
            <OrderHistory />
          </TabsContent>

          <TabsContent value="payment">
            <PaymentMethods />
          </TabsContent>

          <TabsContent value="settings">
            <Settings profile={profile!} _onUpdate={updateProfile.mutate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Profile Skeleton
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
              <div className="flex gap-6 mt-4">
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
