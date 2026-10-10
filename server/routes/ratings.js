/**
 * @fileoverview Rutas de calificaciones.
 * Capa de enrutamiento (patron MVC - Router) para `ratingController`.
 */
import { Router } from 'express';
import ratingController from '../controllers/rating.controller.js';

const router = Router();

/** GET /api/ratings/resumen?producto=P001 - Promedio de un producto. */
router.get('/ratings/resumen', ratingController.summary);

/** GET /api/ratings - Lista con filtros `producto`, `pedido`, `usuario`. */
router.get('/ratings', ratingController.list);

/** POST /api/ratings - Crea una calificacion de 1 a 5 estrellas. */
router.post('/ratings', ratingController.create);

/** DELETE /api/ratings/:id - Elimina una calificacion (moderacion). */
router.delete('/ratings/:id', ratingController.remove);

export default router;
