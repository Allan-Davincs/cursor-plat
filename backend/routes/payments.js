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
    'Accept': 'application/json',
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

function getWebhookUrl() {
  return process.env.PAYMENT_WEBHOOK_URL
    || `http://localhost:${process.env.PORT || 5000}/api/v1/payments/webhook`;
}

router.get('/methods', (req, res) => {
  const methods = [];

  if (BRIQ_KEY && BRIQ_URL) {
    methods.push({
      id: 'briq',
      name: 'Briq Payment',
      description: 'Lipa kwa kadi au mobile wallet kupitia Briq',
      icon: 'credit-card',
      enabled: true
    });
  }

  if (SNIPPE_KEY && SNIPPE_URL) {
    methods.push(
      {
        id: 'snippe-mobile',
        name: 'Mobile Money',
        description: 'Lipa kwa M-Pesa, Airtel Money, au Halotel',
        icon: 'smartphone',
        enabled: true,
        providers: ['mpesa', 'airtel', 'halotel', 'mixx']
      },
      {
        id: 'snippe-card',
        name: 'Card Payment',
        description: 'Lipa kwa Visa au Mastercard',
        icon: 'credit-card',
        enabled: true
      }
    );
  }

  if (methods.length === 0) {
    methods.push({
      id: 'demo',
      name: 'Demo Payment',
      description: 'Malipo ya majaribio',
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
    console.error('Payment initiation error:', error.response?.status, error.response?.data || error.message);

    if (error.response?.status === 401) {
      return res.status(502).json({ error: 'Uthibitisho wa malipo umeshindwa. Angalia API keys.' });
    }
    if (error.response?.status === 422) {
      return res.status(400).json({ error: error.response.data?.message || 'Taarifa za malipo si sahihi' });
    }

    console.log('Falling back to demo payment mode');
    return processDemoPayment(order, res);
  }
});

async function initiateBriq(order, res) {
  const callbackUrl = `${process.env.FRONTEND_URL}/order-confirmation/${order.id}`;

  const endpoints = [
    `${BRIQ_URL}/v1/checkout/sessions`,
    `${BRIQ_URL}/v1/payments`,
    `${BRIQ_URL}/checkout/sessions`,
    `${BRIQ_URL}/payments`,
  ];

  const payload = {
    amount: order.total,
    currency: CURRENCY,
    description: `${APP_NAME} Order ${order.id}`,
    reference: order.id,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone
    },
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total: item.price * item.quantity
    })),
    metadata: {
      order_id: order.id,
      source: APP_NAME.toLowerCase()
    },
    success_url: callbackUrl,
    cancel_url: `${process.env.FRONTEND_URL}/checkout`,
    callback_url: callbackUrl,
    webhook_url: getWebhookUrl(),
    return_url: callbackUrl
  };

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying Briq endpoint: ${endpoint}`);
      const response = await axios.post(endpoint, payload, {
        headers: briqHeaders(),
        timeout: 15000
      });

      const data = response.data.data || response.data;
      order.paymentId = data.id || data.reference || data.session_id;
      order.paymentProvider = 'briq';
      order.updatedAt = new Date().toISOString();

      const paymentUrl = data.payment_url || data.paymentUrl || data.checkout_url
        || data.url || data.redirect_url || data.session_url;

      if (paymentUrl) {
        return res.json({
          provider: 'briq',
          paymentId: order.paymentId,
          paymentUrl,
          status: data.status || 'pending',
          order: { id: order.id, total: order.total }
        });
      }

      if (data.status === 'completed' || data.status === 'paid' || data.status === 'succeeded') {
        order.status = 'confirmed';
        order.statusHistory.push({
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          note: 'Payment confirmed via Briq'
        });
        order.updatedAt = new Date().toISOString();

        await sendOrderWhatsApp(order);

        return res.json({
          provider: 'briq',
          paymentId: order.paymentId,
          paymentUrl: null,
          status: 'confirmed',
          order: { id: order.id, total: order.total, status: 'confirmed' }
        });
      }

      return res.json({
        provider: 'briq',
        paymentId: order.paymentId,
        paymentUrl: null,
        status: data.status || 'pending',
        order: { id: order.id, total: order.total }
      });
    } catch (err) {
      lastError = err;
      console.log(`Briq endpoint ${endpoint} failed:`, err.response?.status, err.response?.data?.message || err.message);
    }
  }

  throw lastError;
}

async function initiateSnippeMobile(order, phone, res) {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');

  const endpoints = [
    `${SNIPPE_URL}/v1/payments`,
    `${SNIPPE_URL}/payments`,
  ];

  const payload = {
    amount: order.total,
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
    webhook_url: getWebhookUrl()
  };

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying Snippe endpoint: ${endpoint}`);
      const response = await axios.post(endpoint, payload, {
        headers: snippeHeaders(),
        timeout: 15000
      });

      const data = response.data.data || response.data;
      order.paymentId = data.reference || data.id;
      order.paymentProvider = 'snippe';
      order.paymentType = 'mobile';
      order.updatedAt = new Date().toISOString();

      return res.json({
        provider: 'snippe',
        type: 'mobile',
        paymentId: order.paymentId,
        status: data.status || 'pending',
        message: 'Omba wa USSD umetumwa kwenye simu yako. Tafadhali thibitisha malipo.',
        order: { id: order.id, total: order.total }
      });
    } catch (err) {
      lastError = err;
      console.log(`Snippe endpoint ${endpoint} failed:`, err.response?.status);
    }
  }

  throw lastError;
}

async function initiateSnippeCard(order, res) {
  const endpoints = [
    `${SNIPPE_URL}/v1/payments`,
    `${SNIPPE_URL}/payments`,
  ];

  const payload = {
    amount: order.total,
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
    webhook_url: getWebhookUrl()
  };

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying Snippe card endpoint: ${endpoint}`);
      const response = await axios.post(endpoint, payload, {
        headers: snippeHeaders(),
        timeout: 15000
      });

      const data = response.data.data || response.data;
      order.paymentId = data.reference || data.id;
      order.paymentProvider = 'snippe';
      order.paymentType = 'card';
      order.updatedAt = new Date().toISOString();

      return res.json({
        provider: 'snippe',
        type: 'card',
        paymentId: order.paymentId,
        paymentUrl: data.payment_url || data.paymentUrl,
        status: data.status || 'pending',
        order: { id: order.id, total: order.total }
      });
    } catch (err) {
      lastError = err;
      console.log(`Snippe card endpoint ${endpoint} failed:`, err.response?.status);
    }
  }

  throw lastError;
}

function processDemoPayment(order, res) {
  order.status = 'confirmed';
  order.paymentId = `DEMO-${Date.now()}`;
  order.paymentProvider = 'demo';
  order.statusHistory.push({
    status: 'confirmed',
    timestamp: new Date().toISOString(),
    note: 'Malipo yamethibitishwa (hali ya majaribio)'
  });
  order.updatedAt = new Date().toISOString();

  sendOrderWhatsApp(order);

  res.json({
    provider: 'demo',
    paymentId: order.paymentId,
    paymentUrl: null,
    status: 'confirmed',
    message: 'Malipo yamefanikiwa (demo mode).',
    order: { id: order.id, total: order.total, status: order.status }
  });
}

async function sendOrderWhatsApp(order) {
  try {
    await axios.post(`http://localhost:${process.env.PORT || 5000}/api/v1/whatsapp/send-order-notification`, {
      orderId: order.id
    }, { timeout: 5000 });
    console.log(`WhatsApp notification sent for order ${order.id}`);
  } catch (err) {
    console.log(`WhatsApp notification skipped for ${order.id}:`, err.message);
  }
}

router.get('/status/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  const order = orders.find(o => o.paymentId === paymentId);

  if (!order) return res.status(404).json({ error: 'Payment not found' });

  try {
    if (order.paymentProvider === 'briq' && BRIQ_KEY && BRIQ_URL) {
      const urls = [`${BRIQ_URL}/v1/payments/${paymentId}`, `${BRIQ_URL}/payments/${paymentId}`];
      for (const url of urls) {
        try {
          const response = await axios.get(url, { headers: briqHeaders(), timeout: 10000 });
          const data = response.data.data || response.data;
          return res.json({ paymentId, status: data.status, provider: 'briq', orderId: order.id });
        } catch { /* try next */ }
      }
    }

    if (order.paymentProvider === 'snippe' && SNIPPE_KEY && SNIPPE_URL) {
      const urls = [`${SNIPPE_URL}/v1/payments/${paymentId}`, `${SNIPPE_URL}/payments/${paymentId}`];
      for (const url of urls) {
        try {
          const response = await axios.get(url, { headers: snippeHeaders(), timeout: 10000 });
          const data = response.data.data || response.data;
          return res.json({ paymentId, status: data.status, provider: 'snippe', orderId: order.id });
        } catch { /* try next */ }
      }
    }
  } catch (error) {
    console.error('Payment status check failed:', error.message);
  }

  res.json({ paymentId, status: order.status, provider: order.paymentProvider || 'demo', orderId: order.id });
});

router.post('/webhook', async (req, res) => {
  console.log('Payment webhook received:', JSON.stringify(req.body, null, 2));

  const body = req.body;

  // Snippe webhook format
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
          note: `Malipo yamekamilika kupitia ${paymentData.channel?.type || 'unknown'} (${paymentData.channel?.provider || 'unknown'})`
        });
        await sendOrderWhatsApp(order);
      } else if (event === 'payment.failed') {
        order.status = 'cancelled';
        order.statusHistory.push({
          status: 'cancelled',
          timestamp: new Date().toISOString(),
          note: 'Malipo yameshindwa'
        });
      }
      order.updatedAt = new Date().toISOString();
      console.log(`Order ${order.id} updated to ${order.status}`);
    }

    return res.json({ received: true, event });
  }

  // Briq / generic webhook format
  const orderId = body.orderId || body.order_id || body.reference || body.metadata?.order_id;
  const status = body.status || body.payment_status;
  const paymentId = body.paymentId || body.payment_id || body.id;

  const order = orders.find(o => o.id === orderId || o.paymentId === paymentId);
  if (order) {
    const statusMap = {
      succeeded: 'confirmed', completed: 'confirmed', paid: 'confirmed',
      failed: 'cancelled', declined: 'cancelled', expired: 'cancelled',
      pending: 'pending'
    };
    const newStatus = statusMap[status] || status;
    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: `Malipo ${status} kupitia webhook`
    });
    order.updatedAt = new Date().toISOString();

    if (newStatus === 'confirmed') {
      await sendOrderWhatsApp(order);
    }
  }

  res.json({ received: true });
});

module.exports = router;
