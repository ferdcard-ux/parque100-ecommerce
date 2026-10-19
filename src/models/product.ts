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
  /** Precio anterior tachado (promo). Solo se muestra si > price. */
  previousPrice?: number | null;
  /** Marca del producto (ej. 'MCCAIN'). */
  brand?: string | null;
  /** SKU visible en ficha (por defecto ID_Producto). */
  sku?: string | null;
  /** Cantidad de contenido (ej. 2000). */
  contentQty?: number | null;
  /** Unidad de contenido (g, ml, un). */
  contentUnit?: string | null;
  /** Tipo de embalaje (ej. 'PC PAQUETE'). */
  packaging?: string | null;
  /** Ingredientes / componentes. */
  ingredients?: string | null;
  /** Conservación / restricciones de uso. */
  storage?: string | null;
  /** Inicio de vigencia promo (YYYY-MM-DD). */
  promoFrom?: string | null;
  /** Fin de vigencia promo (YYYY-MM-DD). */
  promoTo?: string | null;
  /** URL de la imagen. */
  image: string;
  /** Nombre de categoria normalizado (sin tildes). */
  category: string;
  /** Stock disponible/umbral minimo. */
  stock: number;
  /** Descripcion corta. */
  description: string;
  /** Promedio de estrellas (1 a 5) o null si no tiene calificaciones. */
  ratingAverage?: number | null;
  /** Cantidad de calificaciones de producto registradas. */
  ratingCount?: number;
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
  /** Imagen guardada en la base de datos (URL o dataURL), null si no tiene. */
  image?: string | null;
  /** Descripcion corta del producto. */
  description: string;
}

/** Estados posibles del inventario calculados desde el stock. */
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

/**
 * Campos editables de un producto en el panel admin (alta y edición
 * usan el mismo contrato para que los datos coincidan).
 */
export interface ProductUpsert {
  /** Nombre comercial. */
  Nombre: string;
  /**
   * Descripción corta. En una actualización, si se omite se conserva la
   * descripción actual y enviarla vacía la elimina. En el alta, si se omite
   * o llega vacía se usa el nombre del producto.
   */
  Descripcion?: string;
  /** Imagen (URL o dataURL). */
  Imagen?: string;
  /** Precio de venta en COP. */
  Precio_Venta: number;
  /** Precio anterior tachado (opcional). */
  Precio_Anterior?: number | null;
  /** Marca (opcional). */
  Marca?: string | null;
  /** Cantidad de contenido (opcional). */
  Contenido_Cantidad?: number | null;
  /** Unidad de contenido (opcional). */
  Contenido_Unidad?: string | null;
  /** Stock disponible. */
  Stock_Minimo: number;
  /** Categoría asociada. */
  ID_Categoria: number;
}

/** Alta de producto: mismos campos más el identificador. */
export interface ProductCreate extends ProductUpsert {
  /** Identificador único del producto. */
  ID_Producto: string;
}
