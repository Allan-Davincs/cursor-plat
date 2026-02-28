import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-gray-950 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold">Your Cart</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{cart.itemCount} items</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cart.items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Looks like you haven't added anything yet</p>
                <Link to="/products" onClick={() => setIsCartOpen(false)} className="btn-primary">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {cart.items.map(item => (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50, height: 0 }}
                        className="flex gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900"
                      >
                        <Link
                          to={`/product/${item.slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800"
                        >
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product/${item.slug}`}
                            onClick={() => setIsCartOpen(false)}
                            className="text-sm font-semibold truncate block hover:text-primary-600 transition-colors"
                          >
                            {item.name}
                          </Link>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-primary-600">${item.price}</span>
                            {item.originalPrice > item.price && (
                              <span className="text-xs text-gray-400 line-through">${item.originalPrice}</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {!cart.freeShippingEligible && (
                  <div className="mx-6 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-center">
                    <p className="text-sm text-primary-700 dark:text-primary-300">
                      Add <span className="font-bold">${(100 - cart.subtotal).toFixed(2)}</span> more for free shipping!
                    </p>
                    <div className="mt-2 h-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${Math.min(100, (cart.subtotal / 100) * 100)}%` }} />
                    </div>
                  </div>
                )}

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Subtotal</span>
                      <span>${cart.subtotal?.toFixed(2)}</span>
                    </div>
                    {cart.savings > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Savings</span>
                        <span>-${cart.savings?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Shipping</span>
                      <span>{cart.shipping === 0 ? <span className="text-green-600 font-semibold">Free</span> : `$${cart.shipping?.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Tax</span>
                      <span>${cart.tax?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span>Total</span>
                      <span>${cart.total?.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link
                    to="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="btn-primary w-full"
                  >
                    Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
