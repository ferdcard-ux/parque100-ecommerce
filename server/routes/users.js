/**
 * @fileoverview Rutas para los datos de entrega de usuarios.
 */
import { Router } from 'express';
import usersController from '../controllers/users.controller.js';

const router = Router();

/** GET /api/users/:id - Consulta los datos de entrega de un usuario. */
router.get('/users/:id', usersController.getDeliveryDetails);

/** PUT /api/users/:id - Actualiza los datos de entrega de un usuario. */
router.put('/users/:id', usersController.updateDeliveryDetails);

export default router;
