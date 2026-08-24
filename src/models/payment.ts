/**
 * @fileoverview Modelos de pagos.
 * Contratos intercambiados con el servicio/backend de pagos.
 */

/** Datos sensibles capturados en el formulario de tarjeta. */
export interface CardPaymentData {
  /** Numero de tarjeta (16 digitos). */
  cardNumber: string;
  /** Nombre del titular. */
  holder: string;
  /** Vencimiento MM/AA. */
  expiry: string;
  /** Codigo de seguridad (3-4 digitos). */
  cvv: string;
}

/** Resultado devuelto por la pasarela de pago. */
export interface PaymentResult {
  /** true si el pago fue aprobado. */
  success: boolean;
  /** Identificador de la transaccion generada. */
  transactionId: string;
  /** Mensaje legible del resultado. */
  message: string;
}
