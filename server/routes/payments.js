/**
 * @fileoverview Rutas de pagos.
 * Capa de enrutamiento (patron MVC - Router) para `paymentController`.
 */
import { Router } from 'express';
import paymentController from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** POST /api/payments/process - Procesa un pago simulado (sesion requerida). */
router.post('/payments/process', requireAuth, paymentController.process);

export default router;
