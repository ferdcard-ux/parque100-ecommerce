/**
 * @fileoverview Controlador de datos del negocio.
 * Expone la lectura y edicion de la ficha del negocio para el
 * panel de administracion, delegando en `businessModel`
 * (patron MVC - Controller).
 */
import businessModel from '../models/business.model.js';

/**
 * Controlador de datos del negocio.
 * @namespace businessController
 */
export const businessController = {
  /**
   * GET /api/business
   * Responde con los datos del negocio.
   *
   * @async
   * @param {import('express').Request} _req - Peticion (sin parametros).
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async get(_req, res) {
    try {
      const business = await businessModel.find();
      if (!business) return res.status(404).json({ error: 'Datos del negocio no encontrados' });
      res.json(business);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * PUT /api/business
   * Actualiza los datos del negocio (nombre obligatorio).
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con campos del negocio.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 400 sin nombre, 404 si no existe la fila.
   */
  async update(req, res) {
    try {
      const nombre = typeof req.body?.Nombre === 'string' ? req.body.Nombre.trim() : '';
      if (!nombre) {
        return res.status(400).json({ error: 'El nombre del negocio es obligatorio.' });
      }
      if (nombre.length > 80) {
        return res.status(400).json({ error: 'El nombre no puede superar 80 caracteres.' });
      }
      const updated = await businessModel.update({ ...req.body, Nombre: nombre });
      if (!updated) return res.status(404).json({ error: 'Datos del negocio no encontrados' });
      const business = await businessModel.find();
      res.json(business);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

export default businessController;
