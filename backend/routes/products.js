const express = require('express');
const router = express.Router();
const { products, categories } = require('../data/store');

router.get('/', (req, res) => {
  let filtered = [...products];
  const { category, search, sort, minPrice, maxPrice, featured, limit, page = 1 } = req.query;

  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  if (minPrice) filtered = filtered.filter(p => p.price >= Number(minPrice));
  if (maxPrice) filtered = filtered.filter(p => p.price <= Number(maxPrice));
  if (featured === 'true') filtered = filtered.filter(p => p.featured);

  if (sort) {
    switch (sort) {
      case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => b.rating - a.rating); break;
      case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'newest': filtered.sort((a, b) => b.id - a.id); break;
    }
  }

  const total = filtered.length;
  const perPage = limit ? Number(limit) : 12;
  const currentPage = Number(page);
  const totalPages = Math.ceil(total / perPage);
  const start = (currentPage - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  res.json({
    products: paginated,
    pagination: { total, page: currentPage, perPage, totalPages }
  });
});

router.get('/categories', (req, res) => {
  res.json(categories);
});

router.get('/featured', (req, res) => {
  const featured = products.filter(p => p.featured);
  res.json(featured);
});

router.get('/recommendations/:id', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const recommendations = products
    .filter(p => p.id !== product.id)
    .map(p => {
      let score = 0;
      if (p.category === product.category) score += 3;
      if (p.subcategory === product.subcategory) score += 2;
      const priceDiff = Math.abs(p.price - product.price) / product.price;
      if (priceDiff < 0.3) score += 2;
      const sharedTags = p.tags.filter(t => product.tags.includes(t)).length;
      score += sharedTags;
      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ score, ...p }) => p);

  res.json(recommendations);
});

router.get('/:idOrSlug', (req, res) => {
  const param = req.params.idOrSlug;
  const product = products.find(p =>
    p.id === Number(param) || p.slug === param
  );
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

module.exports = router;
