import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, Clock, MessageCircle, ArrowRight, Copy, Loader, XCircle, Smartphone } from 'lucide-react';
import { orderApi, paymentApi, whatsappApi } from '../lib/api';
import { formatPrice } from '../lib/currency';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await orderApi.getById(orderId);
        setOrder(data);

        if (data.status === 'pending' && data.paymentId) {
          setPolling(true);
        }

        try {
          const { data: wa } = await whatsappApi.getOrderUpdate(orderId);
          setWhatsappUrl(wa.url);
        } catch {}
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // Poll payment status every 5s while pending
  useEffect(() => {
    if (!polling || !order?.paymentId) return;

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await paymentApi.getStatus(order.paymentId);

        if (data.status === 'confirmed') {
          setPolling(false);
          clearInterval(pollRef.current);
          const { data: freshOrder } = await orderApi.getById(orderId);
          setOrder(freshOrder);
          toast.success('Malipo yamekamilika! Asante!', {
            duration: 6000, icon: '🎉',
            style: { background: '#065f46', color: '#fff', borderRadius: '12px', fontSize: '16px' }
          });
        } else if (data.status === 'cancelled') {
          setPolling(false);
          clearInterval(pollRef.current);
          const { data: freshOrder } = await orderApi.getById(orderId);
          setOrder(freshOrder);
          toast.error('Malipo yameshindwa. Jaribu tena.', { duration: 6000 });
        }
      } catch {}
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [polling, order?.paymentId, orderId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center"><p>Oda haijapatikana</p></div>;

  const isPending = order.status === 'pending';
  const isConfirmed = order.status === 'confirmed';
  const isCancelled = order.status === 'cancelled';

  const statusSteps = [
    { key: 'pending', label: 'Imewekwa', icon: Clock },
    { key: 'confirmed', label: 'Imethibitishwa', icon: CheckCircle },
    { key: 'processing', label: 'Inashughulikiwa', icon: Package },
    { key: 'shipped', label: 'Imetumwa', icon: Truck },
    { key: 'delivered', label: 'Imepokelewa', icon: CheckCircle },
  ];
  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-10">
          {isPending && (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
              >
                <Smartphone className="w-10 h-10 text-amber-600" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Thibitisha Malipo Kwenye Simu Yako!</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                USSD imetumwa kwa <span className="font-bold text-gray-900 dark:text-gray-100">{order.paymentPhone || order.customer.phone}</span>
              </p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm font-medium animate-pulse">
                <Loader className="w-4 h-4 animate-spin" />
                Inasubiri uthibitisho...
              </div>
            </>
          )}

          {isConfirmed && (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-green-500" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2 text-green-700 dark:text-green-400">Malipo Yamekamilika!</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Asante! Utapata taarifa kupitia WhatsApp.
              </p>
            </>
          )}

          {isCancelled && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-red-600">Malipo Yameshindwa</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Tafadhali jaribu tena au wasiliana nasi kupitia WhatsApp.
              </p>
            </>
          )}
        </motion.div>

        {/* Order card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Oda</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{order.id}</p>
                <button onClick={() => { navigator.clipboard.writeText(order.id); toast.success('Imenakiliwa!'); }}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <span className={`badge px-3 py-1.5 rounded-xl font-bold text-sm ${
              isConfirmed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              isPending ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              isCancelled ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
            }`}>
              {isPending ? '⏳ Inasubiri Malipo' : isConfirmed ? '✅ Imelipwa' : isCancelled ? '❌ Imeshindwa' : order.status}
            </span>
          </div>

          {/* Status tracker */}
          {!isCancelled && (
            <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
              {statusSteps.map((step, i) => (
                <div key={step.key} className="flex-1 flex items-center min-w-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                      i <= currentStepIndex ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                    }`}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${i <= currentStepIndex ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1.5 ${i < currentStepIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Items */}
          <div className="space-y-2 mb-4">
            {order.items.map(item => (
              <div key={item.productId} className="flex gap-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">x{item.quantity} × {formatPrice(item.price)}</p>
                </div>
                <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Jumla ndogo</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Usafirishaji</span><span>{order.shipping === 0 ? 'Bure' : formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Kodi</span><span>{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100 dark:border-gray-800">
              <span>Jumla</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-green-500 text-white font-bold text-lg rounded-2xl hover:bg-green-600 active:scale-[0.98] transition-all shadow-xl shadow-green-500/30">
              <MessageCircle className="w-6 h-6" />
              {isPending ? 'Tuandikie WhatsApp kwa Msaada' : 'Pata Taarifa Kupitia WhatsApp'}
            </a>
          )}

          {isCancelled && (
            <Link to="/checkout" className="btn-primary w-full py-4 text-center">
              Jaribu Tena Kulipa
            </Link>
          )}

          <Link to="/products" className="btn-secondary w-full py-3 text-center">
            Endelea Kununua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
