import { toCDNUrl } from '@/utils/productImage';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Truck, MapPin, User, Mail, Phone } from 'lucide-react';
import { apiClient } from '@/services/api';
import { emailService } from '@/services/emailService';
import { API_CONFIG } from '@/config/api';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const items = cart.items;
  const totalPrice = cart.total;
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isLoading, setIsLoading] = useState(false);

  // Test email service configuration on mount
  useEffect(() => {
    emailService.testConfiguration().then(result => {
      if (result.success) {
        console.log('✅ Email service is properly configured');
      } else {
        console.warn('⚠️ Email service configuration issue:', result.error);
      }
    });
  }, []);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button onClick={() => navigate('/')}>Go Shopping</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🛒 Checkout: Starting guest checkout process...');

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const userId = formData.email.replace(/[^a-zA-Z0-9]/g, '-');

      // Step 1: Skip user check and proceed with guest checkout
      console.log('👤 Proceeding with guest checkout for:', formData.email);

      // Step 2: Create guest user account
      console.log('📝 Creating guest user account...');
      const guestUserData = {
        email: formData.email,
        name: fullName,
        role: 'customer',
        status: 'active',
        isGuest: true
      };

      try {
        await apiClient.post('/users', guestUserData);
        console.log('✅ Guest user created:', formData.email);
      } catch (err: any) {
        console.log('⚠️ User may already exist, continuing with order...');
      }

      // Step 3: Create user profile
      console.log('📝 Creating user profile...');
      try {
        await apiClient.put(`/users/${userId}/profile`, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: 'customer',
          status: 'active',
          isGuest: true
        });
        console.log('✅ User profile created');
      } catch (err: any) {
        console.log('⚠️ Profile creation may have succeeded, continuing...');
      }

      // Step 4: Create order using the Orders API
      console.log('🛒 Creating order...');
      const orderData = {
        orderNumber: `ORD-${Date.now()}`,
        userId: userId,
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: totalPrice,
        shipping: 0,
        tax: 0,
        discount: 0,
        total: totalPrice,
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        status: 'pending',
        shippingAddress: {
          name: fullName,
          line1: formData.address,
          city: formData.city,
          state: 'N/A',
          postalCode: formData.postalCode,
          country: 'UAE',
          phone: formData.phone
        },
        billingAddress: {
          name: fullName,
          line1: formData.address,
          city: formData.city,
          state: 'N/A',
          postalCode: formData.postalCode,
          country: 'UAE',
          phone: formData.phone
        },
        isGuestOrder: true
      };

      console.log('🛒 Sending order to Orders API...');
      
      // Send to actual Orders API
      const ordersResponse = await fetch(`${API_CONFIG.ordersApi}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!ordersResponse.ok) {
        throw new Error(`Orders API error: ${ordersResponse.status}`);
      }

      const result = await ordersResponse.json();
      console.log('✅ Order created in Orders API:', result.orderId || result.id);

      // Step 7: Send order confirmation email
      console.log('📧 Sending order confirmation email...');
      try {
        const emailResult = await emailService.sendOrderConfirmation({
          orderId: result.orderId,
          customerName: fullName,
          email: formData.email,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image
          })),
          total: totalPrice,
          shippingAddress: {
            fullName: fullName,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            phone: formData.phone
          },
          paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'
        });

        if (emailResult.success) {
          console.log('✅ Order confirmation email sent:', emailResult.messageId);
        } else {
          console.warn('⚠️ Failed to send order confirmation email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
      }

      // Step 8: Clear cart and store order info
      localStorage.removeItem('cart');

      localStorage.setItem('lastOrder', JSON.stringify({
        orderId: result.orderId,
        email: formData.email,
        items: orderData.items,
        totalPrice: result.total || orderData.total,
        fullName: fullName,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        phone: formData.phone,
        paymentMethod: orderData.paymentMethod,
        isGuest: true
      }));

      // Step 8: Navigate to confirmation
      navigate(`/order-confirmation/${result.orderId}`, {
        state: {
          email: formData.email,
          isGuest: true,
          orderData: {
            orderId: result.orderId,
            email: formData.email,
            items: orderData.items,
            totalPrice: result.total || orderData.total,
            fullName: fullName,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            phone: formData.phone,
            paymentMethod: orderData.paymentMethod,
            isGuest: true
          }
        }
      });

    } catch (error: any) {
      console.error('❌ Checkout failed:', error);
      alert(`Order failed: ${error.response?.data?.message || error.message}`);
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shopping
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Guest Checkout</h1>
          <p className="text-gray-600">
            Fill in your details to complete your order. We'll create a guest account for you and send login credentials to your email.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gold" />
                  <h2 className="text-xl font-semibold">Personal Information</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      We'll send your login credentials to this email
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-gold" />
                  <h2 className="text-xl font-semibold">Delivery Address</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Main Street, Apt 4B"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="New York"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        placeholder="10001"
                        required
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-gold" />
                  <h2 className="text-xl font-semibold">Payment Method</h2>
                </div>
                <div className="space-y-3 mb-4">
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                    paymentMethod === 'card' ? 'border-gold bg-gold/5' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">Credit/Debit Card</span>
                  </label>
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                    paymentMethod === 'cod' ? 'border-gold bg-gold/5' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <Truck className="w-5 h-5" />
                    <span className="font-medium">Cash on Delivery</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3 max-h-64 overflow-auto">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={toCDNUrl(item.image)}
                        alt={item.name}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        {item.selectedSize && <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>}
                        {item.selectedColor && <p className="text-xs text-gray-500">Colour: {item.selectedColor}</p>}
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="font-semibold text-sm">${item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Guest Checkout Info */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <Mail className="inline h-3 w-3 mr-1" />
                    A guest account will be created with your email. Login credentials will be sent after order placement.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-4 bg-black hover:bg-gray-800"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Place Order'}
                </Button>

                <p className="text-xs text-center text-gray-500 mt-3">
                  By placing this order, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
