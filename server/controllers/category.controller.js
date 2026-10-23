/**
 * @fileoverview Controlador de categorias.
 * Expone el listado de categorias para poblar filtros y menus del
 * frontend (patron MVC - Controller).
 */
import categoryModel from '../models/category.model.js';
import { sendError } from '../utils/http-error.js';

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
      sendError(res, err);
    }
  },

  async create(req, res) {
    const name = typeof req.body?.Nombre_Categoria === 'string' ? req.body.Nombre_Categoria.trim() : '';
    if (!name || name.length > 30) return res.status(400).json({ error: 'El nombre debe tener entre 1 y 30 caracteres.' });
    try {
      if (await categoryModel.findByName(name)) {
        return res.status(409).json({ error: 'Ya existe una categoría con ese nombre.' });
      }
      const id = await categoryModel.create(name);
      if (res.locals) res.locals.activityDetail = `«${name}» (#${id})`;
      return res.status(201).json({ ID_Categoria: id, Nombre_Categoria: name });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una categoría con ese nombre.' });
      return res.status(500).json({ error: 'No fue posible crear la categoría.' });
    }
  },

  async update(req, res) {
    const id = Number(req.params.id);
    const name = typeof req.body?.Nombre_Categoria === 'string' ? req.body.Nombre_Categoria.trim() : '';
    if (!Number.isInteger(id) || id <= 0 || !name || name.length > 30) {
      return res.status(400).json({ error: 'Datos de categoría inválidos.' });
    }
    try {
      const current = (await categoryModel.findAll()).find((item) => Number(item.ID_Categoria) === id);
      if (!current) return res.status(404).json({ error: 'Categoría no encontrada.' });
      if (await categoryModel.findByName(name, id)) {
        return res.status(409).json({ error: 'Ya existe una categoría con ese nombre.' });
      }
      await categoryModel.update(id, name);
      if (res.locals) res.locals.activityDetail = `«${name}» (#${id})`;
      return res.json({ ID_Categoria: id, Nombre_Categoria: name });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una categoría con ese nombre.' });
      return res.status(500).json({ error: 'No fue posible actualizar la categoría.' });
    }
  },

  async remove(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador de categoría inválido.' });
    try {
      const current = (await categoryModel.findAll()).find((item) => Number(item.ID_Categoria) === id);
      if (!current) return res.status(404).json({ error: 'Categoría no encontrada.' });
      await categoryModel.remove(id);
      if (res.locals) res.locals.activityDetail = `«${current.Nombre_Categoria}» (#${id})`;
      return res.json({ message: 'Categoría eliminada.' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ error: 'No se puede eliminar: hay productos asociados a esta categoría.' });
      }
      return res.status(500).json({ error: 'No fue posible eliminar la categoría.' });
    }
  },
};

export default categoryController;
