/**
 * @fileoverview Rutas de pagos.
 * Capa de enrutamiento (patron MVC - Router) para `paymentController`.
 */
import { Router } from 'express';
import paymentController from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** GET /api/payments/mode - Consulta publica del modo, sin secretos. */
router.get('/payments/mode', paymentController.mode);

/** POST /api/payments/process - Registra el inicio demo (sesion requerida). */
router.post('/payments/process', requireAuth, paymentController.process);
/** POST /api/payments/confirm - Confirma pedido y pago simulado atomicos. */
router.post('/payments/confirm', requireAuth, paymentController.confirm);
/** PUT /api/payments/:reference/cancel - Cierra un intento demo pendiente. */
router.put('/payments/:reference/cancel', requireAuth, paymentController.cancel);

export default router;
