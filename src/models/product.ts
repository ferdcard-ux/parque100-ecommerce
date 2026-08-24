/**
 * @fileoverview Modelos de producto y categoria (dominio del catalogo).
 */

/** Producto del catalogo tal como lo consume la interfaz. */
export interface Product {
  /** Identificador en base de datos (ej. 'P001' mapeado a number). */
  id: number;
  /** Nombre comercial. */
  name: string;
  /** Precio de venta en COP. */
  price: number;
  /** URL de la imagen. */
  image: string;
  /** Nombre de categoria normalizado (sin tildes). */
  category: string;
  /** Stock disponible/umbral minimo. */
  stock: number;
  /** Descripcion corta. */
  description: string;
}

/** Categoria con su presentacion visual para la grilla del home. */
export interface Category {
  /** Identificador posicional asignado en el cliente. */
  id: number;
  /** Nombre normalizado (sin tildes). */
  name: string;
  /** Emoji representativo. */
  emoji: string;
  /** Clases Tailwind para el fondo/color del chip. */
  color: string;
  /** Clases Tailwind para el borde de la tarjeta. */
  border: string;
}

/** Fila resumida de producto para la tabla de inventario admin. */
export interface AdminProduct {
  /** Identificador del producto. */
  id: number;
  /** Nombre comercial. */
  name: string;
  /** Categoria normalizada. */
  category: string;
  /** Cantidad en stock. */
  quantity: number;
  /** Precio de venta. */
  price: number;
  /** Estado derivado segun el nivel de stock. */
  status: InventoryStatus;
}

/** Estados posibles del inventario calculados desde el stock. */
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
