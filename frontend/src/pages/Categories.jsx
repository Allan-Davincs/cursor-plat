import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { productApi } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

const categoryImages = {
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600',
  clothing: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600',
  accessories: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600',
  home: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600',
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi.getCategories()
      .then(r => setCategories(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen">
      <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-2">Shop by Category</h1>
          <p className="text-gray-500 dark:text-gray-400">Browse our curated collections</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/products?category=${cat.id}`}
                className="group block relative h-72 rounded-3xl overflow-hidden"
              >
                <img
                  src={categoryImages[cat.id]}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h2 className="text-2xl font-bold text-white mb-1">{cat.name}</h2>
                  <p className="text-white/70 mb-3">{cat.count} products</p>
                  <span className="inline-flex items-center gap-1 text-white font-medium text-sm group-hover:gap-2 transition-all">
                    Shop Now <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
