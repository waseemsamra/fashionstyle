import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/sections/Navigation';
import Footer from '@/sections/Footer';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import Brands from '@/pages/Brands';
import BrandDetail from '@/pages/BrandDetail';
import Category from '@/pages/Category';
import NewArrivals from '@/pages/NewArrivals';
import ProductDetail from '@/pages/ProductDetail';
import Checkout from '@/pages/Checkout';
import OrderConfirmation from '@/pages/OrderConfirmation';
import Login from '@/pages/Login';
import UserDashboard from '@/pages/UserDashboard';
import AdminLogin from '@/pages/AdminLogin';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Profile from '@/pages/Profile';

function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-beige-100">
      {!isAdminRoute && !isDashboardRoute && <Navigation />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/brand/:name" element={<BrandDetail />} />
          <Route path="/category/:name" element={<Category />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/profile" element={<Profile />} />
        </Routes>
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
