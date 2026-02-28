import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AnimatedPage from "../components/AnimatedPage";
import PageLoader from "../components/PageLoader";
import StatusBadge from "../components/StatusBadge";
import {
  getAdminOrders,
  getAdminSummary,
  updateAdminOrderStatus,
} from "../api/client";

const statusOptions = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const money = (value) => `INR ${Number(value ?? 0).toLocaleString("en-IN")}`;

function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const loadAdminData = async () => {
    const [summaryData, ordersData] = await Promise.all([getAdminSummary(), getAdminOrders()]);
    setSummary(summaryData);
    setOrders(ordersData);
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        await loadAdminData();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const handleStatusUpdate = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await updateAdminOrderStatus(orderId, status);
      await loadAdminData();
      toast.success(`Order ${orderId} moved to ${status}`);
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Failed to update status.");
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) {
    return (
      <AnimatedPage>
        <PageLoader label="Loading admin dashboard..." />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">
        Monitor order flow and trigger realtime status updates.
      </p>

      {summary ? (
        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-300">Total Revenue</p>
            <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
              {money(summary.revenue)}
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-300">Orders</p>
            <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">{summary.orders}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-300">Products</p>
            <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
              {summary.products}
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-300">Delivered</p>
            <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
              {summary.byStatus?.delivered ?? 0}
            </p>
          </article>
        </section>
      ) : null}

      <section className="mt-5 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Update
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-100">{order.id}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {order.customer.name}
                  <p className="text-xs text-zinc-500">{order.customer.phone}</p>
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{money(order.total)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(event) => handleStatusUpdate(order.id, event.target.value)}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs outline-none dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AnimatedPage>
  );
}

export default AdminPage;
