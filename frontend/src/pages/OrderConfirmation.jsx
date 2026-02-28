import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, Clock, MessageCircle, ArrowRight, Copy } from 'lucide-react';
import { orderApi, whatsappApi } from '../lib/api';
import { formatPrice } from '../lib/currency';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await orderApi.getById(orderId);
        setOrder(data);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center"><p>Order not found</p></div>;

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Thank you for your order. We'll notify you when it ships.
          </p>
        </motion.div>

        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{order.id}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(order.id); toast.success('Copied!'); }}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <span className={`badge px-3 py-1.5 rounded-xl font-semibold ${
              order.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
            }`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          {/* Status Tracker */}
          <div className="flex items-center justify-between mb-8">
            {statusSteps.map((step, i) => (
              <div key={step.key} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    i <= currentStepIndex ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${i <= currentStepIndex ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Items */}
          <div className="space-y-3 mb-6">
            {order.items.map(item => (
              <div key={item.productId} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                </div>
                <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm border-t border-gray-100 dark:border-gray-800 pt-4">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Shipping</span><span>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Tax</span><span>{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100 dark:border-gray-800">
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/products" className="btn-primary flex-1">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 !bg-green-500 !text-white hover:!bg-green-600">
              <MessageCircle className="w-4 h-4" /> Get Updates on WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
