/**
 * @fileoverview Rutas de pedidos.
 * Capa de enrutamiento (patron MVC - Router) para `orderController`.
 * Todas las rutas requieren sesion; los cambios de estado son de staff.
 */
import { Router } from 'express';
import orderController from '../controllers/order.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

/** GET /api/orders - Lista pedidos (staff: todos; cliente: los propios). */
router.get('/orders', requireAuth, orderController.list);

/** GET /api/orders/:id - Detalle de un pedido con sus productos. */
router.get('/orders/:id', requireAuth, orderController.getById);

/** PUT /api/orders/:id/status - Cambia el estado de un pedido (staff). */
router.put(
  '/orders/:id/status',
  requireAuth,
  requireRole('admin', 'domiciliario', 'empleado'),
  orderController.updateStatus,
);

/** PUT /api/orders/:id/cancel - Cancela con motivo (reglas por rol). */
router.put('/orders/:id/cancel', requireAuth, orderController.cancel);

/** POST /api/orders - Crea un pedido con sus detalles. */
router.post('/orders', requireAuth, orderController.create);

export default router;
