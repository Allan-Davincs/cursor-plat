import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, index = 0 }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { addToCart, loading } = useCart();

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="card-hover group"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
        )}
        <img
          src={product.images[0]}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'} ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {discount > 0 && (
          <span className="absolute top-3 left-3 badge bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            -{discount}%
          </span>
        )}

        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          className="absolute top-3 right-3 flex flex-col gap-2"
        >
          <button className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-xl shadow-md hover:bg-white dark:hover:bg-gray-900 transition-all">
            <Heart className="w-4 h-4" />
          </button>
          <Link
            to={`/product/${product.slug}`}
            className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-xl shadow-md hover:bg-white dark:hover:bg-gray-900 transition-all"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
          className="absolute bottom-0 left-0 right-0 p-3"
        >
          <button
            onClick={(e) => { e.preventDefault(); addToCart(product.id); }}
            disabled={loading || product.stock === 0}
            className="btn-primary w-full text-sm py-2.5"
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </motion.div>
      </div>

      <Link to={`/product/${product.slug}`} className="block p-4">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
            {product.category}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">({product.reviewCount})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">${product.price}</span>
          {product.originalPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
