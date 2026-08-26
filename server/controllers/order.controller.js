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
      res.status(500).json({ error: err.message });
    }
  },
};

export default orderController;
