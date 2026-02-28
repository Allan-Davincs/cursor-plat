const express = require('express');
const router = express.Router();
const axios = require('axios');
const { orders, carts, products, generateOrderId } = require('../data/store');

router.post('/', async (req, res) => {
  const { customer, paymentMethod = 'auto', sessionId = 'default' } = req.body;

  if (!customer || !customer.name || !customer.email || !customer.phone) {
    return res.status(400).json({ error: 'Customer name, email, and phone are required' });
  }

  const cart = carts[sessionId];
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  for (const item of cart.items) {
    const product = products.find(p => p.id === item.productId);
    if (product) product.stock -= item.quantity;
  }

  const order = {
    id: generateOrderId(),
    customer,
    items: [...cart.items],
    subtotal: Math.round(subtotal * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    paymentMethod,
    paymentProvider: null,
    paymentId: null,
    status: 'pending',
    statusHistory: [
      { status: 'pending', timestamp: new Date().toISOString(), note: 'Order placed' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.push(order);
  cart.items = [];

  try {
    await axios.post(`http://localhost:${process.env.PORT || 5000}/api/v1/whatsapp/send-order-notification`, {
      orderId: order.id
    }, { timeout: 5000 });
  } catch {
    // Non-blocking; notification failure shouldn't break order creation
  }

  res.status(201).json(order);
});

router.get('/:orderId', (req, res) => {
  const order = orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.get('/:orderId/track', (req, res) => {
  const order = orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({
    orderId: order.id,
    status: order.status,
    statusHistory: order.statusHistory,
    estimatedDelivery: getEstimatedDelivery(order.status)
  });
});

function getEstimatedDelivery(status) {
  const days = { pending: 7, confirmed: 6, processing: 5, shipped: 3, delivered: 0 };
  const d = new Date();
  d.setDate(d.getDate() + (days[status] || 7));
  return d.toISOString().split('T')[0];
}

module.exports = router;
