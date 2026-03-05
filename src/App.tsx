import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
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
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Users = lazy(() => import('@/pages/admin/Users'));
const Profile = lazy(() => import('@/pages/admin/Profile'));

function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-beige-100">
      {!isAdminRoute && !isDashboardRoute && <Navigation />}
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
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/profile" element={<Profile />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && !isDashboardRoute && <Footer />}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Layout />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
