/**
 * @fileoverview Validadores de formularios.
 * Funciones puras de validacion para auth, direccion y datos de
 * tarjeta. Cada una responde si el valor cumple la regla de negocio.
 */

/**
 * Valida el formato basico de un correo electronico.
 *
 * @param {string} email - Correo a validar.
 * @returns {boolean} true si tiene forma usuario@dominio.tld.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valida que la contrasena cumpla el minimo de seguridad (8+ chars).
 *
 * @param {string} password - Contrasena a validar.
 * @returns {boolean} true si tiene 8 o mas caracteres.
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Valida un numero de tarjeta: 16 digitos exactos (ignora espacios).
 *
 * @param {string} value - Numero con o sin espacios.
 * @returns {boolean} true si es valido estructuralmente.
 */
export function isValidCardNumber(value: string): boolean {
  const digits = value.replace(/\s/g, '');
  return digits.length === 16 && /^\d+$/.test(digits);
}

/**
 * Valida el vencimiento MM/AA: mes entre 01 y 12 y anio presente.
 * (No compara contra la fecha actual; validacion minima de forma.)
 *
 * @param {string} value - Vencimiento en formato MM/AA.
 * @returns {boolean} true si el mes es valido.
 */
export function isValidExpiry(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 4) return false;
  const month = parseInt(digits.slice(0, 2), 10);
  if (month < 1 || month > 12) return false;
  return true;
}

/**
 * Valida el CVV: 3 o 4 digitos numericos.
 *
 * @param {string} value - Codigo de seguridad.
 * @returns {boolean} true si es valido.
 */
export function isValidCvv(value: string): boolean {
  return /^\d{3,4}$/.test(value);
}

/**
 * Valida un telefono colombiano: 7 a 10 digitos (ignora espacios).
 *
 * @param {string} value - Telefono ingresado.
 * @returns {boolean} true si es valido.
 */
export function isValidPhone(value: string): boolean {
  return /^\d{7,10}$/.test(value.replace(/\s/g, ''));
}

/**
 * Verifica que un campo obligatorio no este vacio.
 *
 * @param {string} value - Valor del campo.
 * @returns {boolean} true si contiene al menos un caracter visible.
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}
