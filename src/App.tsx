import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/sections/Navigation';
import Footer from '@/sections/Footer';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import Category from '@/pages/Category';
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
              <Route path="/category/:name" element={<Category />} />
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
