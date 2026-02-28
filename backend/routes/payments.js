const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { orders } = require('../data/store');

const SNIPPE_KEY = process.env.SNIPPE_API_KEY;
const BRIQ_URL = process.env.BRIQ_API_URL;
const BRIQ_KEY = process.env.BRIQ_API_KEY;
const CURRENCY = process.env.CURRENCY || 'TZS';
const APP_NAME = process.env.APP_NAME || 'ShopHub';

const SNIPPE_API = 'https://api.snippe.sh'; // pragma: allowlist secret

function snippeHeaders() {
  return {
    'Authorization': `Bearer ${SNIPPE_KEY}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': uuidv4()
  };
}

function briqHeaders() {
  return {
    'Authorization': `Bearer ${BRIQ_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Idempotency-Key': uuidv4()
  };
}

function getWebhookUrl() {
  const url = process.env.PAYMENT_WEBHOOK_URL;
  if (url && url.startsWith('https://')) return url;
  return undefined;
}

function formatPhone(phone) {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) clean = '255' + clean.substring(1);
  if (!clean.startsWith('255')) clean = '255' + clean;
  return clean;
}

// ── Payment methods ────────────────────────────────────────────────
router.get('/methods', (req, res) => {
  const methods = [];

  if (SNIPPE_KEY) {
    methods.push({
      id: 'mobile-money',
      name: 'Mobile Money',
      description: 'Lipa kwa M-Pesa, Airtel Money, Halotel, au Mixx',
      icon: 'smartphone',
      enabled: true,
      primary: true,
      providers: ['mpesa', 'airtel', 'halotel', 'mixx']
    });
  }

  if (BRIQ_KEY && BRIQ_URL) {
    methods.push({
      id: 'card',
      name: 'Card / Online',
      description: 'Lipa kwa Visa au Mastercard',
      icon: 'credit-card',
      enabled: true
    });
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

// ── Initiate payment ───────────────────────────────────────────────
router.post('/initiate', async (req, res) => {
  const { orderId, method = 'mobile-money', phoneNumber } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const payPhone = phoneNumber || order.customer.phone;

  try {
    if ((method === 'mobile-money' || method === 'auto') && SNIPPE_KEY) {
      return await initiateMobileMoney(order, payPhone, res);
    }
    if (method === 'card' && BRIQ_KEY && BRIQ_URL) {
      return await initiateBriqCard(order, res);
    }
    return processDemoPayment(order, res);
  } catch (error) {
    console.error('[Payment] Error:', error.response?.status, error.response?.data || error.message);

    if (error.response?.status === 401) {
      return res.status(502).json({ error: 'API key si sahihi. Wasiliana na msaada.' });
    }

    console.log('[Payment] Fallback to demo mode');
    return processDemoPayment(order, res);
  }
});

// ── Snippe Mobile Money (USSD push) ───────────────────────────────
async function initiateMobileMoney(order, phone, res) {
  const formattedPhone = formatPhone(phone);
  const webhookUrl = getWebhookUrl();

  const payload = {
    type: 'mobile',
    details: {
      amount: order.total,
      currency: CURRENCY
    },
    phone_number: formattedPhone,
    customer: {
      firstname: order.customer.name.split(' ')[0],
      lastname: order.customer.name.split(' ').slice(1).join(' ') || order.customer.name,
      email: order.customer.email || undefined
    },
    metadata: {
      order_id: order.id,
      source: APP_NAME.toLowerCase()
    }
  };

  if (webhookUrl) {
    payload.webhook_url = webhookUrl;
  }

  console.log(`[Payment] Mobile money: ${order.id}, phone: ${formattedPhone}, amount: ${order.total} ${CURRENCY}`);
  console.log(`[Payment] Payload:`, JSON.stringify(payload, null, 2));

  const response = await axios.post(`${SNIPPE_API}/v1/payments`, payload, {
    headers: snippeHeaders(),
    timeout: 20000
  });

  const data = response.data.data || response.data;
  console.log(`[Payment] Snippe OK:`, JSON.stringify(data).substring(0, 500));

  order.paymentId = data.reference || data.id;
  order.paymentProvider = 'snippe';
  order.paymentType = 'mobile';
  order.paymentPhone = formattedPhone;
  order.updatedAt = new Date().toISOString();

  return res.json({
    provider: 'snippe',
    type: 'mobile',
    paymentId: order.paymentId,
    status: data.status || 'pending',
    phone: formattedPhone,
    message: `USSD imetumwa kwa ${formattedPhone}. Thibitisha malipo kwenye simu yako.`,
    order: { id: order.id, total: order.total, status: 'pending' }
  });
}

// ── Briq Card Payment ──────────────────────────────────────────────
async function initiateBriqCard(order, res) {
  const callbackUrl = `${process.env.FRONTEND_URL}/order-confirmation/${order.id}`;

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
    metadata: { order_id: order.id },
    success_url: callbackUrl,
    cancel_url: `${process.env.FRONTEND_URL}/checkout`,
    callback_url: callbackUrl,
    return_url: callbackUrl
  };

  const webhookUrl = getWebhookUrl();
  if (webhookUrl) payload.webhook_url = webhookUrl;

  const endpoints = [
    `${BRIQ_URL}/v1/checkout/sessions`,
    `${BRIQ_URL}/v1/payments`,
    `${BRIQ_URL}/payments`,
  ];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(endpoint, payload, { headers: briqHeaders(), timeout: 15000 });
      const data = response.data.data || response.data;

      order.paymentId = data.id || data.reference;
      order.paymentProvider = 'briq';
      order.updatedAt = new Date().toISOString();

      const paymentUrl = data.payment_url || data.paymentUrl || data.checkout_url || data.url;
      return res.json({
        provider: 'briq',
        type: 'card',
        paymentId: order.paymentId,
        paymentUrl,
        status: data.status || 'pending',
        order: { id: order.id, total: order.total }
      });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// ── Demo Payment ───────────────────────────────────────────────────
function processDemoPayment(order, res) {
  order.status = 'confirmed';
  order.paymentId = `DEMO-${Date.now()}`;
  order.paymentProvider = 'demo';
  order.statusHistory.push({
    status: 'confirmed',
    timestamp: new Date().toISOString(),
    note: 'Malipo yamethibitishwa (demo)'
  });
  order.updatedAt = new Date().toISOString();

  sendWhatsAppNotification(order);

  res.json({
    provider: 'demo',
    paymentId: order.paymentId,
    status: 'confirmed',
    message: 'Demo mode: malipo yamethibitishwa.',
    order: { id: order.id, total: order.total, status: 'confirmed' }
  });
}

// ── Check payment status ───────────────────────────────────────────
router.get('/status/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  const order = orders.find(o => o.paymentId === paymentId);
  if (!order) return res.status(404).json({ error: 'Payment not found' });

  if (order.paymentProvider === 'snippe' && SNIPPE_KEY) {
    try {
      const response = await axios.get(`${SNIPPE_API}/v1/payments/${paymentId}`, {
        headers: snippeHeaders(), timeout: 10000
      });
      const data = response.data.data || response.data;
      const status = data.status;

      if ((status === 'completed' || status === 'succeeded') && order.status !== 'confirmed') {
        order.status = 'confirmed';
        order.statusHistory.push({
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          note: `Malipo yamekamilika (${data.channel?.provider || 'mobile money'})`
        });
        order.updatedAt = new Date().toISOString();
        sendWhatsAppNotification(order);
      }

      if ((status === 'failed' || status === 'declined') && order.status === 'pending') {
        order.status = 'cancelled';
        order.statusHistory.push({
          status: 'cancelled', timestamp: new Date().toISOString(), note: 'Malipo yameshindwa'
        });
        order.updatedAt = new Date().toISOString();
      }

      return res.json({
        paymentId, status: order.status, provider: 'snippe',
        orderId: order.id, providerStatus: status
      });
    } catch (err) {
      console.log(`[Payment] Status check failed:`, err.response?.status, err.message);
    }
  }

  res.json({ paymentId, status: order.status, provider: order.paymentProvider || 'demo', orderId: order.id });
});

// ── Webhook ────────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  console.log('[Webhook] Received:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ received: true });

  try {
    const body = req.body;

    if (body.type && body.data) {
      const paymentData = body.data;
      const reference = paymentData.reference;
      const metadata = paymentData.metadata || {};
      const order = orders.find(o => o.paymentId === reference || o.id === metadata.order_id);

      if (order) {
        if (body.type === 'payment.completed') {
          order.status = 'confirmed';
          order.statusHistory.push({
            status: 'confirmed',
            timestamp: new Date().toISOString(),
            note: `Malipo yamekamilika: ${paymentData.channel?.provider || 'mobile money'}`
          });
          order.updatedAt = new Date().toISOString();
          console.log(`[Webhook] Order ${order.id} CONFIRMED`);
          await sendWhatsAppNotification(order);
        } else if (body.type === 'payment.failed') {
          order.status = 'cancelled';
          order.statusHistory.push({
            status: 'cancelled', timestamp: new Date().toISOString(), note: 'Malipo yameshindwa'
          });
          order.updatedAt = new Date().toISOString();
        }
      }
      return;
    }

    const orderId = body.orderId || body.order_id || body.reference || body.metadata?.order_id;
    const status = body.status || body.payment_status;
    const pId = body.paymentId || body.payment_id || body.id;
    const order = orders.find(o => o.id === orderId || o.paymentId === pId);
    if (order) {
      const map = { succeeded: 'confirmed', completed: 'confirmed', paid: 'confirmed', failed: 'cancelled' };
      const newStatus = map[status] || status;
      order.status = newStatus;
      order.statusHistory.push({ status: newStatus, timestamp: new Date().toISOString(), note: `Webhook: ${status}` });
      order.updatedAt = new Date().toISOString();
      if (newStatus === 'confirmed') await sendWhatsAppNotification(order);
    }
  } catch (err) {
    console.error('[Webhook] Error:', err.message);
  }
});

async function sendWhatsAppNotification(order) {
  try {
    await axios.post(
      `http://localhost:${process.env.PORT || 5000}/api/v1/whatsapp/send-order-notification`,
      { orderId: order.id },
      { timeout: 10000 }
    );
    console.log(`[WhatsApp] Notification sent for ${order.id}`);
  } catch (err) {
    console.log(`[WhatsApp] Failed for ${order.id}:`, err.message);
  }
}

module.exports = router;
