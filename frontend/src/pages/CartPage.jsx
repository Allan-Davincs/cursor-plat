import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";
import { useCart } from "../context/CartContext";

function CartPage() {
  const { items, totals, updateQuantity, removeFromCart } = useCart();
  const MotionArticle = motion.article;

  return (
    <AnimatedPage>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Your Cart</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-300">
          {totals.totalItems} item{totals.totalItems === 1 ? "" : "s"}
        </p>
      </div>

      {items.length === 0 ? (
        <section className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <ShoppingBag size={34} className="mx-auto text-zinc-400" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            Cart is empty
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-300">
            Add products from the shop to get started.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Browse products
          </Link>
        </section>
      ) : (
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((entry) => (
                <MotionArticle
                  key={entry.product.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-[88px_1fr] gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <img
                    src={entry.product.image}
                    alt={entry.product.name}
                    className="h-24 w-full rounded-xl object-cover"
                  />
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {entry.product.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-300">
                          INR {entry.product.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(entry.product.id)}
                        className="rounded-lg p-1 text-zinc-400 hover:text-rose-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(entry.product.id, Math.max(0, entry.quantity - 1))
                          }
                          className="px-2 py-1 text-zinc-600 dark:text-zinc-200"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">
                          {entry.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(entry.product.id, entry.quantity + 1)}
                          className="px-2 py-1 text-zinc-600 dark:text-zinc-200"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <strong className="text-sm text-zinc-900 dark:text-white">
                        INR {(entry.quantity * entry.product.price).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                </MotionArticle>
              ))}
            </AnimatePresence>
          </div>

          <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Order Summary</h3>
            <div className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <span>INR {totals.subtotal.toLocaleString("en-IN")}</span>
              </p>
              <p className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {totals.shipping === 0
                    ? "Free"
                    : `INR ${totals.shipping.toLocaleString("en-IN")}`}
                </span>
              </p>
              <p className="mt-3 flex justify-between border-t border-zinc-200 pt-3 text-base font-bold text-zinc-900 dark:border-zinc-700 dark:text-white">
                <span>Total</span>
                <span>INR {totals.total.toLocaleString("en-IN")}</span>
              </p>
            </div>
            <Link
              to="/checkout"
              className="mt-4 block rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Proceed to checkout
            </Link>
          </aside>
        </section>
      )}
    </AnimatedPage>
  );
}

export default CartPage;
