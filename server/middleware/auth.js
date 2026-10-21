/**
 * @fileoverview Utilidades de autenticacion y autorizacion (JWT).
 * Emite tokens en el login/registro y expone middlewares para exigir
 * sesion (`requireAuth`) y roles (`requireRole`, `requireSelfOrAdmin`).
 * La secret se lee de `JWT_SECRET` y no tiene un valor por defecto.
 */
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import siteAccessModel from '../models/site-access.model.js';
import userModel from '../models/user.model.js';

/** Vigencia de la sesion. */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/** Roles con acceso operativo (pedidos, panel). */
const STAFF_ROLES = ['admin', 'domiciliario', 'empleado'];

/** Exige una clave configurada con la longitud minima documentada. */
export function assertJwtSecret() {
  if (typeof process.env.JWT_SECRET !== 'string' || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe configurarse con al menos 32 caracteres aleatorios.');
  }
}

/**
 * Indica si un rol es administrador.
 *
 * @param {string} [rol] - Rol almacenado en la base de datos.
 * @returns {boolean} true si es admin.
 */
export function isAdminRole(rol) {
  return rol === 'admin';
}

/**
 * Indica si un rol tiene acceso operativo (staff).
 *
 * @param {string} [rol] - Rol almacenado en la base de datos.
 * @returns {boolean} true si es admin, domiciliario o empleado.
 */
export function isStaffRole(rol) {
  return STAFF_ROLES.includes(rol);
}

/**
 * Firma un token JWT con la identidad minima del usuario.
 *
 * @param {Object} user - Fila de `usuario` (usa `ID_Usuario`).
 * @returns {string} Token JWT firmado.
 */
export function signToken(user) {
  assertJwtSecret();
  return jwt.sign({ id: user.ID_Usuario, jti: randomUUID() }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/** Reads the session token from Authorization or the HttpOnly access cookie. */
function getRequestToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  const cookies = req.headers.cookie || '';
  const accessCookie = cookies.split(';').map((part) => part.trim())
    .find((part) => part.startsWith('p100_access='));
  return accessCookie ? accessCookie.slice('p100_access='.length) : '';
}

/** Authenticates a request from its bearer token or browser access cookie. */
export async function authenticateRequest(req) {
  const token = getRequestToken(req);
  if (!token) return null;

  let payload;
  try {
    assertJwtSecret();
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
  if (typeof payload !== 'object' || !Number.isSafeInteger(Number(payload.id)) || Number(payload.id) <= 0
    || typeof payload.jti !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.jti)) {
    return null;
  }

  const user = await userModel.findAuthById(Number(payload.id));
  if (!user) return null;
  return {
    id: Number(user.ID_Usuario),
    rol: user.Rol || null,
    sessionId: payload.jti,
  };
}

/**
 * Extrae y verifica el token `Bearer` del encabezado Authorization.
 * Adjunta `req.user = { id, rol }` si es valido.
 *
 * @param {import('express').Request} req - Peticion entrante.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @param {import('express').NextFunction} next - Continuacion.
 * @returns {Promise<void>} 401 si falta o es invalido.
 */
export async function requireAuth(req, res, next) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return res.status(401).json({ error: 'Sesion invalida o expirada' });
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Requires an explicit allowlist entry in the academic-site access table. */
export async function requireSiteAuthorization(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  try {
    if (!(await siteAccessModel.isAuthorized(req.user.id))) {
      return res.status(403).json({ error: 'Esta cuenta no esta autorizada para acceder al sitio.' });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Requires an allowlisted account and disclaimer acceptance for this login session. */
export async function requireSiteSession(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  try {
    if (!(await siteAccessModel.isAuthorized(req.user.id))) {
      return res.status(403).json({ error: 'Esta cuenta no esta autorizada para acceder al sitio.' });
    }
    const accepted = await siteAccessModel.hasAcceptedDisclaimer(
      req.user.id,
      req.user.sessionId,
      process.env.SITE_DISCLAIMER_VERSION || '2026-10-21-v1',
    );
    if (!accepted) {
      return res.status(428).json({ error: 'Debes aceptar el descargo antes de continuar.' });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Exige que el usuario autenticado tenga uno de los roles indicados.
 *
 * @param {...string} roles - Roles permitidos.
 * @returns {import('express').RequestHandler} Middleware de autorizacion.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (!roles.includes(req.user.rol)) return res.status(403).json({ error: 'No autorizado' });
    return next();
  };
}

/**
 * Permite el acceso al propio usuario o a un administrador.
 *
 * @param {string} [param='id'] - Nombre del parametro de ruta con el id.
 * @returns {import('express').RequestHandler} Middleware de autorizacion.
 */
export function requireSelfOrAdmin(param = 'id') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (isAdminRole(req.user.rol) || Number(req.params[param]) === Number(req.user.id)) {
      return next();
    }
    return res.status(403).json({ error: 'No autorizado' });
  };
}

export default {
  signToken,
  authenticateRequest,
  requireAuth,
  requireSiteAuthorization,
  requireSiteSession,
  requireRole,
  requireSelfOrAdmin,
  isAdminRole,
  isStaffRole,
  assertJwtSecret,
};
