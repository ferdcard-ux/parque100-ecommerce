/**
 * @fileoverview Controlador de autenticacion.
 * Gestiona el inicio de sesion y el registro de usuarios delegando
 * la persistencia en `userModel` (patron MVC - Controller).
 *
 * Las contrasenas se almacenan y comparan con bcrypt (nunca en texto
 * plano) y el login/registro emiten un token JWT que el cliente envia
 * en el encabezado `Authorization: Bearer`.
 */
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import userModel from '../models/user.model.js';
import { signToken } from '../middleware/auth.js';

/** Coste del hash bcrypt. */
const BCRYPT_ROUNDS = 10;

/**
 * Hashea una contrasena en texto plano.
 *
 * @param {string} plain - Contrasena en texto plano.
 * @returns {Promise<string>} Hash bcrypt.
 */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Compara una contrasena en texto plano con un hash bcrypt.
 * Devuelve false ante valores vacios o no-hash (datos legados).
 *
 * @param {string} plain - Contrasena en texto plano.
 * @param {string} hash - Hash almacenado.
 * @returns {Promise<boolean>} true si coinciden.
 */
export async function verifyPassword(plain, hash) {
  if (typeof plain !== 'string' || typeof hash !== 'string' || !hash) return false;
  if (!/^\$2[aby]\$/.test(hash)) return false;
  return bcrypt.compare(plain, hash);
}

/**
 * Controlador de autenticacion.
 * @namespace authController
 */
export const authController = {
  /**
   * POST /api/auth/login
   * Valida credenciales y responde con los datos publicos del usuario
   * y un token JWT, o 401 si no coinciden.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con `{ Correo, Contrasena }`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async login(req, res) {
    try {
      const { Correo, Contrasena } = req.body || {};
      if (typeof Correo !== 'string' || typeof Contrasena !== 'string') {
        return res.status(401).json({ error: 'Credenciales invalidas' });
      }
      const user = await userModel.findByEmail(Correo.trim());
      const ok = user ? await verifyPassword(Contrasena, user.Contrasena) : false;
      if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' });
      res.json({ ...userModel.toPublicUser(user), token: signToken(user) });
    } catch {
      res.status(500).json({ error: 'Error al iniciar sesion' });
    }
  },

  /**
   * POST /api/auth/recover
   * Genera una clave temporal, la almacena hasheada y responde de
   * forma neutra (no revela si el correo existe ni devuelve la clave).
   * La clave temporal queda registrada en el log del servidor para su
   * entrega manual (no hay servicio de correo en esta version).
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con `{ Correo }`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async recover(req, res) {
    try {
      const { Correo } = req.body || {};
      if (typeof Correo !== 'string' || !Correo.includes('@')) {
        return res.status(400).json({ error: 'Correo invalido' });
      }
      const email = Correo.trim();
      const tempPassword = `TEMP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      const updated = await userModel.updatePasswordByEmail(email, await hashPassword(tempPassword));
      if (updated) {
        console.log(`[recover] Clave temporal para ${email}: ${tempPassword}`);
      }
      res.json({ message: 'Si el correo existe, se genero una clave temporal.' });
    } catch {
      res.status(500).json({ error: 'Error al recuperar la contrasena' });
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
      const { Correo, ContrasenaActual, ContrasenaNueva } = req.body || {};
      if (!Correo || !ContrasenaActual || !ContrasenaNueva) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }
      if (String(ContrasenaNueva).length < 8) {
        return res.status(400).json({ error: 'La nueva contrasena debe tener al menos 8 caracteres' });
      }
      const user = await userModel.findByEmail(String(Correo).trim());
      if (!user || !(await verifyPassword(ContrasenaActual, user.Contrasena))) {
        return res.status(401).json({ error: 'La contrasena actual no es correcta' });
      }
      await userModel.updatePasswordByEmail(user.Correo, await hashPassword(ContrasenaNueva));
      res.json({ message: 'Contrasena actualizada' });
    } catch {
      res.status(500).json({ error: 'Error al actualizar la contrasena' });
    }
  },

  /**
   * POST /api/auth/register
   * Registra un nuevo usuario con rol por defecto 'usuario'.
   * El correo y el telefono deben ser unicos en todo el sistema.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con datos del nuevo usuario.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 201 con `{ id, token }`, 409 si correo o telefono ya existen.
   */
  async register(req, res) {
    const { Nombre, Correo, Contrasena, Telefono, Direccion } = req.body || {};
    if (typeof Nombre !== 'string' || Nombre.trim().length === 0 || Nombre.trim().length > 30) {
      return res.status(400).json({ error: 'Nombre invalido' });
    }
    if (typeof Correo !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Correo) || Correo.length > 50) {
      return res.status(400).json({ error: 'Correo electronico invalido' });
    }
    if (typeof Contrasena !== 'string' || Contrasena.length < 8) {
      return res.status(400).json({ error: 'La contrasena debe tener al menos 8 caracteres' });
    }
    const phone = Telefono === '' || Telefono === undefined || Telefono === null ? null : String(Telefono);
    if (phone !== null && !/^\d{7,20}$/.test(phone)) {
      return res.status(400).json({ error: 'Telefono invalido' });
    }
    try {
      if (await userModel.existsByEmail(Correo.trim())) {
        return res.status(409).json({ error: 'El correo electronico ya esta registrado' });
      }
      if (phone !== null && await userModel.existsByPhone(phone)) {
        return res.status(409).json({ error: 'El numero de telefono ya esta registrado' });
      }
      const id = await userModel.create({
        Nombre: Nombre.trim(),
        Correo: Correo.trim(),
        Contrasena: await hashPassword(Contrasena),
        Telefono: phone,
        Direccion: typeof Direccion === 'string' ? Direccion : '',
      });
      res.status(201).json({ id, token: signToken({ ID_Usuario: id, Rol: 'usuario' }), message: 'Usuario registrado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        const message = String(err.message || '');
        if (message.includes('Telefono')) {
          return res.status(409).json({ error: 'El numero de telefono ya esta registrado' });
        }
        return res.status(409).json({ error: 'El correo electronico ya esta registrado' });
      }
      res.status(500).json({ error: 'Error al registrar el usuario' });
    }
  },
};

export default authController;
