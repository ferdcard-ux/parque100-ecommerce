/**
 * @fileoverview Servicio de pagos.
 * Comunica la aplicacion con la pasarela de pagos del backend
 * (simulada en el servidor) y con el flujo Nequi (tambien simulado).
 */
import type { CardPaymentData, PaymentResult, PaymentMethodType } from '../models';

/** URL base de la API REST del backend. */
const API = 'http://localhost:3001/api';

/**
 * Servicio de pagos.
 * @namespace paymentService
 */
export const paymentService = {
  /**
   * Procesa un pago con tarjeta a traves del endpoint /payments/process.
   *
   * @param {CardPaymentData} data - Datos de la tarjeta capturados en el form.
   * @param {number} amount - Monto total a cobrar en COP.
   * @returns {Promise<PaymentResult>} Resultado aprobado o rechazado.
   */
  async processCardPayment(data: CardPaymentData, amount: number): Promise<PaymentResult> {
    const res = await fetch(`${API}/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardNumber: data.cardNumber,
        expiryDate: data.expiry,
        cvv: data.cvv,
        amount,
      }),
    });

    const result = await res.json();
    return result;
  },

  /**
   * Simula un cobro Nequi: espera 1.5 s y aprueba siempre, generando
   * una referencia NEQ-<timestamp>.
   *
   * @param {string} _phone - Telefono Nequi del pagador (sin uso aun).
   * @param {number} amount - Monto a solicitar.
   * @returns {Promise<PaymentResult>} Aprobacion simulada.
   */
  async processNequiPayment(_phone: string, amount: number): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      transactionId: `NEQ-${Date.now()}`,
      message: `Solicitud de pago Nequi por $${amount.toLocaleString('es-CO')} enviada`,
    };
  },

  /**
   * Etiqueta legible para mostrar un metodo de pago en la interfaz.
   *
   * @param {PaymentMethodType} method - Metodo elegido.
   * @returns {string} 'Tarjeta' o 'Nequi'.
   */
  getMethodLabel(method: PaymentMethodType): string {
    return method === 'card' ? 'Tarjeta' : 'Nequi';
  },
};
