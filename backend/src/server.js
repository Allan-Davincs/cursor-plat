import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";
import {
  autoProgressOrder,
  createOrder,
  getOrderById,
  getProductById,
  getRecommendations,
  getStoreSummary,
  listOrders,
  listProducts,
  subscribeOrderEvents,
  updateOrderStatus,
  updatePaymentStatus,
} from "./services/store.js";
import {
  buildWhatsAppLink,
  buildWhatsAppQrImage,
  processBotMessage,
  sendWhatsAppMessage,
} from "./services/whatsapp.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") ?? ["[REDACTED]"], // pragma: allowlist secret
    credentials: true,
  }),
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "infox-backend", at: new Date().toISOString() });
});

app.get("/api/meta", (_req, res) => {
  res.json({
    appName: "InfoX Commerce API",
    whatsappSupportNumber: process.env.WHATSAPP_SUPPORT_NUMBER ?? "15550001111",
    features: [
      "realtime_orders_sse",
      "whatsapp_qr",
      "recommendations",
      "briq_payment_stub",
      "admin_dashboard_api",
    ],
  });
});

app.get("/api/products", (req, res) => {
  const minPrice = Number.parseInt(req.query.minPrice, 10);
  const maxPrice = Number.parseInt(req.query.maxPrice, 10);
  const products = listProducts({
    category: req.query.category,
    search: req.query.search,
    minPrice: Number.isNaN(minPrice) ? undefined : minPrice,
    maxPrice: Number.isNaN(maxPrice) ? undefined : maxPrice,
  });
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const product = getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }
  return res.json(product);
});

app.get("/api/products/:id/recommendations", (req, res) => {
  const recommendations = getRecommendations(req.params.id, 4);
  res.json(recommendations);
});

app.get("/api/whatsapp/qr", (req, res) => {
  const phone = req.query.phone || process.env.WHATSAPP_SUPPORT_NUMBER || "15550001111";
  const text = req.query.text || "Hi InfoX, I need help with shopping.";
  res.json({
    chatUrl: buildWhatsAppLink(phone, text),
    qrImageUrl: buildWhatsAppQrImage(phone, text),
  });
});

app.post("/api/whatsapp/bot/message", (req, res) => {
  const reply = processBotMessage(req.body.message);
  res.json({ reply });
});

app.post("/api/orders", (req, res) => {
  try {
    const order = createOrder(req.body);
    if (String(process.env.AUTO_PROGRESS_ORDERS ?? "true") === "true") {
      autoProgressOrder(order.id);
    }
    return res.status(201).json(order);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/api/orders", (_req, res) => {
  res.json(listOrders());
});

app.get("/api/orders/:id", (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }
  return res.json(order);
});

app.get("/api/orders/:id/stream", (req, res) => {
  const orderId = req.params.id;
  const existingOrder = getOrderById(orderId);
  if (!existingOrder) {
    return res.status(404).json({ message: "Order not found." });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  });
  res.write(`event: ready\ndata: ${JSON.stringify(existingOrder)}\n\n`);

  const listener = (event) => {
    if (event.orderId === orderId) {
      res.write(`event: update\ndata: ${JSON.stringify(event.order)}\n\n`);
    }
  };
  const unsubscribe = subscribeOrderEvents(listener);

  const heartbeat = setInterval(() => {
    res.write("event: ping\ndata: {}\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

app.patch("/api/orders/:id/status", async (req, res) => {
  try {
    const order = updateOrderStatus(req.params.id, req.body.status);
    if (order.whatsappNumber) {
      await sendWhatsAppMessage({
        to: order.whatsappNumber,
        message: `InfoX update: Order ${order.id} is now '${order.status}'.`,
      });
    }
    return res.json(order);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.post("/api/orders/:id/notify", async (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }
  const text =
    req.body.message ??
    `Hi ${order.customer.name || "there"}, your order ${order.id} status is '${order.status}'.`;
  const result = await sendWhatsAppMessage({
    to: order.whatsappNumber || order.customer.phone,
    message: text,
  });
  res.json(result);
});

app.post("/api/payments/briq/checkout", (req, res) => {
  const { orderId } = req.body;
  const order = getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }
  const sessionId = `briq_${Math.random().toString(36).slice(2, 11)}`;
  const checkoutUrl = `${process.env.BRIQ_CHECKOUT_URL ?? "https://sandbox.briq.example/checkout"}?session=${sessionId}`;
  updatePaymentStatus(orderId, "processing");
  return res.json({
    provider: "briq",
    sessionId,
    checkoutUrl,
    amount: order.total,
    currency: "INR",
  });
});

app.post("/api/payments/briq/webhook", (req, res) => {
  const { orderId, status } = req.body;
  try {
    const order = updatePaymentStatus(orderId, status ?? "paid");
    res.json({ ok: true, order });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

app.get("/api/admin/summary", (_req, res) => {
  res.json(getStoreSummary());
});

app.get("/api/admin/orders", (_req, res) => {
  res.json(listOrders());
});

app.patch("/api/admin/orders/:id/status", async (req, res) => {
  try {
    const order = updateOrderStatus(req.params.id, req.body.status);
    if (order.whatsappNumber) {
      await sendWhatsAppMessage({
        to: order.whatsappNumber,
        message: `InfoX admin update: Order ${order.id} moved to '${order.status}'.`,
      });
    }
    return res.json(order);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, _req, res, _next) => {
  res.status(500).json({
    message: "Something went wrong.",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

app.listen(port, () => {
  console.log(`InfoX backend running on http://localhost:${port}`);
});
