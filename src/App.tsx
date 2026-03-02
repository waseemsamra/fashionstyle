import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="min-h-screen bg-beige-100">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/brand/:name" element={<BrandDetail />} />
              <Route path="/category/:name" element={<Category />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="bottom-right" richColors />
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
