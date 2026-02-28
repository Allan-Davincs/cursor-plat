import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Truck, ArrowLeft, Lock, ShoppingBag, Smartphone, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderApi, paymentApi } from '../lib/api';
import { formatPrice } from '../lib/currency';
import toast from 'react-hot-toast';

const methodIcons = {
  'credit-card': CreditCard,
  'smartphone': Smartphone,
  'zap': Zap
};

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '', country: 'TZ'
  });

  useEffect(() => {
    paymentApi.getMethods()
      .then(({ data }) => {
        setPaymentMethods(data.methods);
        if (data.methods.length > 0) setSelectedMethod(data.methods[0].id);
      })
      .catch(() => {
        setPaymentMethods([{ id: 'demo', name: 'Demo Payment', description: 'Simulated payment', icon: 'zap', enabled: true }]);
        setSelectedMethod('demo');
      });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.name || !form.email || !form.phone) {
        toast.error('Please fill in all required fields');
        return;
      }
      setMobilePhone(form.phone);
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const { data: order } = await orderApi.create({
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: { street: form.address, city: form.city, state: form.state, zip: form.zip, country: form.country }
        },
        paymentMethod: selectedMethod
      });

      const phone = selectedMethod === 'snippe-mobile' ? mobilePhone : undefined;
      const { data: payment } = await paymentApi.initiate(order.id, selectedMethod, phone);

      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
        return;
      }

      if (payment.status === 'confirmed' || payment.provider === 'demo') {
        await clearCart();
        toast.success('Order placed successfully!', { duration: 5000 });
        navigate(`/order-confirmation/${order.id}`);
        return;
      }

      if (payment.type === 'mobile') {
        toast.success(payment.message || 'Check your phone for the payment prompt', { duration: 8000, icon: '📱' });
        await clearCart();
        navigate(`/order-confirmation/${order.id}`);
        return;
      }

      await clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Add some items before checking out</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-10">
          {['Information', 'Payment'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
              }`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === i + 1 ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>{label}</span>
              {i < 1 && <div className="w-20 h-0.5 bg-gray-200 dark:bg-gray-800 mx-2" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 space-y-5">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Truck className="w-5 h-5" /> Shipping Information</h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                      <input name="name" value={form.name} onChange={handleChange} className="input-field" required placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Email *</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" required placeholder="john@example.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone * <span className="text-gray-400 font-normal">(used for mobile money & WhatsApp updates)</span></label>
                    <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="input-field" required placeholder="+255 6XX XXX XXX" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Street Address</label>
                    <input name="address" value={form.address} onChange={handleChange} className="input-field" placeholder="123 Commerce St" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">City</label>
                      <input name="city" value={form.city} onChange={handleChange} className="input-field" placeholder="Dar es Salaam" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Region</label>
                      <input name="state" value={form.state} onChange={handleChange} className="input-field" placeholder="DSM" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Postal Code</label>
                      <input name="zip" value={form.zip} onChange={handleChange} className="input-field" placeholder="14101" />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full py-4 mt-4">
                    Continue to Payment
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 space-y-5">
                  <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard className="w-5 h-5" /> Payment Method</h2>

                  <div className="space-y-3">
                    {paymentMethods.map(method => {
                      const Icon = methodIcons[method.icon] || CreditCard;
                      return (
                        <label
                          key={method.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedMethod === method.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={selectedMethod === method.id}
                            onChange={() => setSelectedMethod(method.id)}
                            className="sr-only"
                          />
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedMethod === method.id
                              ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{method.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{method.description}</p>
                            {method.providers && (
                              <div className="flex gap-1.5 mt-1.5">
                                {method.providers.map(p => (
                                  <span key={p} className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] uppercase px-2 py-0.5 rounded-md">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedMethod === method.id ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {selectedMethod === 'snippe-mobile' && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Mobile Money Number</label>
                      <input
                        type="tel"
                        value={mobilePhone}
                        onChange={e => setMobilePhone(e.target.value)}
                        className="input-field"
                        placeholder="+255 6XX XXX XXX"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        You'll receive a USSD prompt on this number to confirm payment
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                    <p className="text-sm text-primary-700 dark:text-primary-300">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Your payment is processed securely. We never store your payment details.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <h3 className="font-semibold mb-2">Shipping to:</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {form.name}<br />
                      {form.email}<br />
                      {form.phone}<br />
                      {form.address && <>{form.address}, {form.city}, {form.state} {form.zip}<br /></>}
                    </p>
                    <button type="button" onClick={() => setStep(1)} className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-2 hover:underline">
                      Edit
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-4">
                      Back
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1 py-4">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        `Pay ${formatPrice(cart.total)}`
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="card p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cart.items.map(item => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t border-gray-100 dark:border-gray-800 pt-4">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span>
                </div>
                {cart.savings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings</span><span>-{formatPrice(cart.savings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Shipping</span><span>{cart.shipping === 0 ? 'Free' : formatPrice(cart.shipping)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Tax</span><span>{formatPrice(cart.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span>Total</span><span>{formatPrice(cart.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
