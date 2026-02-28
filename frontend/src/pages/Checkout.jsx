import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Truck, ArrowLeft, Lock, ShoppingBag, Smartphone, Zap, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderApi, paymentApi } from '../lib/api';
import { formatPrice } from '../lib/currency';
import toast from 'react-hot-toast';

const methodIcons = { 'smartphone': Smartphone, 'credit-card': CreditCard, 'zap': Zap };

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '', country: 'TZ'
  });

  useEffect(() => {
    paymentApi.getMethods()
      .then(({ data }) => {
        setPaymentMethods(data.methods);
        const primary = data.methods.find(m => m.primary) || data.methods[0];
        if (primary) setSelectedMethod(primary.id);
      })
      .catch(() => {
        setPaymentMethods([{ id: 'demo', name: 'Demo', description: 'Majaribio', icon: 'zap', enabled: true }]);
        setSelectedMethod('demo');
      });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.phone) {
      toast.error('Tafadhali jaza jina na namba ya simu');
      return;
    }

    setLoading(true);
    try {
      const { data: order } = await orderApi.create({
        customer: {
          name: form.name,
          email: form.email || `${form.phone.replace(/\D/g, '')}@shophub.co.tz`,
          phone: form.phone,
          address: { street: form.address, city: form.city, state: form.state, zip: form.zip, country: form.country }
        },
        paymentMethod: selectedMethod
      });

      const { data: payment } = await paymentApi.initiate(order.id, selectedMethod, form.phone);

      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
        return;
      }

      if (payment.status === 'confirmed' || payment.provider === 'demo') {
        await clearCart();
        toast.success('Oda imewekwa na malipo yamethibitishwa!', { duration: 5000, icon: '✅' });
        navigate(`/order-confirmation/${order.id}`);
        return;
      }

      // Mobile money: USSD sent, redirect to confirmation to wait
      await clearCart();
      toast.success(payment.message || 'Angalia simu yako kuthibitisha malipo!', {
        duration: 8000,
        icon: '📱',
        style: { background: '#065f46', color: '#fff', borderRadius: '12px' }
      });
      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Imeshindwa. Jaribu tena.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Kikapu chako ni tupu</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Ongeza bidhaa kabla ya kuendelea</p>
        <Link to="/products" className="btn-primary">Tazama Bidhaa</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Endelea Kununua
        </Link>

        <h1 className="text-3xl font-bold mb-8">Kamilisha Oda</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                {/* Customer Info */}
                <div className="card p-6 space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Truck className="w-5 h-5" /> Taarifa za Mteja
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Jina Kamili *</label>
                      <input name="name" value={form.name} onChange={handleChange} className="input-field" required placeholder="Juma Hassan" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Email</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" placeholder="juma@email.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Mji</label>
                    <input name="city" value={form.city} onChange={handleChange} className="input-field" placeholder="Dar es Salaam" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Anwani</label>
                    <input name="address" value={form.address} onChange={handleChange} className="input-field" placeholder="Mtaa, Kata, Wilaya" />
                  </div>
                </div>

                {/* Payment */}
                <div className="card p-6 space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Smartphone className="w-5 h-5" /> Malipo
                  </h2>

                  {/* Phone number - THE key input */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                    <label className="block text-sm font-bold text-green-800 dark:text-green-300 mb-2">
                      📱 Namba ya Simu ya Kulipa *
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      className="input-field text-lg font-semibold !bg-white dark:!bg-gray-900"
                      required
                      placeholder="0712 345 678"
                    />
                    <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                      Utapata USSD kwenye namba hii kuthibitisha malipo. Pia utapata taarifa kupitia WhatsApp.
                    </p>
                  </div>

                  {/* Payment method selector */}
                  <div className="space-y-2">
                    {paymentMethods.map(method => {
                      const Icon = methodIcons[method.icon] || CreditCard;
                      return (
                        <label
                          key={method.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedMethod === method.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <input type="radio" name="pm" value={method.id} checked={selectedMethod === method.id} onChange={() => setSelectedMethod(method.id)} className="sr-only" />
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            selectedMethod === method.id ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{method.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{method.description}</p>
                            {method.providers && (
                              <div className="flex gap-1 mt-1">
                                {method.providers.map(p => (
                                  <span key={p} className="text-[10px] uppercase px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500">{p}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-start gap-2">
                    <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Malipo yako ni salama. Hatuhifadhi taarifa za malipo yako.
                    </p>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !form.phone || !form.name}
                  className="btn-primary w-full py-5 text-lg font-bold disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Inasubiri...
                    </span>
                  ) : (
                    <>
                      Lipa {formatPrice(cart.total)}
                      <Smartphone className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  Utapata uthibitisho kupitia WhatsApp baada ya malipo
                </p>
              </motion.div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="card p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Muhtasari wa Oda</h2>
              <div className="space-y-3 mb-4">
                {cart.items.map(item => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t border-gray-100 dark:border-gray-800 pt-4">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Jumla ndogo</span><span>{formatPrice(cart.subtotal)}</span>
                </div>
                {cart.savings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Umeokoa</span><span>-{formatPrice(cart.savings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Usafirishaji</span><span>{cart.shipping === 0 ? 'Bure' : formatPrice(cart.shipping)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Kodi</span><span>{formatPrice(cart.tax)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span>Jumla</span><span>{formatPrice(cart.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
