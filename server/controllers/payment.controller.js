/**
 * @fileoverview Simulacion opt-in de pagos demo; no procesa cobros reales.
 */
import { randomUUID } from 'node:crypto';
import { getPaymentMode, isDemoPaymentsEnabled } from '../config/payment-mode.js';

/**
 * Controlador de pagos.
 * @namespace paymentController
 */
export const paymentController = {
  /**
   * GET /api/payments/mode
   * Expone unicamente si el servidor habilito la simulacion demo.
   */
  async mode(_req, res) {
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ mode: getPaymentMode() });
  },

  /**
   * POST /api/payments/process
   * Simula el flujo mediante un metodo; nunca recibe PAN, CVV ni monto.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con `{ method }`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async process(req, res) {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).some((key) => key !== 'method')) {
      return res.status(400).json({
        success: false,
        error: 'La simulacion solo acepta el metodo de pago; no envia datos financieros.',
      });
    }
    if (!['card', 'nequi'].includes(body.method)) {
      return res.status(400).json({ success: false, error: 'Metodo de simulacion invalido.' });
    }
    if (!isDemoPaymentsEnabled()) {
      return res.status(503).json({
        success: false,
        paid: false,
        error: 'La simulacion de pagos no esta habilitada.',
      });
    }

    return res.json({
      success: true,
      mode: 'demo',
      simulated: true,
      paid: false,
      simulationId: `DEMO-${randomUUID()}`,
      message: 'Simulacion completada; no se realizo ningun cobro.',
    });
  },
};

export default paymentController;
