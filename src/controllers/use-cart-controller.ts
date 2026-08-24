/**
 * @fileoverview Controlador del carrito de compras.
 * Hook React con la logica de estado del carrito: agregar/quitar
 * productos, actualizar cantidades y derivar totales (item count,
 * subtotal, envio y total) usando las utilidades de formatters.
 */
import { useState, useCallback, useMemo } from 'react';
import type { Product, CartItem, DeliveryAddress } from '../models';
import { calculateShipping, calculateTotal } from '../utils';

/**
 * Controlador del carrito.
 *
 * @returns Objeto con estado y acciones del carrito.
 * @property {CartItem[]} items - Lineas actuales del carrito.
 * @property {Function} addItem - Agrega un producto (o suma 1 si ya existe).
 * @property {Function} removeItem - Elimina una linea por id de producto.
 * @property {Function} updateQuantity - Cambia la cantidad; <=0 elimina.
 * @property {Function} clearItems - Vacia el carrito.
 * @property {number} itemCount - Unidades totales en el carrito.
 * @property {number} subtotal - Suma precio * cantidad.
 * @property {number} shipping - Costo de envio segun umbral.
 * @property {number} total - Subtotal + envio.
 * @property {Function} getRecommendedItems - Productos sugeridos excluyendo ids.
 */
export function useCartController() {
  const [items, setItems] = useState<CartItem[]>([]);

  /** Agrega un producto al carrito o incrementa su cantidad en 1. */
  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  /** Elimina del carrito la linea correspondiente al producto dado. */
  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /** Actualiza la cantidad de una linea; si es <= 0 la elimina. */
  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }, []);

  /** Vacia todas las lineas del carrito. */
  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  /** Total de unidades (memoizado). */
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  /** Suma de precio por cantidad de cada linea (memoizado). */
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  /** Envio aplicable segun umbral de envio gratis (memoizado). */
  const shipping = useMemo(() => calculateShipping(subtotal), [subtotal]);

  /** Total a pagar = subtotal + envio (memoizado). */
  const total = useMemo(() => calculateTotal(subtotal), [subtotal]);

  /**
   * Sugiere productos complementarios excluyendo los ya presentes.
   *
   * @param {number[]} excludeIds - Ids a excluir (los del carrito).
   * @param {Product[]} allProducts - Catalogo completo disponible.
   * @param {number} limit - Maximo de sugerencias (4 por defecto).
   * @returns {Product[]} Lista de productos sugeridos.
   */
  const getRecommendedItems = useCallback(
    (excludeIds: number[], allProducts: Product[], limit = 4) => {
      return allProducts
        .filter((p) => !excludeIds.includes(p.id))
        .slice(0, limit);
    },
    [],
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
