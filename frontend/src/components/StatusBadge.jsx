const statusStyles = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  confirmed: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  packed: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
  out_for_delivery:
    "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
};

const toLabel = (status) => status?.replaceAll("_", " ") ?? "unknown";

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-700/40 dark:text-zinc-200"}`}
    >
      {toLabel(status)}
    </span>
  );
}

export default StatusBadge;
