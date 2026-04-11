import { toCDNUrl } from '@/utils/productImage';import { useCart, useUpdateCartItem, useRemoveFromCart, useClearCart, useCartTotals } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, AlertCircle, Truck, Shield, CreditCard } from 'lucide-react';
import { useState } from 'react';

export default function CartPage() {
  const { cart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const clearCart = useClearCart();
  const totals = useCartTotals();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Redirect to login if trying to checkout without auth
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  if (isLoading) {
    return <CartSkeleton />;
  }

  if (cart.items.length === 0) {
    return <EmptyCart />;
  }

  const handleQuantityChange = (itemId: string, newQuantity: number, maxQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > maxQuantity) {
      alert(`Only ${maxQuantity} items available`);
      return;
    }
    updateItem.mutate({ itemId, quantity: newQuantity });
  };

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-8 h-8" />
            Shopping Cart ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
          </h1>
          
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <Link to={`/product/${item.productId}`} className="w-24 h-24 flex-shrink-0">
                    <img
                      src={toCDNUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <Link 
                          to={`/product/${item.productId}`}
                          className="text-lg font-medium hover:text-gold transition"
                        >
                          {item.name}
                        </Link>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold">${(item.price * item.quantity).toFixed(2)}</div>
                        <div className="text-sm text-gray-500">${item.price.toFixed(2)} each</div>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border rounded">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.maxQuantity)}
                          disabled={item.quantity <= 1}
                          className="p-2 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <span className="w-12 text-center">{item.quantity}</span>
                        
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.maxQuantity)}
                          disabled={item.quantity >= item.maxQuantity}
                          className="p-2 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem.mutate(item.id)}
                        className="text-red-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>

                    {/* Stock Warning */}
                    {item.quantity === item.maxQuantity && (
                      <p className="text-xs text-orange-500 mt-2">
                        Max quantity reached
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gold hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {totals.shipping === 0 ? 'Free' : `$${totals.shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (8%)</span>
                  <span className="font-medium">${totals.tax.toFixed(2)}</span>
                </div>

                {totals.subtotal > 100 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Free shipping applied!
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-gold">${totals.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gold text-white py-3 rounded-lg hover:bg-gold/90 transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Proceed to Checkout
                </button>

                {/* Payment Icons */}
                <div className="flex justify-center gap-2 mt-4">
                  <img src="/visa.svg" alt="Visa" className="h-6" />
                  <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
                  <img src="/amex.svg" alt="Amex" className="h-6" />
                  <img src="/paypal.svg" alt="PayPal" className="h-6" />
                </div>

                {/* Security Note */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout powered by Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-xl font-bold">Clear Cart</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove all items from your cart? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  clearCart.mutate();
                  setShowClearConfirm(false);
                }}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
              >
                Yes, Clear Cart
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Empty Cart Component
function EmptyCart() {
  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added anything to your cart yet
          </p>
          <Link
            to="/"
            className="inline-block bg-gold text-white px-8 py-3 rounded-lg hover:bg-gold/90 transition"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

// Cart Skeleton
function CartSkeleton() {
  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex gap-6">
                  <div className="w-24 h-24 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-10 bg-gray-200 rounded w-full mt-4 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
