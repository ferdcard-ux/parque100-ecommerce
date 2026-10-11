/**
 * @fileoverview Funciones de formato y calculo.
 * Utilidades puras para presentar valores monetarios/tarjetas y
 * calcular envios y totales del carrito.
 */
import { SHIPPING_COST, ORDER_ID_PREFIX } from './constants';

/**
 * Formatea un monto en pesos colombianos (COP) sin decimales.
 *
 * @param {number} price - Monto a formatear.
 * @returns {string} Valor con formato de moneda es-CO.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);
}

/**
 * Calcula el costo de envio: siempre 0 (todos los envios son sin costo).
 *
 * @param {number} _subtotal - Subtotal del carrito en COP (sin uso).
 * @returns {number} 0 siempre.
 */
export function calculateShipping(_subtotal: number): number {
  return SHIPPING_COST;
}

/**
 * Calcula el total a pagar (subtotal + envio).
 *
 * @param {number} subtotal - Subtotal del carrito en COP.
 * @returns {number} Total final.
 */
export function calculateTotal(subtotal: number): number {
  return subtotal + calculateShipping(subtotal);
}

/**
 * Da formato visual al numero de tarjeta: solo digitos, maximo 16
 * y agrupados de 4 en 4 ("4111 1111 ...").
 *
 * @param {string} value - Entrada cruda del usuario.
 * @returns {string} Numero formateado.
 */
export function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

/**
 * Da formato MM/AA al campo de vencimiento mientras se escribe.
 *
 * @param {string} value - Entrada cruda del usuario.
 * @returns {string} Vencimiento formateado parcial o completo.
 */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

/**
 * Detecta la franquicia de la tarjeta por su primer digito
 * (4 = Visa, 5 = Mastercard).
 *
 * @param {string} number - Numero de tarjeta (con o sin espacios).
 * @returns {'visa'|'mastercard'|'unknown'} Franquicia detectada.
 */
export function detectCardType(number: string): 'visa' | 'mastercard' | 'unknown' {
  const clean = number.replace(/\s/g, '');
  if (clean.startsWith('4')) return 'visa';
  if (clean.startsWith('5')) return 'mastercard';
  return 'unknown';
}

/**
 * Genera un identificador de pedido legible: prefijo TP + 6 digitos
 * aleatorios (ej. 'TP483920').
 *
 * @returns {string} Identificador generado.
 */
export function generateOrderId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${ORDER_ID_PREFIX}${num}`;
}

/** true si el producto tiene promo válida (antes > actual). */
export function hasPromo(price: number, previousPrice?: number | null): boolean {
  return previousPrice != null && previousPrice > price;
}

/** Ahorro en COP (0 si no hay promo). */
export function savingsAmount(price: number, previousPrice?: number | null): number {
  return hasPromo(price, previousPrice) ? (previousPrice as number) - price : 0;
}

/** Porcentaje de descuento redondeado (0 si no hay promo). */
export function discountPercent(price: number, previousPrice?: number | null): number {
  if (!hasPromo(price, previousPrice)) return 0;
  return Math.round((((previousPrice as number) - price) / (previousPrice as number)) * 100);
}

/**
 * Texto de precio unitario ("2000 g (g a $12.21)").
 * Devuelve null si no hay contenido válido.
 */
export function formatUnitPrice(price: number, qty?: number | null, unit?: string | null): string | null {
  if (qty == null || !unit || Number(qty) <= 0) return null;
  const u = unit.trim();
  const perUnit = price / Number(qty);
  const perUnitFmt = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: perUnit < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(perUnit);
  const qtyFmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(qty));
  return `${qtyFmt} ${u} (${u} a ${perUnitFmt})`;
}
