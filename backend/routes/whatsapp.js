const express = require('express');
const router = express.Router();
const { products, orders } = require('../data/store');

router.get('/qr-data', (req, res) => {
  const phone = (process.env.WHATSAPP_PHONE || '+1234567890').replace(/[^0-9]/g, '');
  const message = encodeURIComponent(
    "Hi! I'm interested in shopping with you. Can you help me find some products?"
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  res.json({
    url: whatsappUrl,
    phone: process.env.WHATSAPP_PHONE || '+1234567890',
    qrValue: whatsappUrl
  });
});

router.get('/product-link/:productId', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.productId));
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const phone = (process.env.WHATSAPP_PHONE || '+1234567890').replace(/[^0-9]/g, '');
  const message = encodeURIComponent(
    `Hi! I'm interested in: *${product.name}* (${product.price} USD)\n\nCan I get more details?`
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  res.json({ url: whatsappUrl, product: { id: product.id, name: product.name, price: product.price } });
});

router.get('/order-update/:orderId', (req, res) => {
  const order = orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const phone = order.customer.phone.replace(/[^0-9]/g, '');
  const statusEmoji = {
    pending: '🕐', confirmed: '✅', processing: '📦', shipped: '🚚', delivered: '🎉'
  };
  const message = encodeURIComponent(
    `${statusEmoji[order.status] || '📋'} Order Update: *${order.id}*\n\nStatus: ${order.status.toUpperCase()}\nTotal: $${order.total}\n\nThank you for shopping with us!`
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  res.json({ url: whatsappUrl, order: { id: order.id, status: order.status } });
});

module.exports = router;
