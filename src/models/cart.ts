/**
 * @fileoverview Modelo del carrito de compras.
 */
import type { Product } from './product';

/** Linea del carrito: un producto con su cantidad seleccionada. */
export interface CartItem extends Product {
  /** Cantidad de unidades agregadas al carrito. */
  quantity: number;
}
