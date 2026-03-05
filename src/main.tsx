import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { CartProvider } from './hooks/useCart';
import { WishlistProvider } from './hooks/useWishlist';
import './index.css';
import './config/aws-config';
import App from './App.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <WishlistProvider>
          <App />
          <Toaster />
        </WishlistProvider>
      </CartProvider>
    </QueryClientProvider>
  </StrictMode>
);
