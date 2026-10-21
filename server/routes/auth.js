/**
 * @fileoverview Rutas de autenticacion.
 * Capa de enrutamiento (patron MVC - Router) para `authController`.
 */
import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import siteAccessController from '../controllers/site-access.controller.js';
import { requireAuth, requireSiteAuthorization } from '../middleware/auth.js';

const router = Router();

/** POST /api/auth/login - Valida credenciales y devuelve el usuario. */
router.post('/auth/login', authController.login);

/** POST /api/auth/register - Registra un nuevo usuario. */
router.post('/auth/register', authController.register);

/** GET /api/auth/site-access - Verificacion de acceso del proxy Caddy. */
router.get('/auth/proxy-access', siteAccessController.proxyAccess);

/** GET /api/auth/disclaimer/status - Estado de aceptacion de esta sesion. */
router.get('/auth/disclaimer/status', requireAuth, requireSiteAuthorization, siteAccessController.status);

/** POST /api/auth/disclaimer/accept - Registra aceptacion obligatoria. */
router.post('/auth/disclaimer/accept', requireAuth, requireSiteAuthorization, siteAccessController.acceptDisclaimer);

/** POST /api/auth/logout - Elimina la cookie HttpOnly. */
router.post('/auth/logout', siteAccessController.logout);

/** POST /api/auth/recover - Genera una clave temporal para el correo. */
router.post('/auth/recover', authController.recover);

/** PUT /api/auth/password - Cambia la contrasena validando la actual. */
router.put('/auth/password', authController.updatePassword);

export default router;
