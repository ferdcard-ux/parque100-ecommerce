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

function validateProfile(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  if (Object.keys(body).some((field) => !['Nombre', 'Correo', 'Telefono'].includes(field))) return null;
  const { Nombre, Correo, Telefono } = body;
  if (typeof Nombre !== 'string' || Nombre.trim().length === 0 || Nombre.trim().length > 30) return null;
  if (typeof Correo !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Correo) || Correo.length > 50) return null;
  if (Telefono !== null && Telefono !== undefined && Telefono !== '' && !/^\d{1,20}$/.test(String(Telefono))) return null;
  return {
    Nombre: Nombre.trim(),
    Correo: Correo.trim(),
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
      if (await userModel.existsByEmail(data.Correo)) {
        return res.status(409).json({ error: 'El correo electronico ya esta registrado' });
      }
      if (data.Telefono !== null && await userModel.existsByPhone(data.Telefono)) {
        return res.status(409).json({ error: 'El numero de telefono ya esta registrado' });
      }
      const id = await userModel.createByAdmin({ ...data, Contrasena });
      res.status(201).json({ id, message: 'Usuario creado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        const message = String(err.message || '');
        if (message.includes('Telefono')) {
          return res.status(409).json({ error: 'El numero de telefono ya esta registrado' });
        }
        return res.status(409).json({ error: 'El correo electronico ya esta registrado' });
      }
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
      if (await userModel.existsByEmail(data.Correo, id)) {
        return res.status(409).json({ error: 'El correo electronico ya esta registrado' });
      }
      if (data.Telefono !== null && await userModel.existsByPhone(data.Telefono, id)) {
        return res.status(409).json({ error: 'El numero de telefono ya esta registrado' });
      }
      const updated = await userModel.updateById(id, data);
      if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ message: 'Usuario actualizado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        const message = String(err.message || '');
        if (message.includes('Telefono')) {
          return res.status(409).json({ error: 'El numero de telefono ya esta registrado' });
        }
        return res.status(409).json({ error: 'El correo electronico ya esta registrado' });
      }
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
   * PUT /api/users/:id/profile - Actualiza el perfil propio del usuario
   * (nombre, correo y telefono). No admite cambio de rol ni de contrasena.
   *
   * @async
   * @param {import('express').Request} req - Peticion con id y campos del perfil.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 200 con el perfil actualizado, 409 si el correo ya existe.
   */
  async updateProfile(req, res) {
    const id = parseUserId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de usuario invalido' });
    const data = validateProfile(req.body);
    if (!data) return res.status(400).json({ error: 'Datos de perfil invalidos' });
    try {
      const existing = await userModel.findPublicById(id);
      if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });
      if (await userModel.existsByEmail(data.Correo, id)) {
        return res.status(409).json({ error: 'El correo electronico ya esta registrado' });
      }
      if (data.Telefono !== null && await userModel.existsByPhone(data.Telefono, id)) {
        return res.status(409).json({ error: 'El numero de telefono ya esta registrado' });
      }
      await userModel.updateProfileById(id, data);
      const profile = await userModel.findPublicById(id);
      res.json(profile);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        const message = String(err.message || '');
        if (message.includes('Telefono')) {
          return res.status(409).json({ error: 'El numero de telefono ya esta registrado' });
        }
        return res.status(409).json({ error: 'El correo electronico ya esta registrado' });
      }
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
