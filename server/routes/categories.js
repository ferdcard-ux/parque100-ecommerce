/**
 * @fileoverview Rutas de categorias.
 * Capa de enrutamiento (patron MVC - Router) para `categoryController`.
 */
import { Router } from 'express';
import categoryController from '../controllers/category.controller.js';

const router = Router();

/** GET /api/categories - Lista completa de categorias. */
router.get('/categories', categoryController.list);

export default router;
