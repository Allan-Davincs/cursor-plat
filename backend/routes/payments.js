const express = require('express');
const router = express.Router();
const axios = require('axios');
const { orders } = require('../data/store');

router.post('/initiate', async (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  try {
    const paymentData = {
      orderId: order.id,
      amount: order.total,
      currency: 'USD',
      customer: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone
      },
      callbackUrl: `${process.env.FRONTEND_URL}/order-confirmation/${order.id}`,
      webhookUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`
    };

    if (process.env.BRIQ_API_KEY && process.env.BRIQ_API_KEY !== 'your_briq_api_key_here') {
      const response = await axios.post('https://api.briq.com/v1/payments', paymentData, {
        headers: {
          'Authorization': `Bearer ${process.env.BRIQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      return res.json({ paymentUrl: response.data.paymentUrl, paymentId: response.data.id });
    }

    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date().toISOString(),
      note: 'Payment confirmed (demo mode)'
    });
    order.updatedAt = new Date().toISOString();

    res.json({
      paymentUrl: null,
      paymentId: `PAY-${Date.now()}`,
      status: 'confirmed',
      message: 'Payment processed in demo mode',
      order
    });
  } catch (error) {
    console.error('Payment error:', error.message);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

router.post('/webhook', (req, res) => {
  const { orderId, status, paymentId } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const statusMap = { succeeded: 'confirmed', failed: 'cancelled', pending: 'pending' };
  order.status = statusMap[status] || status;
  order.statusHistory.push({
    status: order.status,
    timestamp: new Date().toISOString(),
    note: `Payment ${status} (${paymentId})`
  });
  order.updatedAt = new Date().toISOString();

  res.json({ received: true });
});

module.exports = router;
