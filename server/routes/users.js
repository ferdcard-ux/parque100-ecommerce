/**
 * @fileoverview Rutas para los datos de entrega de usuarios.
 * La administracion de cuentas es exclusiva del admin; el perfil y los
 * datos de entrega solo son accesibles por el propio usuario o el admin.
 */
import { Router } from 'express';
import usersController from '../controllers/users.controller.js';
import { requireAuth, requireRole, requireSelfOrAdmin } from '../middleware/auth.js';

const router = Router();

/** GET /api/users - Lista de usuarios registrados (admin). */
router.get('/users', requireAuth, requireRole('admin'), usersController.getAll);

/** POST /api/users - Crea un usuario desde el panel admin (admin). */
router.post('/users', requireAuth, requireRole('admin'), usersController.create);

/** PUT /api/users/:id/admin - Edita datos y rol de un usuario (admin). */
router.put('/users/:id/admin', requireAuth, requireRole('admin'), usersController.updateAdmin);

/** DELETE /api/users/:id - Elimina un usuario sin pedidos (admin). */
router.delete('/users/:id', requireAuth, requireRole('admin'), usersController.remove);

/** PUT /api/users/:id/profile - Actualiza el perfil propio (autor o admin). */
router.put('/users/:id/profile', requireAuth, requireSelfOrAdmin('id'), usersController.updateProfile);

/** GET /api/users/:id - Consulta los datos de entrega (autor o admin). */
router.get('/users/:id', requireAuth, requireSelfOrAdmin('id'), usersController.getDeliveryDetails);

/** GET /api/users/:id/permissions - Permisos delegables (autor o admin). */
router.get('/users/:id/permissions', requireAuth, requireSelfOrAdmin('id'), usersController.getPermissions);

/** PUT /api/users/:id/permissions - El admin delega permisos (admin). */
router.put('/users/:id/permissions', requireAuth, requireRole('admin'), usersController.updatePermissions);

/** PUT /api/users/:id - Actualiza los datos de entrega (autor o admin). */
router.put('/users/:id', requireAuth, requireSelfOrAdmin('id'), usersController.updateDeliveryDetails);

export default router;
