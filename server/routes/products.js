/**
 * @fileoverview Rutas de productos (modulo principal del catalogo).
 * Lectura publica; escritura exclusiva del administrador.
 */
import { Router } from 'express';
import productController from '../controllers/product.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

/** GET /api/products - Lista completa de productos. */
router.get('/products', productController.list);

/** GET /api/products/top-selling-week - Producto mas vendido de la semana. */
router.get('/products/top-selling-week', productController.topSellingWeek);

/** GET /api/products/:id - Detalle de un producto. */
router.get('/products/:id', productController.getById);

/** POST /api/products - Crea un producto (admin). */
router.post('/products', requireAuth, requireRole('admin'), productController.create);

/** PUT /api/products/:id - Actualiza un producto (admin). */
router.put('/products/:id', requireAuth, requireRole('admin'), productController.update);

/** DELETE /api/products/:id - Elimina un producto (admin). */
router.delete('/products/:id', requireAuth, requireRole('admin'), productController.remove);

export default router;
