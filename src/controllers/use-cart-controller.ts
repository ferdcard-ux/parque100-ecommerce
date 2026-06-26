import { useState, useCallback, useMemo } from 'react';
import type { Product, CartItem, DeliveryAddress } from '../models';
import { calculateShipping, calculateTotal } from '../utils';

export function useCartController() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const shipping = useMemo(() => calculateShipping(subtotal), [subtotal]);

  const total = useMemo(() => calculateTotal(subtotal), [subtotal]);

  const getRecommendedItems = useCallback(
    (excludeIds: number[], allProducts: Product[], limit = 4) => {
      return allProducts
        .filter((p) => !excludeIds.includes(p.id))
        .slice(0, limit);
    },
    []
  );

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearItems,
    itemCount,
    subtotal,
    shipping,
    total,
    getRecommendedItems,
  };
}
