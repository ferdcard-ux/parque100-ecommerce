/**
 * @fileoverview Controlador de pedidos.
 * Gestiona el listado, detalle y creacion de pedidos, delegando la
 * persistencia en `orderModel` (patron MVC - Controller).
 */
import orderModel from '../models/order.model.js';

/**
 * Controlador de pedidos.
 * @namespace orderController
 */
export const orderController = {
  /**
   * GET /api/orders
   * Responde con todos los pedidos (incluye nombre del usuario).
   *
   * @async
   * @param {import('express').Request} _req - Peticion (sin parametros).
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async list(_req, res) {
    try {
      const orders = await orderModel.findAll();
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * GET /api/orders/:id
   * Responde con un pedido y sus lineas de detalle, o 404 si no existe.
   *
   * @async
   * @param {import('express').Request} req - Peticion con `req.params.id`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async getById(req, res) {
    try {
      const order = await orderModel.findByIdWithDetails(req.params.id);
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * PUT /api/orders/:id/status
   * Actualiza el estado de un pedido; 404 si no existe.
   *
   * @async
   * @param {import('express').Request} req - Peticion con `Estado` en el cuerpo.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async updateStatus(req, res) {
    try {
      const { Estado } = req.body;
      const validos = ['pendiente', 'preparando', 'enviando', 'entregado'];
      if (Estado === 'cancelado') {
        return res.status(400).json({ error: 'Para cancelar usa el endpoint de cancelación con motivo.' });
      }
      if (!validos.includes(Estado)) {
        return res.status(400).json({ error: `Estado invalido. Usa: ${validos.join(', ')}` });
      }
      const updated = await orderModel.updateStatus(req.params.id, Estado);
      if (!updated) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json({ message: 'Estado actualizado', estado: Estado });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  },

  /**
   * PUT /api/orders/:id/cancel
   * Cancela con motivo obligatorio. Reglas por actor (`Actor` en el cuerpo):
   * cliente (por defecto) solo antes del envio; domiciliario requiere
   * permiso delegado; admin tiene acceso total.
   *
   * @async
   * @param {import('express').Request} req - Peticion con `{ Motivo, Actor, ActorId }`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 400 sin motivo/actor invalido, 403 sin permiso, 409 si el estado no lo admite.
   */
  async cancel(req, res) {
    try {
      const motivo = typeof req.body?.Motivo === 'string' ? req.body.Motivo.trim() : '';
      if (!motivo) {
        return res.status(400).json({ error: 'Debes indicar el motivo de la cancelación.' });
      }
      if (motivo.length > 255) {
        return res.status(400).json({ error: 'El motivo no puede superar 255 caracteres.' });
      }
      const actor = req.body?.Actor ?? 'cliente';
      if (!['cliente', 'domiciliario', 'admin'].includes(actor)) {
        return res.status(400).json({ error: 'Actor invalido. Usa: cliente, domiciliario, admin.' });
      }
      const actorUserId = Number(req.body?.ActorId);
      const cancelled = await orderModel.cancelById(
        req.params.id,
        motivo,
        actor,
        Number.isInteger(actorUserId) ? actorUserId : null,
      );
      if (!cancelled) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json({ message: 'Pedido cancelado' });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  },

  /**
   * POST /api/orders
   * Crea un pedido con sus detalles de forma atomica (transaccion).
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con datos del pedido
   *   y array `productos` de lineas de detalle.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 201 con `{ id, message }` o 500 ante error.
   */
  async create(req, res) {
    try {
      const id = await orderModel.createWithDetails(req.body);
      res.status(201).json({ id, message: 'Pedido creado' });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  },
};

export default orderController;
