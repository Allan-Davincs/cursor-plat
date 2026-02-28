function PageLoader({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-sky-500 dark:border-zinc-700 dark:border-t-sky-400" />
        <p className="text-sm text-zinc-500 dark:text-zinc-300">{label}</p>
      </div>
    </div>
  );
}

export default PageLoader;
