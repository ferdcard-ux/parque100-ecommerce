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

export const usersController = {
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
