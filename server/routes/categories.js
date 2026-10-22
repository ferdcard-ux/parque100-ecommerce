/**
 * @fileoverview Rutas de categorias.
 * Capa de enrutamiento (patron MVC - Router) para `categoryController`.
 */
import { Router } from 'express';
import categoryController from '../controllers/category.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

/** GET /api/categories - Lista completa de categorias. */
router.get('/categories', categoryController.list);
router.post('/categories', requireAuth, requireRole('admin'), categoryController.create);
router.put('/categories/:id', requireAuth, requireRole('admin'), categoryController.update);
router.delete('/categories/:id', requireAuth, requireRole('admin'), categoryController.remove);

export default router;
