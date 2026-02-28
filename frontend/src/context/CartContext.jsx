import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "infox-cart-v1";

const loadCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_error) {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    setItems((previous) => {
      const existing = previous.find((entry) => entry.product.id === product.id);
      if (existing) {
        return previous.map((entry) =>
          entry.product.id === product.id
            ? { ...entry, quantity: entry.quantity + quantity }
            : entry,
        );
      }
      return [...previous, { product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setItems((previous) => previous.filter((entry) => entry.product.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((previous) =>
      previous.map((entry) =>
        entry.product.id === productId ? { ...entry, quantity } : entry,
      ),
    );
  };

  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, entry) => sum + entry.quantity, 0);
    const subtotal = items.reduce(
      (sum, entry) => sum + entry.quantity * entry.product.price,
      0,
    );
    const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 149;
    return {
      totalItems,
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      totals,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [items, totals],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return context;
};
