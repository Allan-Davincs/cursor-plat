import { EventEmitter } from "node:events";
import products from "../data/products.js";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const statusTimelineLabel = {
  pending: "Order placed",
  confirmed: "Order confirmed",
  packed: "Packed at warehouse",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered successfully",
  cancelled: "Order cancelled",
};

const orders = new Map();
const orderEvents = new EventEmitter();

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const generateOrderId = () =>
  `ORD-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const listProducts = (filters = {}) => {
  const { category, minPrice, maxPrice, search } = filters;
  return products.filter((product) => {
    const byCategory = category ? product.category === category : true;
    const byMinPrice = Number.isFinite(minPrice) ? product.price >= minPrice : true;
    const byMaxPrice = Number.isFinite(maxPrice) ? product.price <= maxPrice : true;
    const bySearch = search
      ? `${product.name} ${product.description}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true;
    return byCategory && byMinPrice && byMaxPrice && bySearch;
  });
};

export const getProductById = (productId) =>
  products.find((product) => product.id === productId) ?? null;

export const getRecommendations = (productId, limit = 4) => {
  const product = getProductById(productId);
  if (!product) {
    return [];
  }

  const recs = products
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => {
      const sameCategoryBoost = candidate.category === product.category ? 35 : 0;
      const priceDelta = Math.abs(candidate.price - product.price);
      const priceBoost = clamp(30 - Math.round(priceDelta / 500), 0, 30);
      const ratingBoost = Math.round(candidate.rating * 8);
      return {
        score: sameCategoryBoost + priceBoost + ratingBoost,
        product: candidate,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);

  return recs;
};

const buildTimelineEntry = (status) => ({
  status,
  label: statusTimelineLabel[status] ?? "Order update",
  at: new Date().toISOString(),
});

const emitOrderUpdate = (order, context = "status_changed") => {
  orderEvents.emit("order-updated", {
    orderId: order.id,
    context,
    order,
  });
};

const buildLineItems = (items = []) =>
  items
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) {
        return null;
      }
      const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;
      return {
        productId: product.id,
        quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
        name: product.name,
      };
    })
    .filter(Boolean);

export const createOrder = ({ customer, items, note, whatsappNumber }) => {
  const lineItems = buildLineItems(items);
  if (lineItems.length === 0) {
    throw new Error("Order must contain at least one valid product.");
  }

  const total = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const order = {
    id: generateOrderId(),
    customer: {
      name: customer?.name ?? "Guest",
      phone: customer?.phone ?? "",
      address: customer?.address ?? "",
      email: customer?.email ?? "",
    },
    items: lineItems,
    total,
    note: note ?? "",
    whatsappNumber: whatsappNumber ?? customer?.phone ?? "",
    status: "pending",
    paymentStatus: "initiated",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [buildTimelineEntry("pending")],
  };

  orders.set(order.id, order);
  emitOrderUpdate(order, "order_created");
  return order;
};

export const listOrders = () =>
  Array.from(orders.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

export const getOrderById = (orderId) => orders.get(orderId) ?? null;

export const updateOrderStatus = (orderId, nextStatus) => {
  const order = getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found.");
  }
  if (!ORDER_STATUSES.includes(nextStatus)) {
    throw new Error("Invalid order status.");
  }
  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();
  order.timeline.push(buildTimelineEntry(nextStatus));
  emitOrderUpdate(order, "status_changed");
  return order;
};

export const updatePaymentStatus = (orderId, paymentStatus) => {
  const order = getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found.");
  }
  order.paymentStatus = paymentStatus;
  order.updatedAt = new Date().toISOString();
  emitOrderUpdate(order, "payment_updated");
  return order;
};

export const subscribeOrderEvents = (handler) => {
  orderEvents.on("order-updated", handler);
  return () => {
    orderEvents.off("order-updated", handler);
  };
};

export const autoProgressOrder = (orderId) => {
  const steps = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
  steps.forEach((status, index) => {
    setTimeout(() => {
      const order = getOrderById(orderId);
      if (!order || order.status === "cancelled" || order.status === "delivered") {
        return;
      }
      updateOrderStatus(orderId, status);
    }, (index + 1) * 4500);
  });
};

export const getStoreSummary = () => {
  const allOrders = listOrders();
  const revenue = allOrders.reduce((sum, order) => sum + order.total, 0);
  const byStatus = ORDER_STATUSES.reduce(
    (acc, status) => ({
      ...acc,
      [status]: allOrders.filter((order) => order.status === status).length,
    }),
    {},
  );

  return {
    products: products.length,
    orders: allOrders.length,
    revenue,
    byStatus,
  };
};
