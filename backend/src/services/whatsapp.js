import axios from "axios";
import { getOrderById, listProducts } from "./store.js";

const sanitizePhone = (phone) => String(phone ?? "").replace(/[^\d]/g, "");

export const buildWhatsAppLink = (phone, text = "Hi, I want to shop with InfoX!") => {
  const number = sanitizePhone(phone);
  const base = number ? `https://wa.me/${number}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
};

export const buildWhatsAppQrImage = (phone, text) => {
  const chatUrl = buildWhatsAppLink(phone, text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(chatUrl)}`;
};

export const sendWhatsAppMessage = async ({ to, message }) => {
  const endpoint = process.env.WHATSAPP_NOTIFY_URL;
  const token = process.env.WHATSAPP_NOTIFY_TOKEN;

  if (!endpoint) {
    return {
      ok: true,
      mode: "mock",
      message: "WHATSAPP_NOTIFY_URL is not configured. Notification logged locally.",
      payload: { to, message },
    };
  }

  const response = await axios.post(
    endpoint,
    { to, message },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 5000,
    },
  );

  return {
    ok: true,
    mode: "live",
    status: response.status,
    data: response.data,
  };
};

const getQuickCatalog = () =>
  listProducts()
    .slice(0, 5)
    .map((product) => `• ${product.name} (${product.category}) - INR ${product.price}`)
    .join("\n");

export const processBotMessage = (rawMessage) => {
  const message = String(rawMessage ?? "").trim().toLowerCase();
  if (!message) {
    return "Send 'help' to view available commands.";
  }

  if (message === "help") {
    return [
      "InfoX WhatsApp Bot Commands:",
      "• catalog - Show top products",
      "• status <ORDER_ID> - Track your order",
      "• recommend <category> - Suggestions by category",
      "• support - Human support chat link",
    ].join("\n");
  }

  if (message === "catalog") {
    return `Top picks right now:\n${getQuickCatalog()}`;
  }

  if (message.startsWith("status ")) {
    const orderId = message.replace("status ", "").trim().toUpperCase();
    const order = getOrderById(orderId);
    if (!order) {
      return `Sorry, I could not find ${orderId}. Please verify your order ID.`;
    }
    return `Order ${order.id} is currently '${order.status}'. Payment: ${order.paymentStatus}.`;
  }

  if (message.startsWith("recommend ")) {
    const category = message.replace("recommend ", "").trim();
    const picks = listProducts({ category }).slice(0, 4);
    if (!picks.length) {
      return `No products found in '${category}'. Try categories like apparel, electronics, home or accessories.`;
    }
    const lines = picks.map((item) => `• ${item.name} - INR ${item.price}`);
    return `Recommended in ${category}:\n${lines.join("\n")}`;
  }

  if (message === "support") {
    return "Connect with our support instantly: https://wa.me/15550001111?text=I%20need%20support";
  }

  return "I did not understand that. Send 'help' for available commands.";
};
