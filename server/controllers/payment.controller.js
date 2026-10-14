/**
 * @fileoverview Controlador de pagos.
 * Simula la integracion con una pasarela de pagos (no hay entidad
 * bancaria real): valida datos minimos de tarjeta y aprueba/rechaza
 * la transaccion de forma aleatoria para pruebas (patron MVC -
 * Controller). Al ser simulado, no requiere modelo ni base de datos.
 */

/**
 * Probabilidad de aprobacion simulada (90% de exito).
 * @constant {number}
 */
const APPROVAL_RATE = 0.9;

/**
 * Prefijo identificador de las transacciones generadas.
 * @constant {string}
 */
const TRANSACTION_PREFIX = 'TXN-';

/**
 * Controlador de pagos.
 * @namespace paymentController
 */
export const paymentController = {
  /**
   * POST /api/payments/process
   * Procesa un pago simulado. Requiere numero de tarjeta, fecha de
   * expiracion, CVV y monto. Devuelve un id de transaccion cuando es
   * aprobado, o 402 cuando la pasarela lo rechaza.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con
   *   `{ cardNumber, expiryDate, cvv, amount }`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async process(req, res) {
    const { cardNumber, expiryDate, cvv, amount } = req.body;

    if (!cardNumber || !expiryDate || !cvv || amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Datos de pago incompletos' });
    }
    if (!/^\d{13,19}$/.test(String(cardNumber).replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Numero de tarjeta invalido' });
    }
    const expiry = String(expiryDate);
    const expiryMatch = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);
    if (!expiryMatch) {
      return res.status(400).json({ error: 'Fecha de expiracion invalida (MM/AA)' });
    }
    const expiryEnd = new Date(2000 + Number(expiryMatch[2]), Number(expiryMatch[1]), 1);
    if (expiryEnd <= new Date()) {
      return res.status(400).json({ error: 'La tarjeta esta vencida' });
    }
    if (!/^\d{3,4}$/.test(String(cvv))) {
      return res.status(400).json({ error: 'CVV invalido' });
    }
    const total = Number(amount);
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ error: 'Monto invalido' });
    }

    const success = Math.random() > 1 - APPROVAL_RATE;

    if (success) {
      res.json({
        success: true,
        transactionId: TRANSACTION_PREFIX + Date.now(),
        message: 'Pago procesado exitosamente',
      });
    } else {
      res.status(402).json({
        success: false,
        message: 'La transaccion fue rechazada',
      });
    }
  },
};

export default paymentController;
