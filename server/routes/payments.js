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

/** POST /api/payments/process - Simula un flujo demo (sesion requerida). */
router.post('/payments/process', requireAuth, paymentController.process);

export default router;
