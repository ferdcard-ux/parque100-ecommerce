/**
 * @fileoverview Rutas de datos del negocio.
 * Capa de enrutamiento (patron MVC - Router) para `businessController`.
 */
import { Router } from 'express';
import businessController from '../controllers/business.controller.js';

const router = Router();

/** GET /api/business - Datos del negocio. */
router.get('/business', businessController.get);

/** PUT /api/business - Actualiza los datos del negocio. */
router.put('/business', businessController.update);

export default router;
