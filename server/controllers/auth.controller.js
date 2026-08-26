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
