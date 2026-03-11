import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Truck, MapPin, CreditCard, Home } from 'lucide-react';

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Get order data from state or localStorage
    const stateData = location.state?.orderData || location.state;
    const storedOrder = localStorage.getItem('lastOrder');
    
    if (stateData) {
      setOrderData(stateData);
      setIsGuest(location.state?.isGuest || false);
      setIsLoading(false);
    } else if (storedOrder) {
      // Load from localStorage if state is missing (page refresh)
      const parsed = JSON.parse(storedOrder);
      setOrderData(parsed);
      setIsGuest(parsed.isGuest || false);
      setIsLoading(false);
    } else {
      // No order data, redirect to home
      console.log('❌ No order data found, redirecting to home');
      navigate('/');
    }
  }, [navigate, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return null; // Redirect happens in useEffect
  }

  const finalOrderNumber = orderData?.orderId || orderId || `ORD-${Date.now().toString().slice(-8)}`;
  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-8">Thank you for your purchase. Your order has been received.</p>
          
          <div className="bg-beige-50 rounded-lg p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Number</p>
                <p className="font-semibold text-lg">{finalOrderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Estimated Delivery</p>
                <p className="font-semibold text-lg">{estimatedDelivery}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-6 mb-8">
            {/* Delivery Address */}
            <div className="bg-white border rounded-lg p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-gold" />
                <h3 className="font-semibold text-lg">Delivery Address</h3>
              </div>
              <div className="text-gray-600 space-y-1">
                <p className="font-medium text-black">{orderData.fullName}</p>
                <p>{orderData.address}</p>
                <p>{orderData.city}, {orderData.postalCode}</p>
                <p>{orderData.phone}</p>
                <p>{orderData.email}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border rounded-lg p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-gold" />
                <h3 className="font-semibold text-lg">Payment Method</h3>
              </div>
              <p className="text-gray-600">
                {orderData.paymentMethod === 'card' 
                  ? `Card ending in ${orderData.cardNumber?.slice(-4) || '****'}`
                  : 'Cash on Delivery'}
              </p>
            </div>

            {/* Order Items */}
            <div className="bg-white border rounded-lg p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gold" />
                <h3 className="font-semibold text-lg">Order Items</h3>
              </div>
              <div className="space-y-4">
                {orderData.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.selectedSize && <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>}
                      {item.selectedColor && <p className="text-sm text-gray-500">Colour: {item.selectedColor}</p>}
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      <p className="font-semibold">${item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${orderData.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${orderData.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-blue-900">Track Your Order</p>
                <p className="text-sm text-blue-700">
                  We'll send you shipping confirmation with tracking number to {orderData.email}
                </p>
              </div>
            </div>
          </div>

          {/* Guest User Message */}
          {isGuest && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-left flex-1">
                  <p className="font-medium text-green-900">Account Created Successfully!</p>
                  <p className="text-sm text-green-700 mt-1">
                    We've sent your login credentials to <strong>{orderData.email}</strong>. 
                    You can use them to track your orders and enjoy faster checkout next time.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => {
                // Clear order data and go home
                localStorage.removeItem('lastOrder');
                navigate('/', { replace: true });
              }} 
              variant="outline"
              className="min-w-[150px]"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <Button 
              onClick={() => window.print()} 
              className="bg-black hover:bg-gray-800 min-w-[150px]"
            >
              Print Receipt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
