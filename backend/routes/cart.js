const express = require('express');
const router = express.Router();
const { products, carts } = require('../data/store');

function getSessionId(req) {
  return req.headers['x-session-id'] || 'default';
}

function getCart(sessionId) {
  if (!carts[sessionId]) carts[sessionId] = { items: [], updatedAt: new Date() };
  return carts[sessionId];
}

const FREE_SHIPPING_THRESHOLD = 250000;
const SHIPPING_FEE = 5000;
const TAX_RATE = 0.18;

function calculateTotals(cart) {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const savings = cart.items.reduce((sum, item) => sum + (item.originalPrice - item.price) * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + tax;
  return {
    items: cart.items,
    subtotal,
    savings,
    shipping,
    tax,
    total,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    freeShippingEligible: subtotal >= FREE_SHIPPING_THRESHOLD,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    currency: process.env.CURRENCY || 'TZS'
  };
}

router.get('/', (req, res) => {
  const cart = getCart(getSessionId(req));
  res.json(calculateTotals(cart));
});

router.post('/add', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = products.find(p => p.id === Number(productId));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

  const cart = getCart(getSessionId(req));
  const existing = cart.items.find(i => i.productId === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      quantity,
      slug: product.slug
    });
  }
  cart.updatedAt = new Date();
  res.json(calculateTotals(cart));
});

router.put('/update', (req, res) => {
  const { productId, quantity } = req.body;
  const cart = getCart(getSessionId(req));
  const item = cart.items.find(i => i.productId === Number(productId));
  if (!item) return res.status(404).json({ error: 'Item not in cart' });

  if (quantity <= 0) {
    cart.items = cart.items.filter(i => i.productId !== Number(productId));
  } else {
    const product = products.find(p => p.id === Number(productId));
    if (product && product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    item.quantity = quantity;
  }
  cart.updatedAt = new Date();
  res.json(calculateTotals(cart));
});

router.delete('/remove/:productId', (req, res) => {
  const cart = getCart(getSessionId(req));
  cart.items = cart.items.filter(i => i.productId !== Number(req.params.productId));
  cart.updatedAt = new Date();
  res.json(calculateTotals(cart));
});

router.delete('/clear', (req, res) => {
  const cart = getCart(getSessionId(req));
  cart.items = [];
  cart.updatedAt = new Date();
  res.json(calculateTotals(cart));
});

module.exports = router;
