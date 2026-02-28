const statusOrder = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

const statusLabels = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

const getProgress = (status) => {
  const index = statusOrder.indexOf(status);
  if (index < 0) {
    return 0;
  }
  return ((index + 1) / statusOrder.length) * 100;
};

function OrderTimeline({ order }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Tracking timeline</h3>
      <div className="mt-4 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${getProgress(order.status)}%` }}
        />
      </div>

      <ol className="mt-5 space-y-3">
        {statusOrder.map((status) => {
          const currentIndex = statusOrder.indexOf(order.status);
          const itemIndex = statusOrder.indexOf(status);
          const active = itemIndex <= currentIndex;
          return (
            <li key={status} className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
              />
              <span
                className={`text-sm ${active ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}
              >
                {statusLabels[status]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default OrderTimeline;
