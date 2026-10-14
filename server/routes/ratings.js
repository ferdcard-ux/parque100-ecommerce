/**
 * @fileoverview Rutas de calificaciones.
 * Lectura publica; escribir o editar exige sesion (solo el autor) y la
 * eliminacion es moderacion exclusiva del admin.
 */
import { Router } from 'express';
import ratingController from '../controllers/rating.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

/** GET /api/ratings/resumen?producto=P001 - Promedio de un producto. */
router.get('/ratings/resumen', ratingController.summary);

/** GET /api/ratings - Lista con filtros `producto`, `pedido`, `usuario`. */
router.get('/ratings', ratingController.list);

/** POST /api/ratings - Crea una calificacion de 1 a 5 estrellas. */
router.post('/ratings', requireAuth, ratingController.create);

/** PUT /api/ratings/:id - Edita una resena (solo el autor). */
router.put('/ratings/:id', requireAuth, ratingController.update);

/** DELETE /api/ratings/:id - Elimina una calificacion (moderacion admin). */
router.delete('/ratings/:id', requireAuth, requireRole('admin'), ratingController.remove);

export default router;
