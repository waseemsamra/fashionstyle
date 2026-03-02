import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Truck, MapPin, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orderData = { ...formData, items, totalPrice, paymentMethod };
    navigate('/order-confirmation', { state: orderData });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-gold" />
                  <h2 className="text-xl font-semibold">Delivery Address</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                  />
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Postal Code"
                    required
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                  />
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

                {paymentMethod === 'card' && (
                  <div className="space-y-4 pt-4 border-t">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="Card Number"
                      required
                      value={formData.cardNumber}
                      onChange={handleChange}
                      maxLength={16}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="cardExpiry"
                        placeholder="MM/YY"
                        required
                        value={formData.cardExpiry}
                        onChange={handleChange}
                        maxLength={5}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                      />
                      <input
                        type="text"
                        name="cardCvv"
                        placeholder="CVV"
                        required
                        value={formData.cardCvv}
                        onChange={handleChange}
                        maxLength={3}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3 max-h-64 overflow-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.name}</h3>
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
                <Button type="submit" className="w-full mt-6 bg-black hover:bg-gray-800">
                  Place Order
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
