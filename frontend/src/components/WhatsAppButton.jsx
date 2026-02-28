import { useState, useEffect } from 'react';
import { MessageCircle, X, Phone, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { whatsappApi } from '../lib/api';

export default function WhatsAppButton({ variant = 'fab', productId = null }) {
  const [whatsappData, setWhatsappData] = useState(null);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (productId) {
          const { data } = await whatsappApi.getProductLink(productId);
          setWhatsappData(data);
        } else {
          const { data } = await whatsappApi.getQrData();
          setWhatsappData(data);
        }
      } catch {
        // Silent fail
      }
    };
    fetchData();
  }, [productId]);

  if (!whatsappData) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(whatsappData.url)}&color=25D366&bgcolor=FFFFFF`;

  if (variant === 'icon') {
    return (
      <button
        onClick={() => setShowQr(true)}
        className="p-2.5 rounded-xl text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
        <AnimatePresence>
          {showQr && <QRModal qrUrl={qrUrl} url={whatsappData.url} phone={whatsappData.phone} onClose={() => setShowQr(false)} />}
        </AnimatePresence>
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-3">
        <a
          href={whatsappData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 active:scale-[0.98] transition-all shadow-lg shadow-green-500/25"
        >
          <MessageCircle className="w-5 h-5" />
          Uliza kwenye WhatsApp
        </a>
        <button
          onClick={() => setShowQr(true)}
          className="inline-flex items-center gap-2 px-4 py-3 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 font-semibold rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
        >
          <QrCode className="w-5 h-5" />
          QR Code
        </button>
        <AnimatePresence>
          {showQr && <QRModal qrUrl={qrUrl} url={whatsappData.url} phone={whatsappData.phone} onClose={() => setShowQr(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className="relative">
        <a
          href={whatsappData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 text-white font-bold text-lg rounded-2xl hover:bg-green-600 active:scale-[0.98] transition-all shadow-xl shadow-green-500/30"
        >
          <MessageCircle className="w-6 h-6" />
          Nunua kupitia WhatsApp
        </a>
      </div>
    );
  }

  // FAB (default)
  return (
    <>
      <motion.div
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
        className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3"
      >
        <AnimatePresence>
          {!showQr && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 2 }}
              className="bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 shadow-xl border border-gray-100 dark:border-gray-800 max-w-[220px]"
            >
              <p className="text-sm font-medium">Habari! 👋</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tuandikie WhatsApp tukusaidie!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowQr(true)}
          className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 hover:bg-green-600 hover:scale-110 active:scale-95 transition-all ring-4 ring-green-500/20"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      </motion.div>

      <AnimatePresence>
        {showQr && <QRModal qrUrl={qrUrl} url={whatsappData.url} phone={whatsappData.phone} onClose={() => setShowQr(false)} />}
      </AnimatePresence>
    </>
  );
}

function QRModal({ qrUrl, url, phone, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">ShopHub WhatsApp</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tuko tayari kukusaidia!</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 mb-6 text-center">
          <img src={qrUrl} alt="WhatsApp QR Code" className="w-52 h-52 mx-auto rounded-xl shadow-sm" />
          <p className="text-xs text-green-700 dark:text-green-400 mt-3 font-medium">Scan na simu yako kufungua WhatsApp</p>
        </div>

        <div className="space-y-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full bg-green-500 hover:bg-green-600 shadow-green-500/25 py-3.5"
          >
            <MessageCircle className="w-5 h-5" />
            Fungua WhatsApp
          </a>

          {phone && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Phone className="w-4 h-4" />
              <span>+{phone}</span>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Andika <span className="font-bold text-gray-700 dark:text-gray-300">"hi"</span> kuanza mazungumzo. Tunaweza kukusaidia na bidhaa, oda, na zaidi!
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
