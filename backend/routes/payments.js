const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { orders } = require('../data/store');

const BRIQ_URL = process.env.BRIQ_API_URL;
const BRIQ_KEY = process.env.BRIQ_API_KEY;
const SNIPPE_URL = process.env.SNIPPE_API_URL;
const SNIPPE_KEY = process.env.SNIPPE_API_KEY;
const CURRENCY = process.env.CURRENCY || 'TZS';
const APP_NAME = process.env.APP_NAME || 'ShopHub';

function briqHeaders() {
  return {
    'Authorization': `Bearer ${BRIQ_KEY}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': uuidv4()
  };
}

function snippeHeaders() {
  return {
    'Authorization': `Bearer ${SNIPPE_KEY}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': uuidv4()
  };
}

router.get('/methods', (req, res) => {
  const methods = [];

  if (BRIQ_KEY && BRIQ_URL) {
    methods.push({
      id: 'briq',
      name: 'Briq Payment',
      description: 'Pay with card or mobile wallet via Briq',
      icon: 'credit-card',
      enabled: true
    });
  }

  if (SNIPPE_KEY && SNIPPE_URL) {
    methods.push(
      {
        id: 'snippe-mobile',
        name: 'Mobile Money',
        description: 'Pay with M-Pesa, Airtel Money, or Halotel',
        icon: 'smartphone',
        enabled: true,
        providers: ['mpesa', 'airtel', 'halotel', 'mixx']
      },
      {
        id: 'snippe-card',
        name: 'Card Payment',
        description: 'Pay with Visa or Mastercard',
        icon: 'credit-card',
        enabled: true
      }
    );
  }

  if (methods.length === 0) {
    methods.push({
      id: 'demo',
      name: 'Demo Payment',
      description: 'Simulated payment for testing',
      icon: 'zap',
      enabled: true
    });
  }

  res.json({ methods });
});

router.post('/initiate', async (req, res) => {
  const { orderId, method = 'auto', phoneNumber } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  try {
    if (method === 'snippe-mobile' && SNIPPE_KEY && SNIPPE_URL) {
      return await initiateSnippeMobile(order, phoneNumber || order.customer.phone, res);
    }
    if (method === 'snippe-card' && SNIPPE_KEY && SNIPPE_URL) {
      return await initiateSnippeCard(order, res);
    }
    if ((method === 'briq' || method === 'auto') && BRIQ_KEY && BRIQ_URL) {
      return await initiateBriq(order, res);
    }
    if (method === 'auto' && SNIPPE_KEY && SNIPPE_URL) {
      return await initiateSnippeCard(order, res);
    }

    return processDemoPayment(order, res);
  } catch (error) {
    console.error('Payment initiation error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      return res.status(502).json({ error: 'Payment gateway authentication failed. Check API keys.' });
    }
    if (error.response?.status === 422) {
      return res.status(400).json({ error: error.response.data?.message || 'Invalid payment data' });
    }

    console.log('Falling back to demo payment mode');
    return processDemoPayment(order, res);
  }
});

async function initiateBriq(order, res) {
  const webhookUrl = process.env.PAYMENT_WEBHOOK_URL || `http://localhost:${process.env.PORT || 5000}/api/v1/payments/webhook`;

  const payload = {
    amount: Math.round(order.total * 100),
    currency: CURRENCY,
    description: `${APP_NAME} Order ${order.id}`,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone
    },
    metadata: {
      order_id: order.id,
      source: APP_NAME.toLowerCase()
    },
    callback_url: `${process.env.FRONTEND_URL}/order-confirmation/${order.id}`,
    webhook_url: webhookUrl
  };

  const response = await axios.post(`${BRIQ_URL}/payments`, payload, {
    headers: briqHeaders(),
    timeout: 15000
  });

  const data = response.data.data || response.data;
  order.paymentId = data.id || data.reference;
  order.paymentProvider = 'briq';
  order.updatedAt = new Date().toISOString();

  res.json({
    provider: 'briq',
    paymentId: order.paymentId,
    paymentUrl: data.payment_url || data.paymentUrl || data.checkout_url,
    status: data.status || 'pending',
    order: { id: order.id, total: order.total }
  });
}

async function initiateSnippeMobile(order, phone, res) {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const webhookUrl = process.env.PAYMENT_WEBHOOK_URL || `http://localhost:${process.env.PORT || 5000}/api/v1/payments/webhook`;

  const payload = {
    amount: Math.round(order.total * 100),
    currency: CURRENCY,
    type: 'mobile',
    phone_number: cleanPhone,
    customer: {
      firstname: order.customer.name.split(' ')[0],
      lastname: order.customer.name.split(' ').slice(1).join(' ') || order.customer.name,
      email: order.customer.email
    },
    metadata: {
      order_id: order.id,
      source: APP_NAME.toLowerCase()
    },
    webhook_url: webhookUrl
  };

  const response = await axios.post(`${SNIPPE_URL}/payments`, payload, {
    headers: snippeHeaders(),
    timeout: 15000
  });

  const data = response.data.data || response.data;
  order.paymentId = data.reference || data.id;
  order.paymentProvider = 'snippe';
  order.paymentType = 'mobile';
  order.updatedAt = new Date().toISOString();

  res.json({
    provider: 'snippe',
    type: 'mobile',
    paymentId: order.paymentId,
    status: data.status || 'pending',
    message: 'A USSD prompt has been sent to your phone. Please confirm the payment.',
    order: { id: order.id, total: order.total }
  });
}

async function initiateSnippeCard(order, res) {
  const webhookUrl = process.env.PAYMENT_WEBHOOK_URL || `http://localhost:${process.env.PORT || 5000}/api/v1/payments/webhook`;

  const payload = {
    amount: Math.round(order.total * 100),
    currency: CURRENCY,
    type: 'card',
    phone_number: order.customer.phone.replace(/[^0-9+]/g, ''),
    customer: {
      firstname: order.customer.name.split(' ')[0],
      lastname: order.customer.name.split(' ').slice(1).join(' ') || order.customer.name,
      email: order.customer.email,
      address: order.customer.address?.street || '',
      city: order.customer.address?.city || '',
      state: order.customer.address?.state || '',
      postcode: order.customer.address?.zip || '',
      country: order.customer.address?.country || 'TZ'
    },
    metadata: {
      order_id: order.id,
      source: APP_NAME.toLowerCase()
    },
    callback_url: `${process.env.FRONTEND_URL}/order-confirmation/${order.id}`,
    webhook_url: webhookUrl
  };

  const response = await axios.post(`${SNIPPE_URL}/payments`, payload, {
    headers: snippeHeaders(),
    timeout: 15000
  });

  const data = response.data.data || response.data;
  order.paymentId = data.reference || data.id;
  order.paymentProvider = 'snippe';
  order.paymentType = 'card';
  order.updatedAt = new Date().toISOString();

  res.json({
    provider: 'snippe',
    type: 'card',
    paymentId: order.paymentId,
    paymentUrl: data.payment_url || data.paymentUrl,
    status: data.status || 'pending',
    order: { id: order.id, total: order.total }
  });
}

function processDemoPayment(order, res) {
  order.status = 'confirmed';
  order.paymentId = `DEMO-${Date.now()}`;
  order.paymentProvider = 'demo';
  order.statusHistory.push({
    status: 'confirmed',
    timestamp: new Date().toISOString(),
    note: 'Payment confirmed (demo mode)'
  });
  order.updatedAt = new Date().toISOString();

  res.json({
    provider: 'demo',
    paymentId: order.paymentId,
    paymentUrl: null,
    status: 'confirmed',
    message: 'Payment processed in demo mode. Configure BRIQ_API_KEY or SNIPPE_API_KEY for real payments.',
    order: { id: order.id, total: order.total, status: order.status }
  });
}

router.get('/status/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  const order = orders.find(o => o.paymentId === paymentId);

  if (!order) return res.status(404).json({ error: 'Payment not found' });

  try {
    if (order.paymentProvider === 'briq' && BRIQ_KEY && BRIQ_URL) {
      const response = await axios.get(`${BRIQ_URL}/payments/${paymentId}`, {
        headers: briqHeaders(), timeout: 10000
      });
      const data = response.data.data || response.data;
      return res.json({ paymentId, status: data.status, provider: 'briq', orderId: order.id });
    }

    if (order.paymentProvider === 'snippe' && SNIPPE_KEY && SNIPPE_URL) {
      const response = await axios.get(`${SNIPPE_URL}/payments/${paymentId}`, {
        headers: snippeHeaders(), timeout: 10000
      });
      const data = response.data.data || response.data;
      return res.json({ paymentId, status: data.status, provider: 'snippe', orderId: order.id });
    }
  } catch (error) {
    console.error('Payment status check failed:', error.message);
  }

  res.json({ paymentId, status: order.status, provider: order.paymentProvider || 'demo', orderId: order.id });
});

router.post('/webhook', (req, res) => {
  console.log('Payment webhook received:', JSON.stringify(req.body, null, 2));
  console.log('Webhook headers:', {
    event: req.headers['x-webhook-event'],
    timestamp: req.headers['x-webhook-timestamp'],
    signature: req.headers['x-webhook-signature'] ? '***present***' : 'missing'
  });

  const body = req.body;

  if (body.type && body.data) {
    const event = body.type;
    const paymentData = body.data;
    const reference = paymentData.reference;
    const metadata = paymentData.metadata || {};

    const order = orders.find(o =>
      o.paymentId === reference || o.id === metadata.order_id
    );

    if (order) {
      if (event === 'payment.completed') {
        order.status = 'confirmed';
        order.statusHistory.push({
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          note: `Payment completed via ${paymentData.channel?.type || 'unknown'} (${paymentData.channel?.provider || 'unknown'})`
        });
      } else if (event === 'payment.failed') {
        order.status = 'cancelled';
        order.statusHistory.push({
          status: 'cancelled',
          timestamp: new Date().toISOString(),
          note: 'Payment failed'
        });
      }
      order.updatedAt = new Date().toISOString();
      console.log(`Order ${order.id} updated to ${order.status}`);
    } else {
      console.warn('Webhook: no matching order found for reference:', reference);
    }

    return res.json({ received: true, event });
  }

  const { orderId, status, paymentId } = body;
  const order = orders.find(o => o.id === orderId || o.paymentId === paymentId);
  if (order) {
    const statusMap = { succeeded: 'confirmed', completed: 'confirmed', failed: 'cancelled', pending: 'pending' };
    order.status = statusMap[status] || status;
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      note: `Payment ${status} via webhook`
    });
    order.updatedAt = new Date().toISOString();
  }

  res.json({ received: true });
});

module.exports = router;
