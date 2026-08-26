/**
 * @fileoverview Rutas de autenticacion.
 * Capa de enrutamiento (patron MVC - Router) para `authController`.
 */
import { Router } from 'express';
import authController from '../controllers/auth.controller.js';

const router = Router();

/** POST /api/auth/login - Valida credenciales y devuelve el usuario. */
router.post('/auth/login', authController.login);

/** POST /api/auth/register - Registra un nuevo usuario. */
router.post('/auth/register', authController.register);

export default router;
