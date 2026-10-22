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
   * Actualiza los datos del negocio. Todos los campos visibles en la
   * tienda son obligatorios (nombre, direccion, telefono, email,
   * horario y descripcion); solo el NIT es opcional.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con campos del negocio.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 400 si falta un campo o es invalido.
   */
  async update(req, res) {
    try {
      const body = req.body || {};
      const text = (value) => (typeof value === 'string' ? value.trim() : '');
      const required = [
        ['Nombre', 80],
        ['Direccion', 120],
        ['Email', 80],
        ['Horario', 80],
        ['Descripcion', 255],
      ];
      for (const [field, max] of required) {
        const value = text(body[field]);
        if (!value) {
          return res.status(400).json({ error: `El campo ${field} es obligatorio.` });
        }
        if (value.length > max) {
          return res.status(400).json({ error: `El campo ${field} no puede superar ${max} caracteres.` });
        }
      }
      const telefono = text(body.Telefono);
      if (!telefono) {
        return res.status(400).json({ error: 'El campo Telefono es obligatorio.' });
      }
      if (!/^\d{10}$/.test(telefono)) {
        return res.status(400).json({ error: 'El telefono del negocio debe tener exactamente 10 digitos.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(body.Email))) {
        return res.status(400).json({ error: 'El correo del negocio no es valido.' });
      }
      const nit = text(body.NIT);
      if (nit.length > 30 || !/^[\d-]*$/.test(nit)) {
        return res.status(400).json({ error: 'El NIT debe contener solo numeros y guiones, con un maximo de 30 caracteres.' });
      }
      let imagenQr;
      if (body.Imagen_QR !== undefined) {
        if (body.Imagen_QR !== null && typeof body.Imagen_QR !== 'string') {
          return res.status(400).json({ error: 'La imagen del QR no es valida.' });
        }
        imagenQr = text(body.Imagen_QR);
        if (imagenQr.length > 7000000) {
          return res.status(400).json({ error: 'La imagen del QR no puede superar 7 MB.' });
        }
        if (imagenQr && !imagenQr.startsWith('data:image/') && !/^https?:\/\//.test(imagenQr)) {
          return res.status(400).json({ error: 'La imagen del QR debe ser una URL o un archivo de imagen valido.' });
        }
      }
      const updateData = {
        Nombre: text(body.Nombre),
        NIT: nit,
        Direccion: text(body.Direccion),
        Telefono: telefono,
        Email: text(body.Email),
        Horario: text(body.Horario),
        Descripcion: text(body.Descripcion),
      };
      if (body.Imagen_QR !== undefined) {
        updateData.Imagen_QR = imagenQr || null;
      }
      const updated = await businessModel.update(updateData);
      if (!updated) return res.status(404).json({ error: 'Datos del negocio no encontrados' });
      const business = await businessModel.find();
      if (res.locals) res.locals.activityDetail = business?.Nombre ? `«${business.Nombre}»` : null;
      res.json(business);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

export default businessController;
