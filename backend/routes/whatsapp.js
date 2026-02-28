const express = require('express');
const router = express.Router();
const axios = require('axios');
const { products, orders } = require('../data/store');

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '255675029833';
const GHALA_WEBHOOK_URL = process.env.GHALA_WEBHOOK_URL;
const GHALA_VERIFY_TOKEN = process.env.GHALA_VERIFY_TOKEN;
const APP_NAME = process.env.APP_NAME || 'ShopHub';
const CURRENCY = process.env.CURRENCY || 'TZS';

function cleanPhone(phone) {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) clean = '255' + clean.substring(1);
  if (!clean.startsWith('255')) clean = '255' + clean;
  return clean;
}

function formatPrice(amount) {
  return `${Number(amount).toLocaleString()} ${CURRENCY}`;
}

// Try multiple Ghala endpoints to find the one that works for sending
async function sendViaGhala(to, messageBody) {
  if (!GHALA_WEBHOOK_URL) return null;

  const formattedPhone = cleanPhone(to);

  const whatsappPayload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'text',
    text: { body: messageBody }
  };

  const simplePayload = {
    to: formattedPhone,
    message: messageBody,
    type: 'text'
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GHALA_VERIFY_TOKEN}`
  };

  // Extract base from webhook URL: https://api.ghala.io/webhook/{token} -> https://api.ghala.io
  let apiBase;
  try {
    const url = new URL(GHALA_WEBHOOK_URL);
    apiBase = `${url.protocol}//${url.host}`;
  } catch { return null; }

  // Try multiple endpoint patterns
  const attempts = [
    { url: `${apiBase}/v1/messages/send`, payload: simplePayload },
    { url: `${apiBase}/api/v1/messages`, payload: whatsappPayload },
    { url: `${apiBase}/messages/send`, payload: simplePayload },
    { url: `${apiBase}/api/messages/send`, payload: simplePayload },
    { url: `${apiBase}/send`, payload: simplePayload },
    { url: GHALA_WEBHOOK_URL, payload: { type: 'send_message', to: formattedPhone, message: messageBody } },
  ];

  for (const attempt of attempts) {
    try {
      const response = await axios.post(attempt.url, attempt.payload, {
        headers: authHeaders,
        timeout: 10000
      });

      console.log(`[Ghala] Sent via ${attempt.url}:`, response.status);
      return {
        sent: true,
        provider: 'ghala',
        messageId: response.data?.messages?.[0]?.id || response.data?.id || response.data?.message_id,
        to: formattedPhone
      };
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message;
      console.log(`[Ghala] ${attempt.url} -> ${status}: ${detail}`);
      // 404 or 405 means wrong endpoint, keep trying. 401/403 means auth issue, stop.
      if (status === 401 || status === 403) break;
    }
  }

  return null;
}

// ── Webhook verification (GET) ─────────────────────────────────────
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === GHALA_VERIFY_TOKEN) {
    console.log('[Ghala] Webhook verified');
    return res.status(200).send(challenge);
  }

  console.warn('[Ghala] Webhook verification failed');
  res.sendStatus(403);
});

// ── Receive incoming WhatsApp messages (POST) ──────────────────────
router.post('/webhook', async (req, res) => {
  console.log('[WhatsApp] Webhook:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ received: true });

  try {
    const body = req.body;
    let messages = [];

    if (body.entry) {
      for (const entry of body.entry) {
        for (const change of (entry.changes || [])) {
          messages.push(...(change.value?.messages || []));
        }
      }
    } else if (body.from && (body.message || body.text)) {
      messages.push({
        from: body.from,
        type: body.type || 'text',
        text: { body: body.message?.body || body.text || body.message }
      });
    }

    for (const msg of messages) {
      await handleIncomingMessage(msg);
    }
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error.message);
  }
});

async function handleIncomingMessage(msg) {
  const from = msg.from;
  const text = (msg.text?.body || msg.button?.text || '').trim();
  const lower = text.toLowerCase();

  console.log(`[WhatsApp] From: ${from}, Text: "${text}"`);
  if (!text) return;

  if (['hi', 'hello', 'hey', 'habari', 'mambo'].includes(lower)) {
    await sendViaGhala(from,
      `👋 Karibu *${APP_NAME}*!\n\n`
      + `Nikusaidie nini?\n`
      + `📦 *order ORD-1001* - Angalia oda\n`
      + `🛍️ *products* - Tazama bidhaa\n`
      + `🏷️ *deals* - Punguzo\n`
      + `❓ *help* - Msaada`
    );
    return;
  }

  if (['help', 'menu', 'msaada'].includes(lower)) {
    await sendViaGhala(from,
      `📋 *${APP_NAME} Menu*\n\n`
      + `1️⃣ *order ORD-1001* - Angalia oda\n`
      + `2️⃣ *products* - Bidhaa zilizo featured\n`
      + `3️⃣ *deals* - Punguzo kubwa\n`
      + `4️⃣ *categories* - Aina za bidhaa\n\n`
      + `Au andika unachotafuta! 🔍`
    );
    return;
  }

  const orderMatch = lower.match(/ord-(\d+)/i) || lower.match(/order\s+(\d+)/i);
  if (orderMatch) {
    const orderId = `ORD-${orderMatch[1]}`;
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const emoji = { pending: '⏳', confirmed: '✅', processing: '📦', shipped: '🚚', delivered: '🎉', cancelled: '❌' };
      const items = order.items.map(i => `  • ${i.name} x${i.quantity}`).join('\n');
      await sendViaGhala(from,
        `${emoji[order.status] || '📋'} *Oda: ${order.id}*\n\n`
        + `Status: *${order.status === 'confirmed' ? 'IMELIPWA' : order.status === 'pending' ? 'HAIJALIPWA' : order.status.toUpperCase()}*\n\n`
        + `📝 Bidhaa:\n${items}\n\n`
        + `💰 Jumla: *${formatPrice(order.total)}*`
      );
    } else {
      await sendViaGhala(from, `❌ Oda *${orderId}* haijapatikana.`);
    }
    return;
  }

  if (['products', 'bidhaa', 'shop'].includes(lower)) {
    const featured = products.filter(p => p.featured).slice(0, 5);
    const list = featured.map((p, i) => `${i + 1}. *${p.name}*\n   ${formatPrice(p.price)}`).join('\n\n');
    await sendViaGhala(from, `🛍️ *Bidhaa*\n\n${list}\n\n🌐 ${process.env.FRONTEND_URL || 'Tembelea duka letu'}`);
    return;
  }

  if (['deals', 'offers', 'punguzo'].includes(lower)) {
    const deals = products
      .map(p => ({ ...p, discount: Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) }))
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 5);
    const list = deals.map((p, i) => `${i + 1}. *${p.name}* 🔥 -${p.discount}%\n   ${formatPrice(p.price)}`).join('\n\n');
    await sendViaGhala(from, `🏷️ *Punguzo*\n\n${list}\n\n🌐 ${process.env.FRONTEND_URL || 'Tembelea duka letu'}`);
    return;
  }

  if (['categories', 'aina'].includes(lower)) {
    await sendViaGhala(from, `📂 *Aina za Bidhaa*\n\n💻 Electronics\n👔 Clothing\n⌚ Accessories\n🏠 Home & Living`);
    return;
  }

  const results = products.filter(p =>
    p.name.toLowerCase().includes(lower) || p.tags.some(t => t.includes(lower)) || p.category.includes(lower)
  ).slice(0, 3);

  if (results.length > 0) {
    const list = results.map(p => `🛒 *${p.name}*\n   ${formatPrice(p.price)}`).join('\n\n');
    await sendViaGhala(from, `🔍 Nimeona:\n\n${list}\n\n🌐 ${process.env.FRONTEND_URL || 'Nunua sasa'}`);
    return;
  }

  await sendViaGhala(from,
    `Asante kwa ujumbe! 😊\n\nJaribu:\n• *help* - Menu\n• *products* - Bidhaa\n• *order ORD-1001* - Oda\n\n🌐 ${process.env.FRONTEND_URL || ''}`
  );
}

// ── QR code and link endpoints ─────────────────────────────────────
router.get('/qr-data', (req, res) => {
  const phone = cleanPhone(WHATSAPP_NUMBER);
  const message = encodeURIComponent(`Hi! Nataka kununua bidhaa kwenye ${APP_NAME}`);
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
  res.json({ url: whatsappUrl, phone: WHATSAPP_NUMBER, qrValue: whatsappUrl });
});

router.get('/product-link/:productId', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.productId));
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const phone = cleanPhone(WHATSAPP_NUMBER);
  const message = encodeURIComponent(`Habari! Nahitaji: *${product.name}*\nBei: ${formatPrice(product.price)}`);
  res.json({ url: `https://wa.me/${phone}?text=${message}`, product: { id: product.id, name: product.name, price: product.price } });
});

router.get('/order-update/:orderId', (req, res) => {
  const order = orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const phone = cleanPhone(WHATSAPP_NUMBER);
  const emoji = { pending: '⏳', confirmed: '✅', processing: '📦', shipped: '🚚', delivered: '🎉', cancelled: '❌' };
  const message = encodeURIComponent(
    `${emoji[order.status] || '📋'} *Oda: ${order.id}*\nStatus: ${order.status.toUpperCase()}\nJumla: ${formatPrice(order.total)}`
  );
  res.json({ url: `https://wa.me/${phone}?text=${message}`, order: { id: order.id, status: order.status } });
});

// ── Send order notification ────────────────────────────────────────
router.post('/send-order-notification', async (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const customerPhone = order.customer.phone;
  const emoji = { pending: '⏳', confirmed: '✅', processing: '📦', shipped: '🚚', delivered: '🎉' };
  const items = order.items.map(i => `  • ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`).join('\n');

  const message = `${emoji[order.status] || '📋'} *${APP_NAME}*\n\n`
    + `Oda: *${order.id}*\n`
    + `Status: *${order.status === 'confirmed' ? 'IMELIPWA ✅' : order.status === 'pending' ? 'INASUBIRI MALIPO' : order.status.toUpperCase()}*\n\n`
    + `📝 Bidhaa:\n${items}\n\n`
    + `💰 Jumla: *${formatPrice(order.total)}*\n\n`
    + `Asante kwa kununua! Jibu ujumbe huu kwa msaada.`;

  const ghalaResult = await sendViaGhala(customerPhone, message);
  if (ghalaResult) {
    return res.json(ghalaResult);
  }

  const waLink = `https://wa.me/${cleanPhone(customerPhone)}?text=${encodeURIComponent(message)}`;
  res.json({
    sent: false,
    fallback: true,
    whatsappUrl: waLink,
    message: 'WhatsApp haijatumwa kiotomatiki. Tumia link kutuma mwenyewe.'
  });
});

router.post('/send-message', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'to and message required' });

  const result = await sendViaGhala(to, message);
  if (result) return res.json(result);

  res.json({
    sent: false,
    fallback: true,
    whatsappUrl: `https://wa.me/${cleanPhone(to)}?text=${encodeURIComponent(message)}`
  });
});

module.exports = router;
