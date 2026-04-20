import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { useQueryClient } from '@tanstack/react-query';
import { CartProvider } from '@/hooks/useCart';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { CartSync } from '@/components/cart/CartSync';
import AIChat from '@/components/AIChat';
import { userService } from '@/services/userService';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import AdminLayout from '@/components/admin/AdminLayout';
import { brandService } from '@/services/brandService';
import { adminService } from '@/services/adminService';
import { prefetchReviews } from '@/services/reviewsService';
import type { Period } from '@/services/adminService';

// Route-based code splitting via dynamic imports
const Home = lazy(() => import('@/pages/Home'));
const Shop = lazy(() => import('@/pages/shop/Shop'));
const Brands = lazy(() => import('@/pages/shop/Brands'));
const BrandDetail = lazy(() => import('@/pages/shop/BrandDetail'));
const Category = lazy(() => import('@/pages/shop/Category'));
const NewArrivalsPage = lazy(() => import('@/pages/shop/NewArrivalsPage'));
const FeaturedCollectionPage = lazy(() => import('@/pages/shop/FeaturedCollection'));
const ProductDetail = lazy(() => import('@/pages/shop/ProductDetail'));
const Checkout = lazy(() => import('@/pages/checkout/Checkout'));
const OrderConfirmation = lazy(() => import('@/pages/checkout/OrderConfirmation'));
const Signup = lazy(() => import('@/pages/user/Signup'));
const ForgotPassword = lazy(() => import('@/pages/user/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/user/ResetPassword'));
const ConfirmEmail = lazy(() => import('@/pages/user/ConfirmEmail'));
const Login = lazy(() => import('@/pages/user/Login'));
const UserDashboard = lazy(() => import('@/pages/user/UserDashboard'));
const OrderDetails = lazy(() => import('@/pages/user/OrderDetails'));
const VirtualTryOnPage = lazy(() => import('@/pages/VirtualTryOnPage'));
const OccasionShoppingPage = lazy(() => import('@/pages/OccasionShoppingPage'));
const SearchPage = lazy(() => import('@/pages/search/SearchPage'));
const WishlistPage = lazy(() => import('@/pages/wishlist/WishlistPage'));
const ProfilePage = lazy(() => import('@/components/profile/ProfilePage'));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminBrands = lazy(() => import('@/pages/admin/AdminBrands'));
const FeaturedCollection = lazy(() => import('@/pages/admin/FeaturedCollection'));
const WeddingTalesCMS = lazy(() => import('@/pages/admin/WeddingTalesCMS'));
const DesignersDiscountCMS = lazy(() => import('@/pages/admin/DesignersDiscountCMS'));
const DesignersDiscount = lazy(() => import('@/pages/shop/DesignersDiscount'));
const Users = lazy(() => import('@/pages/admin/Users'));
const Profile = lazy(() => import('@/pages/admin/Profile'));
const AdminOrders = lazy(() => import('@/pages/admin/Orders'));
const AdminOrderDetails = lazy(() => import('@/pages/admin/OrderDetails'));
const BulkProductUpload = lazy(() => import('@/pages/admin/BulkProductUpload'));
const Settings = lazy(() => import('@/pages/admin/Settings'));
const DeliveryManagement = lazy(() => import('@/pages/admin/DeliveryManagement'));
const AdminVendors = lazy(() => import('@/pages/admin/AdminVendors'));
const VendorDetail = lazy(() => import('@/pages/admin/VendorDetail'));
const SummerSale = lazy(() => import('@/pages/admin/SummerSale'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));const AdminNewArrivals = lazy(() => import('@/pages/admin/NewArrivals'));
function Layout() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  // Show navigation on dashboard now
  const isAuthOnlyRoute = location.pathname === '/login' || location.pathname === '/admin/login';

  // Prefetch user data when user is authenticated
  useEffect(() => {
    if (user?.id) {
      console.log('👤 Prefetching user data...');

      // Prefetch user profile
      queryClient.prefetchQuery({
        queryKey: ['user-profile', user.id],
        queryFn: async () => {
          try {
            const profile = await userService.getProfile(user.id);
            console.log('✅ Prefetched user profile');
            return profile;
          } catch (error) {
            console.warn('⚠️ Failed to prefetch profile:', error);
            return null;
          }
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
      });

      // Prefetch user addresses
      queryClient.prefetchQuery({
        queryKey: ['user-addresses', user.id],
        queryFn: async () => {
          try {
            const addresses = await userService.getAddresses(user.id);
            console.log('✅ Prefetched', addresses.length, 'addresses');
            return addresses;
          } catch (error) {
            console.warn('⚠️ Failed to prefetch addresses:', error);
            return [];
          }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });

      // Prefetch user cart
      queryClient.prefetchQuery({
        queryKey: ['cart', user.id],
        queryFn: async () => {
          try {
            const { cartService } = await import('@/services/cartService');
            const cart = await cartService.getCart(user.id);
            console.log('✅ Prefetched cart with', cart.itemCount, 'items');
            return cart;
          } catch (error) {
            console.warn('⚠️ Failed to prefetch cart:', error);
            return { items: [], total: 0, itemCount: 0 };
          }
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
      
      // Prefetch user orders
      queryClient.prefetchQuery({
        queryKey: ['user-orders', user.id],
        queryFn: async () => {
          try {
            const orders = await userService.getOrders(user.id);
            console.log('✅ Prefetched', orders.length, 'orders');
            return orders;
          } catch (error) {
            console.warn('⚠️ Failed to prefetch orders:', error);
            return [];
          }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });

      // Prefetch last 30 days orders for order history page
      const last30Days = {
        dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        dateTo: new Date().toISOString(),
      };

      queryClient.prefetchInfiniteQuery({
        queryKey: ['orders', user.id, last30Days],
        queryFn: async () => {
          try {
            const { ordersService } = await import('@/services/ordersService');
            const data = await ordersService.getUserOrders(user.id, last30Days);
            console.log('✅ Prefetched orders from last 30 days');

            // Calculate and cache order stats
            if (data.orders && data.orders.length > 0) {
              const stats = calculateOrderStats(data.orders);
              queryClient.setQueryData(['order-stats', user.id], stats);
              console.log('✅ Cached order stats');
            }

            return data;
          } catch (error) {
            console.warn('⚠️ Failed to prefetch recent orders:', error);
            return { orders: [], total: 0, totalPages: 1, currentPage: 1 };
          }
        },
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  }, [user?.id, queryClient]);

  // Helper function to calculate order stats
  const calculateOrderStats = (orders: any[]) => {
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      processingOrders: orders.filter(o => o.status === 'processing').length,
      shippedOrders: orders.filter(o => o.status === 'shipped').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      returnedOrders: orders.filter(o => o.status === 'returned').length,
      monthlySpending: [] as Array<{ month: string; amount: number }>,
    };

    // Calculate monthly spending
    const monthMap = new Map<string, number>();
    orders.forEach(order => {
      const month = new Date(order.createdAt).toISOString().slice(0, 7); // YYYY-MM
      monthMap.set(month, (monthMap.get(month) || 0) + order.total);
    });

    stats.monthlySpending = Array.from(monthMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return stats;
  };

  // Prefetch popular brands in background on app mount
  useEffect(() => {
    console.log('🚀 Prefetching popular brands...');
    queryClient.prefetchQuery({
      queryKey: ['brands', { featured: true, limit: 10 }],
      queryFn: async () => {
        try {
          const brands = await brandService.getAllBrands();
          console.log('✅ Prefetched', brands.length, 'featured brands');
          return brands;
        } catch (error) {
          console.warn('⚠️ Failed to prefetch brands:', error);
          return [];
        }
      },
      staleTime: 60 * 60 * 1000, // 1 hour
      gcTime: 2 * 60 * 60 * 1000, // 2 hours
    });

    // Also prefetch all brands (non-featured)
    queryClient.prefetchQuery({
      queryKey: ['brands', {}],
      queryFn: async () => {
        try {
          const brands = await brandService.getAllBrands();
          console.log('✅ Prefetched all', brands.length, 'brands');
          return brands;
        } catch (error) {
          console.warn('⚠️ Failed to prefetch all brands:', error);
          return [];
        }
      },
      staleTime: 60 * 60 * 1000, // 1 hour
      gcTime: 2 * 60 * 60 * 1000, // 2 hours
    });

    // Prefetch common admin stats periods (only for admin users)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.role === 'admin') {
      console.log('🚀 Prefetching admin stats for common periods...');
      const periods: Period[] = ['7d', '30d', '90d'];
      periods.forEach(period => {
        queryClient.prefetchQuery({
          queryKey: ['admin-stats', period],
          queryFn: async () => {
            try {
              const stats = await adminService.getStats(period);
              console.log('✅ Prefetched admin stats for', period);
              return stats;
            } catch (error) {
              console.warn('⚠️ Failed to prefetch stats for', period, ':', error);
              return null;
            }
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 30 * 60 * 1000, // 30 minutes
        });
      });
    }

    // Prefetch reviews for top products (mock product IDs for demo)
    console.log('🚀 Prefetching reviews for top products...');
    const topProductIds = ['1', '2', '3', '4', '5'];
    prefetchReviews(queryClient, topProductIds, { limit: 5, sortBy: 'helpful' });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-beige-100">
      {!isAdminRoute && !isAuthOnlyRoute && <Navigation />}
      <main>
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900" /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/brand/:name" element={<BrandDetail />} />
            <Route path="/category/:name" element={<Category />} />
            <Route path="/designers-discount" element={<DesignersDiscount />} />
            <Route path="/new-arrivals" element={<NewArrivalsPage />} />
            <Route path="/featured-collection" element={<FeaturedCollectionPage />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
            <Route path="/order-confirmation/:orderId" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/orders/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
            <Route path="/try-on" element={<VirtualTryOnPage />} />
            <Route path="/shop-by-occasion" element={<OccasionShoppingPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard minimal />} />
              <Route path="dashboard" element={<Dashboard minimal />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="brands" element={<AdminBrands />} />
              <Route path="featured" element={<FeaturedCollection />} />
              <Route path="wedding-tales" element={<WeddingTalesCMS />} />
              <Route path="designers-discount" element={<DesignersDiscountCMS />} />
              <Route path="users" element={<Users />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:orderId" element={<AdminOrderDetails />} />
              <Route path="delivery" element={<DeliveryManagement />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/bulk-upload" element={<BulkProductUpload />} />
              <Route path="vendors" element={<AdminVendors />} />
              <Route path="vendors/:id" element={<VendorDetail />} />
              <Route path="summer-sale" element={<SummerSale />} />
              <Route path="new-arrivals" element={<AdminNewArrivals />} />
              <Route path="categories" element={<AdminCategories />} />            </Route>
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && !isAuthOnlyRoute && <Footer />}
      <Toaster position="bottom-right" richColors />
      <CartSync />
      <AIChat />
    </div>
  );
}

function App() {
  useEffect(() => {
    // Handle authentication state restoration on app startup
    const checkAuthState = async () => {
      try {
        await getCurrentUser();
        // User is authenticated, no action needed
      } catch (error: any) {
        // Handle authentication session issues
        if (error.name === 'UserUnAuthenticatedException' ||
            error.message?.includes('already') ||
            error.message?.includes('session') ||
            error.message?.includes('signed in')) {
          
          // DON'T clear tokens on admin routes!
          const isAdminRoute = window.location.pathname.includes('/admin');
          if (isAdminRoute) {
            console.log('🛡️ Admin route - preserving admin tokens');
            return; // Don't clear admin tokens!
          }
          
          // Clear any corrupted authentication data from localStorage
          try {
            // Clear Amplify-specific localStorage keys
            const keysToRemove = Object.keys(localStorage).filter(key =>
              key.startsWith('CognitoIdentityServiceProvider') ||
              key.startsWith('aws-amplify') ||
              key.includes('amplify')
            );
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Also try to sign out globally
            await signOut({ global: true });
          } catch {
            // Ignore cleanup errors
          }
        }
        // This is normal and expected - don't show error to user
        console.log('Authentication session cleared and reset');
      }
    };

    checkAuthState();
  }, []);

  return (
    <BrowserRouter>
      <CartProvider>
        <Layout />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
// Production Ready
