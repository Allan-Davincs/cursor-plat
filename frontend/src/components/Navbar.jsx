import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, ShoppingBag, ShoppingCart, Sun, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import WhatsAppQR from "./WhatsAppQR";

const links = [
  { label: "Shop", to: "/" },
  { label: "Track Order", to: "/track" },
  { label: "Admin", to: "/admin" },
];

const navClass = ({ isActive }) =>
  `rounded-full px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
  }`;

function Navbar() {
  const { totals } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartLabel = useMemo(
    () => `${totals.totalItems} item${totals.totalItems === 1 ? "" : "s"}`,
    [totals.totalItems],
  );

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/90 bg-white/90 backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/90">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-600 text-white">
            <ShoppingBag size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">InfoX Commerce</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Fast. Stunning. Smart.</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <WhatsAppQR compact />
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-zinc-200 p-2 text-zinc-600 transition hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:text-white"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-sky-600 dark:hover:bg-sky-500"
          >
            <ShoppingCart size={15} />
            <span>{cartLabel}</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="rounded-xl border border-zinc-200 p-2 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200 md:hidden"
          aria-label="Open navigation"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-700 md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center gap-2">
              <Link
                to="/cart"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm font-semibold text-white dark:bg-sky-600"
              >
                <ShoppingCart size={14} /> {cartLabel}
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
            </div>
            <div className="mt-3">
              <WhatsAppQR />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
