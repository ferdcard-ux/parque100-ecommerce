/**
 * @fileoverview Modelos de calificaciones.
 * Contratos de calificaciones de 1 a 5 estrellas (producto, pedido, envio).
 */

/** Tipo de calificacion. */
export type RatingType = 'producto' | 'pedido' | 'envio';

/** Calificacion tal como la expone la API. */
export interface Rating {
  /** Identificador de la calificacion. */
  ID_Calificacion: number;
  /** Usuario que califico (opcional). */
  ID_Usuario: number | null;
  /** Producto calificado (solo tipo producto). */
  ID_Producto: string | null;
  /** Pedido calificado (tipos pedido y envio). */
  ID_Pedido: number | null;
  /** Tipo de calificacion. */
  Tipo: RatingType;
  /** Estrellas de 1 a 5. */
  Estrellas: number;
  /** Comentario opcional. */
  Comentario: string | null;
  /** Fecha de la calificacion. */
  Fecha: string;
}

/** Payload para crear una calificacion. */
export interface RatingCreate {
  /** Usuario que califica. */
  ID_Usuario?: number | null;
  /** Producto (requerido si Tipo es producto). */
  ID_Producto?: string;
  /** Pedido (requerido si Tipo es pedido o envio). */
  ID_Pedido?: number;
  /** Tipo de calificacion. */
  Tipo: RatingType;
  /** Estrellas de 1 a 5. */
  Estrellas: number;
  /** Comentario opcional (max 255). */
  Comentario?: string;
}

/** Resumen de calificaciones de un producto. */
export interface RatingSummary {
  /** Promedio de estrellas o null sin calificaciones. */
  promedio: number | null;
  /** Total de calificaciones. */
  total: number;
}
