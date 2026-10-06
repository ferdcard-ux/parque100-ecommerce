/**
 * @fileoverview Rutas para los datos de entrega de usuarios.
 */
import { Router } from 'express';
import usersController from '../controllers/users.controller.js';

const router = Router();

/** GET /api/users - Lista de usuarios registrados. */
router.get('/users', usersController.getAll);

/** POST /api/users - Crea un usuario desde el panel admin. */
router.post('/users', usersController.create);

/** PUT /api/users/:id/admin - Edita datos y rol de un usuario. */
router.put('/users/:id/admin', usersController.updateAdmin);

/** DELETE /api/users/:id - Elimina un usuario sin pedidos. */
router.delete('/users/:id', usersController.remove);

/** GET /api/users/:id - Consulta los datos de entrega de un usuario. */
router.get('/users/:id', usersController.getDeliveryDetails);

/** PUT /api/users/:id - Actualiza los datos de entrega de un usuario. */
router.put('/users/:id', usersController.updateDeliveryDetails);

export default router;
