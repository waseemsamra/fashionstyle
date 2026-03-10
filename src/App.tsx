import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { CartProvider } from '@/hooks/useCart';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';

// Route-based code splitting via dynamic imports
const Home = lazy(() => import('@/pages/Home'));
const Shop = lazy(() => import('@/pages/shop/Shop'));
const Brands = lazy(() => import('@/pages/shop/Brands'));
const BrandDetail = lazy(() => import('@/pages/shop/BrandDetail'));
const Category = lazy(() => import('@/pages/shop/Category'));
const NewArrivals = lazy(() => import('@/pages/shop/NewArrivals'));
const ProductDetail = lazy(() => import('@/pages/shop/ProductDetail'));
const Wishlist = lazy(() => import('@/pages/shop/Wishlist'));
const Checkout = lazy(() => import('@/pages/checkout/Checkout'));
const OrderConfirmation = lazy(() => import('@/pages/checkout/OrderConfirmation'));
const Login = lazy(() => import('@/pages/user/Login'));
const UserDashboard = lazy(() => import('@/pages/user/UserDashboard'));
const OrderDetails = lazy(() => import('@/pages/user/OrderDetails'));
const VirtualTryOnPage = lazy(() => import('@/pages/VirtualTryOnPage'));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Users = lazy(() => import('@/pages/admin/Users'));
const Profile = lazy(() => import('@/pages/admin/Profile'));
const AdminOrders = lazy(() => import('@/pages/admin/Orders'));

function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  // Show navigation on dashboard now
  const isAuthOnlyRoute = location.pathname === '/login' || location.pathname === '/admin/login';

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
            <Route path="/new-arrivals" element={<NewArrivals />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/dashboard/orders/:orderId" element={<OrderDetails />} />
            <Route path="/try-on" element={<VirtualTryOnPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/profile" element={<Profile />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && !isAuthOnlyRoute && <Footer />}
      <Toaster position="bottom-right" richColors />
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
