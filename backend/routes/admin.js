const express = require('express');
const router = express.Router();
const { products, orders, carts } = require('../data/store');

router.get('/dashboard', (req, res) => {
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 10).length;
  const activeCarts = Object.keys(carts).filter(k => carts[k].items.length > 0).length;

  const topProducts = products
    .map(p => {
      const orderCount = orders.reduce((sum, o) => {
        const item = o.items.find(i => i.productId === p.id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      return { id: p.id, name: p.name, sold: orderCount, revenue: orderCount * p.price };
    })
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  res.json({
    stats: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      totalProducts,
      lowStockProducts,
      activeCarts
    },
    topProducts,
    recentOrders
  });
});

router.get('/orders', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let filtered = [...orders];
  if (status) filtered = filtered.filter(o => o.status === status);
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = filtered.length;
  const start = (Number(page) - 1) * Number(limit);
  const paginated = filtered.slice(start, start + Number(limit));

  res.json({ orders: paginated, pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
});

router.put('/orders/:orderId/status', (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const order = orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = status;
  order.statusHistory.push({
    status,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${status}`
  });
  order.updatedAt = new Date().toISOString();

  res.json(order);
});

router.get('/products', (req, res) => {
  const list = products.map(p => ({
    ...p,
    totalSold: orders.reduce((sum, o) => {
      const item = o.items.find(i => i.productId === p.id);
      return sum + (item ? item.quantity : 0);
    }, 0)
  }));
  res.json(list);
});

router.put('/products/:id', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { price, stock, featured, name, description } = req.body;
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (featured !== undefined) product.featured = Boolean(featured);
  if (name) product.name = name;
  if (description) product.description = description;

  res.json(product);
});

module.exports = router;
