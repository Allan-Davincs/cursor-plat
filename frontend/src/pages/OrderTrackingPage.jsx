import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AnimatedPage from "../components/AnimatedPage";
import OrderTimeline from "../components/OrderTimeline";
import PageLoader from "../components/PageLoader";
import StatusBadge from "../components/StatusBadge";
import { getOrder } from "../api/client";
import { useOrderStream } from "../hooks/useOrderStream";

function OrderTrackingPage() {
  const { orderId: routeOrderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState(routeOrderId ?? "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeOrderId));

  const loadOrder = useCallback(async (value) => {
    if (!value) {
      setOrder(null);
      return;
    }
    setLoading(true);
    try {
      const data = await getOrder(value);
      setOrder(data);
    } catch {
      setOrder(null);
      toast.error("Order not found.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (routeOrderId) {
      loadOrder(routeOrderId);
    }
  }, [routeOrderId, loadOrder]);

  useOrderStream(
    order?.id,
    useCallback((nextOrder) => {
      setOrder(nextOrder);
    }, []),
  );

  const handleTrack = (event) => {
    event.preventDefault();
    const normalized = searchId.trim().toUpperCase();
    if (!normalized) {
      return;
    }
    navigate(`/track/${normalized}`);
  };

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Real-time order tracking</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">
        Watch live order updates and receive WhatsApp notifications instantly.
      </p>

      <form
        onSubmit={handleTrack}
        className="mt-5 flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 sm:flex-row"
      >
        <input
          value={searchId}
          onChange={(event) => setSearchId(event.target.value)}
          placeholder="Enter order ID (e.g., ORD-2026-ABC123)"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          type="submit"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Track
        </button>
      </form>

      {loading ? (
        <PageLoader label="Fetching latest status..." />
      ) : order ? (
        <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <article className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{order.id}</h2>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-300">
              Payment:{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-100">
                {order.paymentStatus}
              </span>
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-300">
              Customer: {order.customer.name} • {order.customer.phone}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-300">{order.customer.address}</p>
            <p className="text-base font-semibold text-zinc-900 dark:text-white">
              Total: INR {order.total.toLocaleString("en-IN")}
            </p>

            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-300">
                Latest timeline events
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-200">
                {order.timeline
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map((item) => (
                    <li key={`${item.status}-${item.at}`}>
                      {item.label} • {new Date(item.at).toLocaleTimeString()}
                    </li>
                  ))}
              </ul>
            </div>

            {location.state?.checkout ? (
              <a
                href={location.state.checkout.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
              >
                Open Briq Checkout
              </a>
            ) : null}
          </article>

          <OrderTimeline order={order} />
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          Enter an order ID to start tracking.
        </section>
      )}
    </AnimatedPage>
  );
}

export default OrderTrackingPage;
