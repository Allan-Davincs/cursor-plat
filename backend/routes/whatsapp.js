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
  return phone.replace(/[^0-9]/g, '');
}

function formatPrice(amount) {
  return `${Number(amount).toLocaleString()} ${CURRENCY}`;
}

// Ghala sends messages through the webhook URL base
function getGhalaApiBase() {
  if (!GHALA_WEBHOOK_URL) return null;
  const url = new URL(GHALA_WEBHOOK_URL);
  return `${url.protocol}//${url.host}`;
}

async function sendViaGhala(to, messageBody) {
  const apiBase = getGhalaApiBase();
  if (!apiBase) return null;

  const phone = cleanPhone(to);
  const formattedPhone = phone.startsWith('255') ? phone : `255${phone}`;

  try {
    const response = await axios.post(`${apiBase}/v1/messages`, {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: { body: messageBody }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GHALA_VERIFY_TOKEN}`
      },
      timeout: 15000
    });

    return {
      sent: true,
      provider: 'ghala',
      messageId: response.data?.messages?.[0]?.id || response.data?.id || response.data?.message_id,
      to: formattedPhone
    };
  } catch (error) {
    console.error('Ghala send failed:', error.response?.data || error.message);
    return null;
  }
}

async function sendInteractiveViaGhala(to, bodyText, buttons) {
  const apiBase = getGhalaApiBase();
  if (!apiBase) return null;

  const phone = cleanPhone(to);
  const formattedPhone = phone.startsWith('255') ? phone : `255${phone}`;

  try {
    const response = await axios.post(`${apiBase}/v1/messages`, {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map((btn, i) => ({
            type: 'reply',
            reply: { id: btn.id || `btn_${i}`, title: btn.title.substring(0, 20) }
          }))
        }
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GHALA_VERIFY_TOKEN}`
      },
      timeout: 15000
    });

    return {
      sent: true,
      provider: 'ghala',
      messageId: response.data?.messages?.[0]?.id || response.data?.id
    };
  } catch (error) {
    console.error('Ghala interactive send failed:', error.response?.data || error.message);
    return null;
  }
}

// ── Webhook verification (GET) ─────────────────────────────────────
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === GHALA_VERIFY_TOKEN) {
    console.log('Ghala webhook verified successfully');
    return res.status(200).send(challenge);
  }

  console.warn('Webhook verification failed:', { mode, tokenMatch: token === GHALA_VERIFY_TOKEN });
  res.sendStatus(403);
});

// ── Receive incoming WhatsApp messages (POST) ──────────────────────
router.post('/webhook', async (req, res) => {
  console.log('WhatsApp webhook received:', JSON.stringify(req.body, null, 2));

  res.status(200).json({ received: true });

  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account' || body.entry) {
      for (const entry of (body.entry || [])) {
        for (const change of (entry.changes || [])) {
          const value = change.value || {};
          const messages = value.messages || [];

          for (const msg of messages) {
            await handleIncomingMessage(msg, value.contacts);
          }
        }
      }
    } else if (body.from && (body.message || body.text)) {
      await handleIncomingMessage({
        from: body.from,
        type: body.type || 'text',
        text: { body: body.message?.body || body.text || body.message }
      });
    }
  } catch (error) {
    console.error('Webhook processing error:', error.message);
  }
});

async function handleIncomingMessage(msg, contacts) {
  const from = msg.from;
  const msgType = msg.type;
  const text = (msg.text?.body || msg.button?.text || '').trim();
  const textLower = text.toLowerCase();

  console.log(`[WhatsApp] From: ${from}, Type: ${msgType}, Text: "${text}"`);

  if (!text) return;

  if (textLower === 'hi' || textLower === 'hello' || textLower === 'hey' || textLower === 'habari') {
    await sendViaGhala(from,
      `👋 Welcome to *${APP_NAME}*!\n\n`
      + `I can help you with:\n`
      + `📦 *order <ID>* - Check order status\n`
      + `🛍️ *products* - Browse our products\n`
      + `🏷️ *deals* - See current deals\n`
      + `❓ *help* - Get assistance\n\n`
      + `What would you like to do?`
    );
    return;
  }

  if (textLower === 'help' || textLower === 'menu' || textLower === 'msaada') {
    await sendViaGhala(from,
      `📋 *${APP_NAME} Menu*\n\n`
      + `Here's what I can do:\n\n`
      + `1️⃣ Type *order ORD-1001* to check an order\n`
      + `2️⃣ Type *products* to see featured items\n`
      + `3️⃣ Type *deals* to see discounted items\n`
      + `4️⃣ Type *categories* to browse by category\n`
      + `5️⃣ Type *cart* info about shopping\n\n`
      + `Or just describe what you're looking for! 🔍`
    );
    return;
  }

  const orderMatch = textLower.match(/ord-(\d+)/i) || textLower.match(/order\s+(\d+)/i);
  if (orderMatch || textLower.startsWith('order')) {
    const orderId = orderMatch ? `ORD-${orderMatch[1]}` : null;
    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const statusEmoji = {
          pending: '⏳', confirmed: '✅', processing: '📦', shipped: '🚚', delivered: '🎉', cancelled: '❌'
        };
        const itemList = order.items
          .map(i => `  • ${i.name} x${i.quantity}`)
          .join('\n');

        await sendViaGhala(from,
          `${statusEmoji[order.status] || '📋'} *Order: ${order.id}*\n\n`
          + `Status: *${order.status.toUpperCase()}*\n`
          + `Date: ${new Date(order.createdAt).toLocaleDateString()}\n\n`
          + `📝 Items:\n${itemList}\n\n`
          + `💰 Total: *${formatPrice(order.total)}*\n\n`
          + `Need help? Just reply here!`
        );
      } else {
        await sendViaGhala(from, `❌ Order *${orderId}* not found. Please check the order ID and try again.`);
      }
    } else {
      await sendViaGhala(from, `📦 To check an order, type: *order ORD-1001*\n\n(Replace 1001 with your order number)`);
    }
    return;
  }

  if (textLower === 'products' || textLower === 'bidhaa' || textLower === 'shop') {
    const featured = products.filter(p => p.featured).slice(0, 5);
    const list = featured
      .map((p, i) => `${i + 1}. *${p.name}*\n   ${formatPrice(p.price)} (was ${formatPrice(p.originalPrice)})`)
      .join('\n\n');

    await sendViaGhala(from,
      `🛍️ *Featured Products*\n\n${list}\n\n`
      + `Visit our store to order: ${process.env.FRONTEND_URL || 'our website'}\n\n`
      + `Type a product name for more details!`
    );
    return;
  }

  if (textLower === 'deals' || textLower === 'offers' || textLower === 'punguzo') {
    const deals = products
      .map(p => ({ ...p, discount: Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) }))
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 5);

    const list = deals
      .map((p, i) => `${i + 1}. *${p.name}* 🔥 ${p.discount}% OFF\n   ${formatPrice(p.price)} ~~${formatPrice(p.originalPrice)}~~`)
      .join('\n\n');

    await sendViaGhala(from,
      `🏷️ *Best Deals Right Now*\n\n${list}\n\n`
      + `Shop now: ${process.env.FRONTEND_URL || 'our website'}`
    );
    return;
  }

  if (textLower === 'categories' || textLower === 'aina') {
    await sendViaGhala(from,
      `📂 *Product Categories*\n\n`
      + `💻 *Electronics* - Headphones, trackers, chargers\n`
      + `👔 *Clothing* - Hoodies, scarves\n`
      + `⌚ *Accessories* - Watches, bags\n`
      + `🏠 *Home & Living* - Coffee makers, lamps, decor\n\n`
      + `Visit ${process.env.FRONTEND_URL || 'our store'} to browse!`
    );
    return;
  }

  const searchResults = products.filter(p =>
    p.name.toLowerCase().includes(textLower) ||
    p.tags.some(t => t.toLowerCase().includes(textLower)) ||
    p.category.includes(textLower)
  ).slice(0, 3);

  if (searchResults.length > 0) {
    const list = searchResults
      .map(p => `🛒 *${p.name}*\n   ${formatPrice(p.price)}\n   ${p.shortDescription}`)
      .join('\n\n');

    await sendViaGhala(from,
      `🔍 Found ${searchResults.length} result(s):\n\n${list}\n\n`
      + `Shop at: ${process.env.FRONTEND_URL || 'our website'}`
    );
    return;
  }

  await sendViaGhala(from,
    `Thanks for your message! 😊\n\n`
    + `I didn't quite understand that. Try:\n`
    + `• *help* - See what I can do\n`
    + `• *products* - Browse our store\n`
    + `• *order ORD-1001* - Check an order\n\n`
    + `Or visit: ${process.env.FRONTEND_URL || 'our website'}`
  );
}

// ── QR code and link generation ────────────────────────────────────
router.get('/qr-data', (req, res) => {
  const phone = cleanPhone(WHATSAPP_NUMBER);
  const message = encodeURIComponent(
    `Hi! I'm interested in shopping at ${APP_NAME}. Can you help me find some products?`
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  res.json({
    url: whatsappUrl,
    phone: WHATSAPP_NUMBER,
    qrValue: whatsappUrl
  });
});

router.get('/product-link/:productId', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.productId));
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const phone = cleanPhone(WHATSAPP_NUMBER);
  const message = encodeURIComponent(
    `Hi! I'm interested in: *${product.name}*\nPrice: ${formatPrice(product.price)}\n\nCan I get more details?`
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

  const phone = cleanPhone(WHATSAPP_NUMBER);
  const statusEmoji = {
    pending: '⏳', confirmed: '✅', processing: '📦', shipped: '🚚', delivered: '🎉', cancelled: '❌'
  };
  const message = encodeURIComponent(
    `${statusEmoji[order.status] || '📋'} *Order Update: ${order.id}*\n\nStatus: ${order.status.toUpperCase()}\nTotal: ${formatPrice(order.total)}\nItems: ${order.items.length}\n\nThank you for shopping with ${APP_NAME}!`
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  res.json({
    url: whatsappUrl,
    order: { id: order.id, status: order.status }
  });
});

// ── Send notifications ─────────────────────────────────────────────
router.post('/send-order-notification', async (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const customerPhone = order.customer.phone.replace(/[^0-9+]/g, '');
  const statusEmoji = {
    pending: '⏳', confirmed: '✅', processing: '📦', shipped: '🚚', delivered: '🎉'
  };

  const itemList = order.items
    .map(i => `  • ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
    .join('\n');

  const message = `${statusEmoji[order.status] || '📋'} *${APP_NAME} Order Update*\n\n`
    + `Order: *${order.id}*\n`
    + `Status: *${order.status.toUpperCase()}*\n\n`
    + `📝 Items:\n${itemList}\n\n`
    + `💰 Total: *${formatPrice(order.total)}*\n\n`
    + `Thank you for shopping with us! Reply to this message for support.`;

  const ghalaResult = await sendViaGhala(customerPhone, message);
  if (ghalaResult) {
    return res.json(ghalaResult);
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

  const ghalaResult = await sendViaGhala(to, message);
  if (ghalaResult) {
    return res.json(ghalaResult);
  }

  res.json({
    sent: false,
    fallback: true,
    whatsappUrl: `https://wa.me/${cleanPhone(to)}?text=${encodeURIComponent(message)}`,
    message: 'Automatic sending not available. Use the WhatsApp link instead.'
  });
});

module.exports = router;
