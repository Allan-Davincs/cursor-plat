import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Star } from "lucide-react";
import { getProduct, getRecommendations } from "../api/client";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import PageLoader from "../components/PageLoader";
import AnimatedPage from "../components/AnimatedPage";
import WhatsAppQR from "../components/WhatsAppQR";

function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productData, recData] = await Promise.all([
          getProduct(id),
          getRecommendations(id),
        ]);
        if (mounted) {
          setProduct(productData);
          setRecommendations(recData);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <AnimatedPage>
        <PageLoader label="Loading product details..." />
      </AnimatedPage>
    );
  }

  if (!product) {
    return (
      <AnimatedPage>
        <p className="text-sm text-zinc-500 dark:text-zinc-300">Product not found.</p>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
      >
        <ArrowLeft size={14} /> Back to catalog
      </Link>

      <section className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <img src={product.image} alt={product.name} className="h-full min-h-72 w-full object-cover" />
        </div>
        <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {product.category}
          </span>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{product.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{product.description}</p>
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <Star size={15} className="fill-current" /> {product.rating} customer rating
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            INR {product.price.toLocaleString("en-IN")}
          </p>
          <button
            type="button"
            onClick={() => addToCart(product)}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <ShoppingCart size={16} />
            Add to cart
          </button>
          <div className="pt-2">
            <WhatsAppQR
              text={`Hi InfoX, I am interested in ${product.name}. Can you help me order?`}
            />
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">You might also like</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recommendations.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </AnimatedPage>
  );
}

export default ProductPage;
