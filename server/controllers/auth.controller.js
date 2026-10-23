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
import userModel from '../models/user.model.js';
import { signToken } from '../middleware/auth.js';

/** Coste del hash bcrypt. */
const BCRYPT_ROUNDS = 12;

/**
 * Hash de relleno con el mismo coste: el login compara siempre contra un hash
 * para que el tiempo de respuesta no revele si el correo existe.
 */
const DUMMY_HASH = bcrypt.hashSync('parque100-dummy-password', BCRYPT_ROUNDS);

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
      const ok = await verifyPassword(Contrasena, user?.Contrasena || DUMMY_HASH);
      if (!user || !ok) return res.status(401).json({ error: 'Credenciales invalidas' });
      const token = signToken(user);
      // Permite que el registro de actividad identifique la cuenta de tienda.
      req.user = { id: user.ID_Usuario, rol: user.Rol };
      res.setHeader('Cache-Control', 'no-store');
      res.json({ ...userModel.toPublicUser(user), token });
    } catch {
      res.status(500).json({ error: 'Error al iniciar sesion' });
    }
  },

  /**
   * POST /api/auth/recover
   * La recuperacion se mantiene deshabilitada hasta que exista un
   * canal de entrega verificado para tokens de un solo uso.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con `{ Correo }`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async recover(req, res) {
    return res.status(503).json({
      error: 'La recuperacion de contrasena no esta disponible. Contacta al soporte.',
    });
  },

  /**
   * PUT /api/auth/password
   * Cambia la contrasena de la cuenta autenticada (identidad del token,
   * nunca del cuerpo) validando la actual. Los tokens emitidos con la
   * contrasena anterior dejan de ser validos; se responde uno nuevo para
   * conservar la sesion en uso.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con `{ ContrasenaActual, ContrasenaNueva }`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async updatePassword(req, res) {
    try {
      const { ContrasenaActual, ContrasenaNueva } = req.body || {};
      if (typeof ContrasenaActual !== 'string' || !ContrasenaActual || typeof ContrasenaNueva !== 'string' || !ContrasenaNueva) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }
      if (ContrasenaNueva.length < 8 || ContrasenaNueva.length > 72) {
        return res.status(400).json({ error: 'La nueva contrasena debe tener entre 8 y 72 caracteres' });
      }
      const user = await userModel.findCredentialsById(Number(req.user.id));
      if (!user || !(await verifyPassword(ContrasenaActual, user.Contrasena))) {
        return res.status(401).json({ error: 'La contrasena actual no es correcta' });
      }
      const hash = await hashPassword(ContrasenaNueva);
      await userModel.updatePasswordById(user.ID_Usuario, hash);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ message: 'Contrasena actualizada', token: signToken({ ...user, Contrasena: hash }) });
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
    if (typeof Contrasena !== 'string' || Contrasena.length < 8 || Contrasena.length > 72) {
      return res.status(400).json({ error: 'La contrasena debe tener entre 8 y 72 caracteres' });
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
      const hash = await hashPassword(Contrasena);
      const id = await userModel.create({
        Nombre: Nombre.trim(),
        Correo: Correo.trim(),
        Contrasena: hash,
        Telefono: phone,
        Direccion: typeof Direccion === 'string' ? Direccion : '',
      });
      res.status(201).json({ id, token: signToken({ ID_Usuario: id, Rol: 'usuario', Contrasena: hash }), message: 'Usuario registrado' });
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
