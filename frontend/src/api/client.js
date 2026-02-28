import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const getProducts = async (params = {}) => {
  const response = await api.get("/products", { params });
  return response.data;
};

export const getProduct = async (productId) => {
  const response = await api.get(`/products/${productId}`);
  return response.data;
};

export const getRecommendations = async (productId) => {
  const response = await api.get(`/products/${productId}/recommendations`);
  return response.data;
};

export const getWhatsAppQr = async (params = {}) => {
  const response = await api.get("/whatsapp/qr", { params });
  return response.data;
};

export const sendBotMessage = async (message) => {
  const response = await api.post("/whatsapp/bot/message", { message });
  return response.data;
};

export const createOrder = async (payload) => {
  const response = await api.post("/orders", payload);
  return response.data;
};

export const getOrder = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export const createBriqCheckout = async (orderId) => {
  const response = await api.post("/payments/briq/checkout", { orderId });
  return response.data;
};

export const getAdminSummary = async () => {
  const response = await api.get("/admin/summary");
  return response.data;
};

export const getAdminOrders = async () => {
  const response = await api.get("/admin/orders");
  return response.data;
};

export const updateAdminOrderStatus = async (orderId, status) => {
  const response = await api.patch(`/admin/orders/${orderId}/status`, { status });
  return response.data;
};
