const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');

dotenv.config();

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payments');
const whatsappRoutes = require('./routes/whatsapp');
const adminRoutes = require('./routes/admin');

const app = express();
const APP_NAME = process.env.APP_NAME || 'ShopHub';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(limiter);
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    app: APP_NAME,
    timestamp: new Date().toISOString(),
    services: {
      briq: !!process.env.BRIQ_API_KEY,
      snippe: !!process.env.SNIPPE_API_KEY,
      ghala: !!process.env.GHALA_WEBHOOK_URL,
      whatsapp: process.env.WHATSAPP_NUMBER || 'not configured'
    }
  });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`${APP_NAME} server running on port ${PORT}`);
  console.log(`Briq API: ${process.env.BRIQ_API_URL || 'not configured'}`);
  console.log(`Snippe API: ${process.env.SNIPPE_API_URL || 'not configured'}`);
  console.log(`Ghala WhatsApp: ${process.env.GHALA_WEBHOOK_URL ? 'configured' : 'not configured'}`);
  console.log(`WhatsApp: ${process.env.WHATSAPP_NUMBER || 'not configured'}`);
  console.log(`Currency: ${process.env.CURRENCY || 'TZS'}`);
});

module.exports = app;
