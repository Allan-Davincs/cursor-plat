import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
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

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappData.url)}`;

  if (variant === 'icon') {
    return (
      <button
        onClick={() => setShowQr(true)}
        className="p-2.5 rounded-xl text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
        <AnimatePresence>
          {showQr && <QRModal qrUrl={qrUrl} url={whatsappData.url} onClose={() => setShowQr(false)} />}
        </AnimatePresence>
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <a
        href={whatsappData.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 active:scale-[0.98] transition-all shadow-lg shadow-green-500/25"
      >
        <MessageCircle className="w-4 h-4" />
        Ask on WhatsApp
      </a>
    );
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        onClick={() => setShowQr(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 hover:bg-green-600 hover:scale-110 active:scale-95 transition-all"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {showQr && <QRModal qrUrl={qrUrl} url={whatsappData.url} onClose={() => setShowQr(false)} />}
      </AnimatePresence>
    </>
  );
}

function QRModal({ qrUrl, url, onClose }) {
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
        className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Chat with us!</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-6">
          <img src={qrUrl} alt="WhatsApp QR Code" className="w-48 h-48 mx-auto rounded-xl" />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Scan the QR code or click below to chat
        </p>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full bg-green-500 hover:bg-green-600 shadow-green-500/25"
        >
          <MessageCircle className="w-5 h-5" />
          Open WhatsApp
        </a>
      </motion.div>
    </motion.div>
  );
}
