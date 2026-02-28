import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../lib/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0, total: 0, itemCount: 0, shipping: 0, tax: 0, savings: 0, freeShippingEligible: false });
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await cartApi.get();
      setCart(data);
    } catch {
      // Silent fail on initial load
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const { data } = await cartApi.add(productId, quantity);
      setCart(data);
      toast.success('Added to cart!', { icon: '🛒', style: { borderRadius: '12px', background: '#333', color: '#fff' } });
      setIsCartOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const { data } = await cartApi.update(productId, quantity);
      setCart(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update cart');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await cartApi.remove(productId);
      setCart(data);
      toast.success('Removed from cart', { style: { borderRadius: '12px', background: '#333', color: '#fff' } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      const { data } = await cartApi.clear();
      setCart(data);
    } catch {
      // Silent fail
    }
  };

  return (
    <CartContext.Provider value={{
      cart, loading, isCartOpen, setIsCartOpen,
      addToCart, updateQuantity, removeFromCart, clearCart, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
