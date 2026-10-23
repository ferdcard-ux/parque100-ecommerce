/**
 * @fileoverview Simulacion opt-in de pagos demo; no procesa cobros reales.
 */
import orderModel from '../models/order.model.js';
import { getPaymentMode, isDemoPaymentsEnabled } from '../config/payment-mode.js';
import { sendError } from '../utils/http-error.js';

const ORDER_FIELDS = new Set([
  'Tipo_Entrega', 'Destinatario', 'Telefono', 'Torre', 'Piso', 'Apartamento', 'Notas', 'productos',
]);

function validReference(value) {
  return typeof value === 'string' && /^DEMO-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validOrderPayload(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).every((key) => ORDER_FIELDS.has(key))
    && Array.isArray(value.productos)
    && value.productos.every((item) => item && typeof item === 'object' && !Array.isArray(item)
      && Object.keys(item).every((key) => key === 'ID_Producto' || key === 'Cantidad'));
}

/**
 * Controlador de pagos.
 * @namespace paymentController
 */
export const paymentController = {
  async mode(_req, res) {
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ mode: getPaymentMode() });
  },

  /**
   * POST /api/payments/process
   * Registra el inicio idempotente de un pago ficticio. No recibe importes
   * ni datos de tarjetas, cuentas, transferencias o comprobantes.
   */
  async process(req, res) {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).some((key) => key !== 'method' && key !== 'idempotencyKey')) {
      return res.status(400).json({
        success: false,
        error: 'La simulacion solo acepta el metodo y una clave de idempotencia.',
      });
    }
    if (!['card', 'nequi'].includes(body.method)
      || typeof body.idempotencyKey !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.idempotencyKey)) {
      return res.status(400).json({ success: false, error: 'Solicitud de simulacion invalida.' });
    }
    if (!isDemoPaymentsEnabled()) {
      return res.status(503).json({
        success: false,
        paid: false,
        error: 'La simulacion de pagos no esta habilitada.',
      });
    }

    try {
      const transaction = await orderModel.startDemoPayment({
        userId: req.user?.id,
        method: body.method,
        idempotencyKey: body.idempotencyKey,
      });
      if (res.locals) res.locals.activityDetail = `Método: ${body.method}`;
      return res.status(201).json({
        success: true,
        mode: 'demo',
        simulated: true,
        paid: false,
        simulationId: transaction.reference,
        state: transaction.state,
        message: 'Simulacion iniciada; no se realizo ningun cobro.',
      });
    } catch (error) {
      return sendError(res, error, { success: false });
    }
  },

  /**
   * POST /api/payments/confirm
   * Confirma internamente el flujo y persiste transaccion, pedido y stock
   * de forma atomica; el estado resultante sigue siendo solo DEMO.
   */
  async confirm(req, res) {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).some((key) => key !== 'simulationId' && key !== 'order')
      || !validReference(body.simulationId)
      || !validOrderPayload(body.order)) {
      return res.status(400).json({
        success: false,
        error: 'La confirmacion solo acepta la referencia DEMO y los datos de entrega/productos.',
      });
    }
    if (!isDemoPaymentsEnabled()) {
      return res.status(503).json({ success: false, paid: false, error: 'La simulacion de pagos no esta habilitada.' });
    }

    try {
      const result = await orderModel.confirmDemoPayment({
        reference: body.simulationId,
        userId: req.user?.id,
        orderData: body.order,
      });
      if (result.expired) {
        return res.status(410).json({ success: false, error: 'La simulacion vencio; inicia un nuevo flujo.' });
      }
      const lines = Array.isArray(body.order.productos) ? body.order.productos.length : 0;
      if (res.locals) res.locals.activityDetail = `Pedido #${result.id}`
        + (lines ? ` · ${lines} producto(s)` : '');
      return res.status(result.existing ? 200 : 201).json({
        success: true,
        mode: 'demo',
        simulated: true,
        paid: false,
        approvedDemo: true,
        id: result.id,
        total: result.total,
        simulationId: result.reference,
        message: 'Transaccion aprobada unicamente en la simulacion academica; no hubo cobro real.',
      });
    } catch (error) {
      return sendError(res, error, { success: false });
    }
  },

  async cancel(req, res) {
    if (!validReference(req.params.reference)) {
      return res.status(400).json({ success: false, error: 'Referencia de simulacion invalida.' });
    }
    try {
      await orderModel.cancelDemoPayment(req.params.reference, req.user?.id);
      if (res.locals) res.locals.activityDetail = `Referencia: ${req.params.reference.slice(0, 12)}…`;
      return res.json({ success: true, state: 'cancelada_demo' });
    } catch (error) {
      return sendError(res, error, { success: false });
    }
  },
};

export default paymentController;
