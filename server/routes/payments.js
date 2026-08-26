/**
 * @fileoverview Rutas de pagos.
 * Capa de enrutamiento (patron MVC - Router) para `paymentController`.
 */
import { Router } from 'express';
import paymentController from '../controllers/payment.controller.js';

const router = Router();

/** POST /api/payments/process - Procesa un pago simulado. */
router.post('/payments/process', paymentController.process);

export default router;
