/**
 * @fileoverview Funciones de formato y calculo.
 * Utilidades puras para presentar valores monetarios/tarjetas y
 * calcular envios y totales del carrito.
 */
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST, ORDER_ID_PREFIX } from './constants';

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
 * Calcula el costo de envio segun el subtotal:
 * gratis si alcanza el umbral, tarifa fija en caso contrario.
 *
 * @param {number} subtotal - Subtotal del carrito en COP.
 * @returns {number} Costo de envio (0 si es gratis).
 */
export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
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
