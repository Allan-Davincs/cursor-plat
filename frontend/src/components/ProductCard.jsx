import { motion } from "framer-motion";
import { ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const MotionArticle = motion.article;

  return (
    <MotionArticle
      layout
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition dark:border-zinc-700 dark:bg-zinc-900"
    >
      <Link to={`/product/${product.id}`} className="block overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
            {product.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Star size={13} className="fill-current" /> {product.rating}
          </span>
        </div>

        <Link
          to={`/product/${product.id}`}
          className="line-clamp-2 text-base font-semibold text-zinc-900 hover:text-sky-600 dark:text-white dark:hover:text-sky-300"
        >
          {product.name}
        </Link>

        <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-300">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <strong className="text-lg text-zinc-900 dark:text-white">
            INR {product.price.toLocaleString("en-IN")}
          </strong>
          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700"
          >
            <ShoppingCart size={14} />
            Add
          </button>
        </div>
      </div>
    </MotionArticle>
  );
}

export default ProductCard;
