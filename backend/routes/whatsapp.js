const express = require('express');
const router = express.Router();
const axios = require('axios');
const { products, orders } = require('../data/store');

const WHATSAPP_PHONE = process.env.WHATSAPP_PHONE || '+255675029833';
const SNIPPE_BASE = process.env.SNIPPE_BASE_URL;
const SNIPPE_KEY = process.env.SNIPPE_API_KEY;

function cleanPhone(phone) {
  return phone.replace(/[^0-9]/g, '');
}

function snippeHeaders() {
  return {
    'Authorization': `Bearer ${SNIPPE_KEY}`,
    'Content-Type': 'application/json'
  };
}

router.get('/qr-data', (req, res) => {
  const phone = cleanPhone(WHATSAPP_PHONE);
  const message = encodeURIComponent(
    "Hi! I'm interested in shopping at LuxeStore. Can you help me find some products?"
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  res.json({
    url: whatsappUrl,
    phone: WHATSAPP_PHONE,
    qrValue: whatsappUrl
  });
});

router.get('/product-link/:productId', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.productId));
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const phone = cleanPhone(WHATSAPP_PHONE);
  const message = encodeURIComponent(
    `Hi! I'm interested in: *${product.name}*\nPrice: $${product.price}\n\nCan I get more details?`
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  res.json({
    url: whatsappUrl,
    product: { id: product.id, name: product.name, price: product.price }
  });
});

router.get('/order-update/:orderId', (req, res) => {
  const order = orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const phone = cleanPhone(WHATSAPP_PHONE);
  const statusEmoji = {
    pending: '⏳', confirmed: '✅', processing: '📦', shipped: '🚚', delivered: '🎉', cancelled: '❌'
  };
  const message = encodeURIComponent(
    `${statusEmoji[order.status] || '📋'} *Order Update: ${order.id}*\n\nStatus: ${order.status.toUpperCase()}\nTotal: $${order.total}\nItems: ${order.items.length}\n\nThank you for shopping with LuxeStore!`
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  res.json({
    url: whatsappUrl,
    order: { id: order.id, status: order.status }
  });
});

router.post('/send-order-notification', async (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const customerPhone = order.customer.phone.replace(/[^0-9+]/g, '');

  const statusEmoji = {
    pending: '⏳', confirmed: '✅', processing: '📦', shipped: '🚚', delivered: '🎉'
  };

  const itemList = order.items
    .map(i => `  • ${i.name} x${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`)
    .join('\n');

  const message = `${statusEmoji[order.status] || '📋'} *LuxeStore Order Update*\n\n`
    + `Order: *${order.id}*\n`
    + `Status: *${order.status.toUpperCase()}*\n\n`
    + `📝 Items:\n${itemList}\n\n`
    + `💰 Total: *$${order.total.toFixed(2)}*\n\n`
    + `Thank you for shopping with us! Reply to this message for support.`;

  if (SNIPPE_KEY && SNIPPE_BASE) {
    try {
      const response = await axios.post(`${SNIPPE_BASE}/messages/send`, {
        to: customerPhone,
        type: 'text',
        message: message,
        metadata: { order_id: order.id }
      }, {
        headers: snippeHeaders(),
        timeout: 10000
      });

      return res.json({
        sent: true,
        provider: 'snippe',
        messageId: response.data?.data?.id || response.data?.id,
        to: customerPhone
      });
    } catch (error) {
      console.error('Snippe WhatsApp send failed:', error.response?.data || error.message);
    }
  }

  const waLink = `https://wa.me/${cleanPhone(customerPhone)}?text=${encodeURIComponent(message)}`;
  res.json({
    sent: false,
    fallback: true,
    whatsappUrl: waLink,
    message: 'Automatic WhatsApp sending not available. Use the link to send manually.'
  });
});

router.post('/send-message', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'to and message are required' });

  if (SNIPPE_KEY && SNIPPE_BASE) {
    try {
      const response = await axios.post(`${SNIPPE_BASE}/messages/send`, {
        to: to.replace(/[^0-9+]/g, ''),
        type: 'text',
        message
      }, {
        headers: snippeHeaders(),
        timeout: 10000
      });

      return res.json({
        sent: true,
        provider: 'snippe',
        messageId: response.data?.data?.id || response.data?.id
      });
    } catch (error) {
      console.error('Snippe message send failed:', error.response?.data || error.message);
    }
  }

  res.json({
    sent: false,
    fallback: true,
    whatsappUrl: `https://wa.me/${cleanPhone(to)}?text=${encodeURIComponent(message)}`,
    message: 'Automatic sending not available. Use the WhatsApp link instead.'
  });
});

router.post('/webhook', (req, res) => {
  console.log('WhatsApp webhook received:', JSON.stringify(req.body, null, 2));

  const { from, message, type } = req.body;

  if (message && from) {
    const text = (message.text || message.body || '').toLowerCase().trim();

    if (text.includes('order') || text.match(/ord-\d+/i)) {
      const orderIdMatch = text.match(/ord-(\d+)/i);
      if (orderIdMatch) {
        const order = orders.find(o => o.id === `ORD-${orderIdMatch[1]}`);
        if (order) {
          console.log(`WhatsApp order inquiry from ${from}: ${order.id} - ${order.status}`);
        }
      }
    }

    if (text === 'help' || text === 'menu') {
      console.log(`WhatsApp help request from ${from}`);
    }
  }

  res.json({ received: true });
});

module.exports = router;
