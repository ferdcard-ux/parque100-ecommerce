/**
 * @fileoverview Rutas de productos (modulo principal del catalogo).
 * Capa de enrutamiento (patron MVC - Router) para `productController`.
 */
import { Router } from 'express';
import productController from '../controllers/product.controller.js';

const router = Router();

/** GET /api/products - Lista completa de productos. */
router.get('/products', productController.list);

/** GET /api/products/:id - Detalle de un producto. */
router.get('/products/:id', productController.getById);

/** POST /api/products - Crea un producto. */
router.post('/products', productController.create);

/** PUT /api/products/:id - Actualiza un producto. */
router.put('/products/:id', productController.update);

/** DELETE /api/products/:id - Elimina un producto. */
router.delete('/products/:id', productController.remove);

export default router;
