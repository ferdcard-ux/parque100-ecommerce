/**
 * @fileoverview Rutas de pedidos.
 * Capa de enrutamiento (patron MVC - Router) para `orderController`.
 */
import { Router } from 'express';
import orderController from '../controllers/order.controller.js';

const router = Router();

/** GET /api/orders - Lista todos los pedidos. */
router.get('/orders', orderController.list);

/** GET /api/orders/:id - Detalle de un pedido con sus productos. */
router.get('/orders/:id', orderController.getById);

/** POST /api/orders - Crea un pedido con sus detalles. */
router.post('/orders', orderController.create);

export default router;
