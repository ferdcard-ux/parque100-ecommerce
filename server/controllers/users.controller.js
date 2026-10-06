/**
 * @fileoverview Controlador de consulta y actualizacion de datos de entrega.
 */
import userModel from '../models/user.model.js';

const MAX_USER_ID = 2147483647;

function parseUserId(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && id <= MAX_USER_ID ? id : null;
}

function validateDeliveryDetails(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const allowedFields = ['Telefono', 'Torre_Bloque', 'Piso', 'Apartamento'];
  if (Object.keys(body).some((field) => !allowedFields.includes(field))) return null;

  const { Telefono, Torre_Bloque, Piso, Apartamento } = body;
  if (typeof Telefono !== 'string' || !/^\d{1,10}$/.test(Telefono)) return null;

  const fields = [
    [Torre_Bloque, 50],
    [Piso, 20],
    [Apartamento, 20],
  ];
  if (fields.some(([value, maxLength]) =>
    typeof value !== 'string' || value.trim().length === 0 || value.trim().length > maxLength
  )) {
    return null;
  }

  return {
    Telefono,
    Torre_Bloque: Torre_Bloque.trim(),
    Piso: Piso.trim(),
    Apartamento: Apartamento.trim(),
  };
}

const VALID_ROLES = ['admin', 'empleado', 'cliente', 'usuario'];

function validateAdminUser(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { Nombre, Correo, Rol, Telefono } = body;
  if (typeof Nombre !== 'string' || Nombre.trim().length === 0 || Nombre.trim().length > 30) return null;
  if (typeof Correo !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Correo) || Correo.length > 50) return null;
  if (typeof Rol !== 'string' || !VALID_ROLES.includes(Rol)) return null;
  if (Telefono !== null && Telefono !== undefined && Telefono !== '' && !/^\d{1,20}$/.test(String(Telefono))) return null;
  return {
    Nombre: Nombre.trim(),
    Correo: Correo.trim(),
    Rol,
    Telefono: Telefono === '' || Telefono === undefined ? null : String(Telefono),
  };
}

export const usersController = {
  /**
   * GET /api/users
   * Lista los usuarios registrados (sin datos sensibles).
   *
   * @async
   * @param {import('express').Request} _req - Sin parametros.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async getAll(_req, res) {
    try {
      const users = await userModel.findAll();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * POST /api/users - Crea un usuario desde el panel admin.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con Nombre, Correo, Contrasena, Rol y Telefono.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 201 con `{ id }`, 409 si el correo ya existe.
   */
  async create(req, res) {
    const data = validateAdminUser(req.body);
    if (!data) return res.status(400).json({ error: 'Datos de usuario invalidos' });
    const { Contrasena } = req.body;
    if (typeof Contrasena !== 'string' || Contrasena.length < 8) {
      return res.status(400).json({ error: 'La contrasena debe tener al menos 8 caracteres' });
    }
    try {
      const id = await userModel.createByAdmin({ ...data, Contrasena });
      res.status(201).json({ id, message: 'Usuario creado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El correo ya esta registrado' });
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * PUT /api/users/:id/admin - Edita nombre, correo, rol y telefono.
   *
   * @async
   * @param {import('express').Request} req - Peticion con id y campos editables.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async updateAdmin(req, res) {
    const id = parseUserId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de usuario invalido' });
    const data = validateAdminUser(req.body);
    if (!data) return res.status(400).json({ error: 'Datos de usuario invalidos' });
    try {
      const updated = await userModel.updateById(id, data);
      if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ message: 'Usuario actualizado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El correo ya esta registrado' });
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * DELETE /api/users/:id - Elimina un usuario si no tiene pedidos.
   *
   * @async
   * @param {import('express').Request} req - Peticion con el ID del usuario.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 409 si el usuario tiene pedidos asociados.
   */
  async remove(req, res) {
    const id = parseUserId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de usuario invalido' });
    try {
      const orderCount = await userModel.countOrdersByUser(id);
      if (orderCount > 0) {
        return res.status(409).json({ error: `No se puede eliminar: el usuario tiene ${orderCount} pedido(s) asociado(s)` });
      }
      const deleted = await userModel.deleteById(id);
      if (!deleted) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ message: 'Usuario eliminado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * GET /api/users/:id - Consulta los datos de entrega del usuario.
   *
   * @param {import('express').Request} req - Peticion con el ID del usuario.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async getDeliveryDetails(req, res) {
    const id = parseUserId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de usuario invalido' });

    try {
      const details = await userModel.findDeliveryDetailsById(id);
      if (!details) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(details);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * PUT /api/users/:id - Actualiza solo los datos de entrega permitidos.
   *
   * @param {import('express').Request} req - Peticion con datos de entrega.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async updateDeliveryDetails(req, res) {
    const id = parseUserId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de usuario invalido' });

    const details = validateDeliveryDetails(req.body);
    if (!details) {
      return res.status(400).json({ error: 'Datos de entrega invalidos' });
    }

    try {
      const existingUser = await userModel.findDeliveryDetailsById(id);
      if (!existingUser) return res.status(404).json({ error: 'Usuario no encontrado' });

      await userModel.updateDeliveryDetailsById(id, details);
      res.json(details);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

export default usersController;
