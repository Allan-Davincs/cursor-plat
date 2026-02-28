import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('sessionId', sessionId);
  }
  config.headers['x-session-id'] = sessionId;
  return config;
});

export const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (idOrSlug) => api.get(`/products/${idOrSlug}`),
  getFeatured: () => api.get('/products/featured'),
  getCategories: () => api.get('/products/categories'),
  getRecommendations: (id) => api.get(`/products/recommendations/${id}`),
};

export const cartApi = {
  get: () => api.get('/cart'),
  add: (productId, quantity = 1) => api.post('/cart/add', { productId, quantity }),
  update: (productId, quantity) => api.put('/cart/update', { productId, quantity }),
  remove: (productId) => api.delete(`/cart/remove/${productId}`),
  clear: () => api.delete('/cart/clear'),
};

export const orderApi = {
  create: (data) => api.post('/orders', { ...data, sessionId: localStorage.getItem('sessionId') }),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  track: (orderId) => api.get(`/orders/${orderId}/track`),
};

export const paymentApi = {
  getMethods: () => api.get('/payments/methods'),
  initiate: (orderId, method, phoneNumber) => api.post('/payments/initiate', { orderId, method, phoneNumber }),
  getStatus: (paymentId) => api.get(`/payments/status/${paymentId}`),
};

export const whatsappApi = {
  getQrData: () => api.get('/whatsapp/qr-data'),
  getProductLink: (productId) => api.get(`/whatsapp/product-link/${productId}`),
  getOrderUpdate: (orderId) => api.get(`/whatsapp/order-update/${orderId}`),
  sendOrderNotification: (orderId) => api.post('/whatsapp/send-order-notification', { orderId }),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (orderId, status, note) => api.put(`/admin/orders/${orderId}/status`, { status, note }),
  getProducts: () => api.get('/admin/products'),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
};

export default api;
