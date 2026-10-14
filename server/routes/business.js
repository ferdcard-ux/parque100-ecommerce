/**
 * @fileoverview Rutas de datos del negocio.
 * La ficha se lee publicamente y solo el admin la actualiza.
 */
import { Router } from 'express';
import businessController from '../controllers/business.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

/** GET /api/business - Datos del negocio. */
router.get('/business', businessController.get);

/** PUT /api/business - Actualiza los datos del negocio (admin). */
router.put('/business', requireAuth, requireRole('admin'), businessController.update);

export default router;
