import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import ProductCard from "../components/ProductCard";
import PageLoader from "../components/PageLoader";
import AnimatedPage from "../components/AnimatedPage";
import { getProducts, sendBotMessage } from "../api/client";

const categoryOptions = [
  "all",
  "apparel",
  "electronics",
  "footwear",
  "accessories",
  "home",
  "fitness",
];

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [botReply, setBotReply] = useState("");
  const [botLoading, setBotLoading] = useState(false);
  const MotionDiv = motion.div;

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await getProducts(category === "all" ? { search } : { search, category });
        if (mounted) {
          setProducts(data);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    fetchProducts();
    return () => {
      mounted = false;
    };
  }, [category, search]);

  const handleBotClick = async () => {
    setBotLoading(true);
    try {
      const response = await sendBotMessage("catalog");
      setBotReply(response.reply);
    } finally {
      setBotLoading(false);
    }
  };

  const resultLabel = useMemo(
    () => `${products.length} product${products.length === 1 ? "" : "s"} found`,
    [products.length],
  );

  return (
    <AnimatedPage>
      <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-sky-500 to-indigo-600 px-5 py-8 text-white shadow-sm sm:px-8 sm:py-10">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
            <Sparkles size={14} /> NEXT-GEN SHOPPING
          </span>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Stunning mobile-first commerce with live updates and WhatsApp support.
          </h1>
          <p className="max-w-2xl text-sm text-sky-100 sm:text-base">
            Browse products, checkout fast, track your order in real time, and get instant
            WhatsApp assistance.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBotClick}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
            >
              <Zap size={14} /> Try WhatsApp Bot
            </button>
            <span className="rounded-full border border-white/40 px-4 py-2 text-xs">
              {resultLabel}
            </span>
          </div>
          {botReply ? (
            <pre className="whitespace-pre-wrap rounded-2xl border border-white/20 bg-white/10 p-3 text-xs text-sky-50">
              {botLoading ? "Loading..." : botReply}
            </pre>
          ) : null}
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Search products..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none ring-sky-300 transition focus:ring dark:border-zinc-700 dark:bg-zinc-800"
            />
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold capitalize transition ${
                    category === option
                      ? "bg-sky-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <PageLoader label="Curating products..." />
        ) : (
          <MotionDiv layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </AnimatePresence>
          </MotionDiv>
        )}
      </section>
    </AnimatedPage>
  );
}

export default HomePage;
