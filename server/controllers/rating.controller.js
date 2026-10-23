/**
 * @fileoverview Controlador de calificaciones.
 * Expone el listado, resumen y creacion de calificaciones de 1 a 5
 * estrellas delegando en `ratingModel` (patron MVC - Controller).
 */
import ratingModel from '../models/rating.model.js';
import { sendError } from '../utils/http-error.js';

/**
 * Controlador de calificaciones.
 * @namespace ratingController
 */
export const ratingController = {
  /**
   * GET /api/ratings
   * Lista calificaciones con filtros `producto`, `pedido` o `usuario`.
   *
   * @async
   * @param {import('express').Request} req - Query opcional de filtros.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async list(req, res) {
    try {
      const ratings = await ratingModel.findAll({
        ID_Producto: req.query.producto,
        ID_Pedido: req.query.pedido,
        ID_Usuario: req.query.usuario,
      });
      res.json(ratings);
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * GET /api/ratings/resumen?producto=P001
   * Promedio y total de un producto.
   *
   * @async
   * @param {import('express').Request} req - Query con `producto`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 400 sin producto.
   */
  async summary(req, res) {
    try {
      const productId = typeof req.query.producto === 'string' ? req.query.producto : '';
      if (!productId) return res.status(400).json({ error: 'Indica el producto.' });
      res.json(await ratingModel.summaryByProduct(productId));
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * POST /api/ratings
   * Crea una calificacion de 1 a 5 estrellas.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con la calificacion.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 201 con `{ id }`.
   */
  async create(req, res) {
    try {
      const id = await ratingModel.create({ ...(req.body || {}), ID_Usuario: Number(req.user?.id) });
      const product = typeof req.body?.ID_Producto === 'string'
        ? req.body.ID_Producto.slice(0, 64) : null;
      const stars = Number(req.body?.Estrellas);
      const parts = [];
      if (product) parts.push(`producto #${product}`);
      if (Number.isInteger(stars) && stars >= 1 && stars <= 5) parts.push(`${stars}★`);
      if (res.locals) res.locals.activityDetail = parts.join(' · ') || null;
      res.status(201).json({ id, message: 'Calificacion guardada' });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * PUT /api/ratings/:id
   * Edita las estrellas y el comentario (solo el autor).
   *
   * @async
   * @param {import('express').Request} req - Peticion con `req.params.id` y cuerpo.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 404 si no existe.
   */
  async update(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID de calificacion invalido.' });
      }
      const updated = await ratingModel.updateById(id, { ...(req.body || {}), ID_Usuario: Number(req.user?.id) });
      if (updated === null) return res.status(404).json({ error: 'Calificacion no encontrada' });
      const stars = Number(req.body?.Estrellas);
      if (res.locals) res.locals.activityDetail = Number.isInteger(stars)
        && stars >= 1 && stars <= 5 ? `${stars}★` : null;
      res.json({ message: 'Resena actualizada' });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * DELETE /api/ratings/:id
   * Elimina una calificacion (moderacion del panel admin).
   *
   * @async
   * @param {import('express').Request} req - Peticion con `req.params.id`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 404 si no existe.
   */
  async remove(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID de calificacion invalido.' });
      }
      const deleted = await ratingModel.deleteById(id);
      if (!deleted) return res.status(404).json({ error: 'Calificacion no encontrada' });
      res.json({ message: 'Calificacion eliminada' });
    } catch (err) {
      sendError(res, err);
    }
  },
};

export default ratingController;
