/**
 * @fileoverview Controlador de categorias.
 * Expone el listado de categorias para poblar filtros y menus del
 * frontend (patron MVC - Controller).
 */
import categoryModel from '../models/category.model.js';

/**
 * Controlador de categorias.
 * @namespace categoryController
 */
export const categoryController = {
  /**
   * GET /api/categories
   * Responde con todas las categorias registradas.
   *
   * @async
   * @param {import('express').Request} _req - Peticion (sin parametros).
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async list(_req, res) {
    try {
      const categories = await categoryModel.findAll();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

export default categoryController;
