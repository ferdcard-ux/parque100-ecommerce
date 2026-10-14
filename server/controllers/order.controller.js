/**
 * @fileoverview Controlador de pedidos.
 * Gestiona el listado, detalle y creacion de pedidos, delegando la
 * persistencia en `orderModel` (patron MVC - Controller).
 *
 * La identidad del solicitante se toma del token JWT (`req.user`), no
 * del cuerpo: un cliente solo ve y opera sus propios pedidos, mientras
 * que el staff (admin/domiciliario) accede a todos.
 */
import orderModel from '../models/order.model.js';
import { isAdminRole, isStaffRole } from '../middleware/auth.js';

/** Traduce el rol almacenado al actor usado por las reglas de cancelacion. */
function roleToActor(rol) {
  if (rol === 'admin') return 'admin';
  if (rol === 'domiciliario' || rol === 'empleado') return 'domiciliario';
  return 'cliente';
}

/**
 * Controlador de pedidos.
 * @namespace orderController
 */
export const orderController = {
  /**
   * GET /api/orders
   * Devuelve todos los pedidos para el staff y solo los propios para
   * un cliente autenticado. Con `?items=1` incluye las lineas de detalle.
   *
   * @async
   * @param {import('express').Request} req - Peticion con `req.user`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async list(req, res) {
    try {
      const withItems = req.query.items === '1';
      const orders = withItems ? await orderModel.findAllWithItems() : await orderModel.findAll();
      if (isStaffRole(req.user?.rol)) return res.json(orders);
      const own = orders.filter((order) => Number(order.ID_Usuario) === Number(req.user?.id));
      res.json(own);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * GET /api/orders/:id
   * Responde con un pedido y sus lineas de detalle. Un cliente solo
   * puede consultar sus propios pedidos (403 en caso contrario).
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
      if (!isStaffRole(req.user?.rol) && Number(order.ID_Usuario) !== Number(req.user?.id)) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * PUT /api/orders/:id/status
   * Actualiza el estado de un pedido (solo staff); 404 si no existe.
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
   * Cancela con motivo obligatorio. El actor se deriva del token: un
   * cliente solo puede cancelar sus propios pedidos antes del envio;
   * un domiciliario requiere permiso delegado; el admin tiene acceso
   * total y puede actuar en nombre de otro (Actor/ActorId en el cuerpo).
   *
   * @async
   * @param {import('express').Request} req - Peticion con `{ Motivo }` y,
   *   opcionalmente para admin, `{ Actor, ActorId }`.
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

      const admin = isAdminRole(req.user?.rol);
      // El admin puede impersonar un actor; el resto siempre actua como su propio rol.
      const actor = admin && req.body?.Actor ? req.body.Actor : roleToActor(req.user?.rol);
      if (!['cliente', 'domiciliario', 'admin'].includes(actor)) {
        return res.status(400).json({ error: 'Actor invalido. Usa: cliente, domiciliario, admin.' });
      }
      const actorUserId = admin
        ? (Number.isInteger(Number(req.body?.ActorId)) ? Number(req.body.ActorId) : Number(req.user?.id))
        : Number(req.user?.id);

      // Un cliente solo puede cancelar sus propios pedidos.
      if (actor === 'cliente') {
        const order = await orderModel.findByIdWithDetails(req.params.id);
        if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
        if (Number(order.ID_Usuario) !== Number(req.user?.id)) {
          return res.status(403).json({ error: 'No autorizado' });
        }
      }

      const cancelled = await orderModel.cancelById(req.params.id, motivo, actor, actorUserId);
      if (!cancelled) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json({ message: 'Pedido cancelado' });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  },

  /**
   * POST /api/orders
   * Crea un pedido con sus detalles de forma atomica (transaccion).
   * El `ID_Usuario` se toma del token, nunca del cuerpo.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con datos del pedido
   *   y array `productos` de lineas de detalle.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 201 con `{ id, message }` o 500 ante error.
   */
  async create(req, res) {
    try {
      const id = await orderModel.createWithDetails({
        ...req.body,
        ID_Usuario: Number(req.user?.id),
      });
      res.status(201).json({ id, message: 'Pedido creado' });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  },
};

export default orderController;
