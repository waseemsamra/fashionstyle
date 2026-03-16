import { useCart, useRemoveFromCart, useCartTotals } from '@/hooks/useCart';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Trash2 } from 'lucide-react';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { cart } = useCart();
  const removeItem = useRemoveFromCart();
  const totals = useCartTotals();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Cart Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Your Cart ({cart.itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Your cart is empty</p>
            <Link
              to="/"
              onClick={onClose}
              className="inline-block bg-gold text-white px-6 py-2 rounded-lg hover:bg-gold/90 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="p-4 space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <Link
                    to={`/product/${item.productId}`}
                    onClick={onClose}
                    className="w-16 h-16 flex-shrink-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.productId}`}
                      onClick={onClose}
                      className="text-sm font-medium hover:text-gold transition line-clamp-2"
                    >
                      {item.name}
                    </Link>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.color && <span>Color: {item.color}</span>}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          (${item.price.toFixed(2)} × {item.quantity})
                        </span>
                      </div>

                      <button
                        onClick={() => removeItem.mutate(item.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>{totals.shipping === 0 ? 'Free' : `$${totals.shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-gold">${totals.total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                to="/cart"
                onClick={onClose}
                className="block w-full bg-gold text-white text-center py-2 rounded-lg hover:bg-gold/90 transition mb-2"
              >
                View Cart
              </Link>

              <Link
                to="/checkout"
                onClick={onClose}
                className="block w-full border border-gold text-gold text-center py-2 rounded-lg hover:bg-gold/10 transition"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
