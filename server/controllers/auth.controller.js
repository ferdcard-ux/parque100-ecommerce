/**
 * @fileoverview Controlador de autenticacion.
 * Gestiona el inicio de sesion y el registro de usuarios delegando
 * la persistencia en `userModel` (patron MVC - Controller).
 *
 * NOTA: la "sesion" se resuelve en el cliente (localStorage); no se
 * emiten tokens JWT en esta version academica del proyecto.
 */
import userModel from '../models/user.model.js';

/**
 * Controlador de autenticacion.
 * @namespace authController
 */
export const authController = {
  /**
   * POST /api/auth/login
   * Valida credenciales y responde con los datos publicos del usuario,
   * o 401 si no coinciden.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con `{ Correo, Contrasena }`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async login(req, res) {
    try {
      const { Correo, Contrasena } = req.body;
      const user = await userModel.findByCredentials(Correo, Contrasena);
      if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });
      res.json(userModel.toPublicUser(user));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * POST /api/auth/recover
   * Genera una clave temporal para el correo indicado y la aplica.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con `{ Correo }`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async recover(req, res) {
    try {
      const { Correo } = req.body;
      if (typeof Correo !== 'string' || !Correo.includes('@')) {
        return res.status(400).json({ error: 'Correo invalido' });
      }
      const tempPassword = `TEMP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const updated = await userModel.updatePasswordByEmail(Correo, tempPassword);
      if (!updated) return res.status(404).json({ error: 'No existe una cuenta con ese correo' });
      res.json({ message: 'Clave temporal generada', tempPassword });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * PUT /api/auth/password
   * Cambia la contrasena validando la actual.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con `{ Correo, ContrasenaActual, ContrasenaNueva }`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async updatePassword(req, res) {
    try {
      const { Correo, ContrasenaActual, ContrasenaNueva } = req.body;
      if (!Correo || !ContrasenaActual || !ContrasenaNueva) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }
      if (String(ContrasenaNueva).length < 8) {
        return res.status(400).json({ error: 'La nueva contrasena debe tener al menos 8 caracteres' });
      }
      const user = await userModel.findByCredentials(Correo, ContrasenaActual);
      if (!user) return res.status(401).json({ error: 'La contrasena actual no es correcta' });
      await userModel.updatePasswordByEmail(Correo, ContrasenaNueva);
      res.json({ message: 'Contrasena actualizada' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * POST /api/auth/register
   * Registra un nuevo usuario con rol por defecto 'usuario'.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con datos del nuevo usuario.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 201 con `{ id, message }` o 500 ante error.
   */
  async register(req, res) {
    try {
      const id = await userModel.create(req.body);
      res.status(201).json({ id, message: 'Usuario registrado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

export default authController;
