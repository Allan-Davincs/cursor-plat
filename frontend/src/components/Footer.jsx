function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white/80 py-6 dark:border-zinc-700 dark:bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:text-zinc-400">
        <p>© {new Date().getFullYear()} InfoX Commerce. Built for speed and mobile-first UX.</p>
        <p>Realtime orders • WhatsApp bot • Briq-ready payments</p>
      </div>
    </footer>
  );
}

export default Footer;
