/**
 * @fileoverview Constantes globales de la aplicacion.
 * Valores de negocio, identidad visual y etiquetas de estado
 * compartidos por servicios, controladores y vistas.
 */

/** Todos los envios son sin costo: umbral y tarifa en cero. */
export const FREE_SHIPPING_THRESHOLD = 0;

/** Costo fijo del envio (COP): 0, no se cobra envio. */
export const SHIPPING_COST = 0;

/** Estimacion de entrega en minutos mostrada al usuario. */
export const DELIVERY_ESTIMATE_MINUTES = '45-60';

/** Prefijo de los identificadores de pedido generados en cliente. */
export const ORDER_ID_PREFIX = 'TP';

/** Identidad de la aplicacion. */
export const APP_NAME = 'Tienda Parque 100';

/** Aviso de posible demora en el despacho mostrado en confirmacion y detalle activo. */
export const DISPATCH_DELAY_WARNING = 'Su pedido podría tardar un poco en ser despachado debido al proceso de entregas en curso. Le pedimos un momento de paciencia mientras finalizamos la gestión.';

/** Estados del ciclo de vida de un pedido tal como los guarda la BD. */
export const ORDER_ESTADOS = ['pendiente', 'preparando', 'enviando', 'entregado', 'cancelado'] as const;

/** Pasos del indicador de progreso de un pedido (orden del tracker). */
export const ORDER_TRACKER_STEPS = ['Pendiente', 'Preparando', 'En envio', 'Entregado'] as const;

/**
 * Metadatos de presentacion por estado de pedido: etiqueta legible,
 * clases del badge y posicion dentro del tracker.
 */
export const ORDER_STATUS_META: Record<string, { label: string; badgeClass: string; step: number }> = {
  pendiente: { label: 'Pendiente', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200', step: 0 },
  preparando: { label: 'En preparacion', badgeClass: 'bg-orange-100 text-orange-700 border-orange-200', step: 1 },
  enviando: { label: 'En envio', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200', step: 2 },
  entregado: { label: 'Entregado', badgeClass: 'bg-green-100 text-green-700 border-green-200', step: 3 },
  cancelado: { label: 'Cancelado', badgeClass: 'bg-red-100 text-red-700 border-red-200', step: -1 },
};

/** Motivos predefinidos de cancelacion para el cliente (mas opcion de texto libre en la UI). */
export const CANCEL_REASONS = [
  'Cambié de opinión',
  'Pedí por error',
  'Demora en la entrega',
  'Encontré mejores precios',
] as const;

/** Motivos predefinidos de cancelacion para el administrador (operativos, distintos a los del cliente). */
export const ADMIN_CANCEL_REASONS = [
  'Sin stock disponible',
  'Producto no disponible',
  'Datos de entrega incompletos',
  'Pago no confirmado',
  'Solicitado por el cliente por otro medio',
] as const;

/** Aviso de reembolso mostrado al cancelar un pedido. */
export const CANCEL_REFUND_NOTICE = 'Tras la cancelación, debes acordar con el propietario de la tienda el reembolso del pago.';

/** Devuelve metadatos del estado o valores por defecto para estados desconocidos. */
export function orderStatusMeta(estado: string): { label: string; badgeClass: string; step: number } {
  return ORDER_STATUS_META[estado] ?? { label: estado, badgeClass: 'bg-gray-100 text-gray-600 border-gray-200', step: 0 };
}
export const APP_TAGLINE = 'Tu tienda de confianza';
export const APP_DESCRIPTION = 'Productos frescos a tu puerta';
export const APP_ADDRESS = 'Carrera 100 #42f-100, Barranquilla';
export const APP_PHONE = '(304) 606-8846';
export const APP_EMAIL = 'info@parque100.com';

/**
 * Etiquetas y clases Tailwind para pintar el estado de inventario
 * en la tabla de administracion.
 */
export const STATUS_LABELS = {
  in_stock: { label: 'En stock', class: 'bg-green-100 text-green-700 border-green-200' },
  low_stock: { label: 'Bajo stock', class: 'bg-[#FBC02D]/20 text-[#f57f17] border-[#FBC02D]/40' },
  out_of_stock: { label: 'Sin stock', class: 'bg-[#C62828]/10 text-[#C62828] border-[#C62828]/20' },
} as const;
