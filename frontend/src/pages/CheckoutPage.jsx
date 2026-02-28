import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AnimatedPage from "../components/AnimatedPage";
import { createBriqCheckout, createOrder } from "../api/client";
import { useCart } from "../context/CartContext";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  note: "",
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totals, clearCart } = useCart();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [paymentPreview, setPaymentPreview] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (items.length === 0) {
      toast.error("Add products to cart before checkout.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        },
        whatsappNumber: form.phone,
        note: form.note,
        items: items.map((entry) => ({
          productId: entry.product.id,
          quantity: entry.quantity,
        })),
      });

      const checkout = await createBriqCheckout(order.id);
      setPaymentPreview(checkout);
      clearCart();
      toast.success(`Order ${order.id} placed successfully!`);
      navigate(`/track/${order.id}`, { state: { checkout } });
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Checkout</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">
        Secure express checkout with Briq integration and WhatsApp updates.
      </p>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-200">Name</span>
              <input
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 outline-none ring-sky-300 focus:ring dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-200">Email</span>
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 outline-none ring-sky-300 focus:ring dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
          </div>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-200">Phone (WhatsApp)</span>
            <input
              required
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 outline-none ring-sky-300 focus:ring dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-200">Delivery address</span>
            <textarea
              required
              rows={3}
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 outline-none ring-sky-300 focus:ring dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-200">Order note (optional)</span>
            <textarea
              rows={2}
              name="note"
              value={form.note}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 outline-none ring-sky-300 focus:ring dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>

          <button
            disabled={submitting}
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Processing..." : "Pay with Briq & Place Order"}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Summary</h3>
          <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <p className="flex justify-between">
              <span>Items</span>
              <span>{totals.totalItems}</span>
            </p>
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
            <p className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-900 dark:border-zinc-700 dark:text-white">
              <span>Total</span>
              <span>INR {totals.total.toLocaleString("en-IN")}</span>
            </p>
          </div>

          {paymentPreview ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
              <p className="font-semibold">Briq Session: {paymentPreview.sessionId}</p>
              <a href={paymentPreview.checkoutUrl} target="_blank" rel="noreferrer" className="underline">
                Open checkout preview
              </a>
            </div>
          ) : null}
        </aside>
      </section>
    </AnimatedPage>
  );
}

export default CheckoutPage;
