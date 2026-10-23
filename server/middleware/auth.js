/**
 * @fileoverview Utilidades de autenticacion y autorizacion (JWT).
 * Emite tokens en el login/registro y expone middlewares para exigir
 * sesion (`requireAuth`) y roles (`requireRole`, `requireSelfOrAdmin`).
 * La secret se lee de `JWT_SECRET` y no tiene un valor por defecto.
 */
import jwt from 'jsonwebtoken';
import { createHmac, randomUUID } from 'node:crypto';
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
 * Huella de la contrasena vigente: cambia cuando cambia el hash, de modo que
 * los tokens emitidos antes de un cambio de contrasena dejan de ser validos.
 *
 * @param {string} hash - Hash bcrypt almacenado.
 * @returns {string} Huella corta (no reversible) ligada a `JWT_SECRET`.
 */
export function passwordFingerprint(hash) {
  return createHmac('sha256', process.env.JWT_SECRET).update(String(hash || '')).digest('base64url').slice(0, 22);
}

/**
 * Firma un token JWT con la identidad minima del usuario.
 *
 * @param {Object} user - Fila de `usuario` (usa `ID_Usuario` y `Contrasena`).
 * @returns {string} Token JWT firmado.
 */
export function signToken(user) {
  assertJwtSecret();
  const payload = { kind: 'store', id: user.ID_Usuario, jti: randomUUID(), pv: passwordFingerprint(user.Contrasena) };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/** Signs the separate server-access identity, not a store account token. */
export function signSiteAccessToken(user, sessionId = randomUUID()) {
  assertJwtSecret();
  return jwt.sign({ kind: 'site-access', id: user.ID_Acceso, jti: sessionId }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function getSiteAccessCookie(req) {
  const cookies = req.headers.cookie || '';
  const accessCookie = cookies.split(';').map((part) => part.trim())
    .find((part) => part.startsWith('p100_access='));
  return accessCookie ? accessCookie.slice('p100_access='.length) : '';
}

function verifyToken(token, kind) {
  if (!token) return null;
  let payload;
  try {
    assertJwtSecret();
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
  if (typeof payload !== 'object' || payload.kind !== kind
    || !Number.isSafeInteger(Number(payload.id)) || Number(payload.id) <= 0
    || typeof payload.jti !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.jti)) {
    return null;
  }
  return payload;
}

/** Authenticates a store user exclusively from the bearer token. */
export async function authenticateRequest(req) {
  const payload = verifyToken(getBearerToken(req), 'store');
  if (!payload) return null;

  const user = await userModel.findAuthById(Number(payload.id));
  if (!user) return null;
  // Un cambio de contrasena invalida los tokens emitidos con la anterior.
  if (payload.pv !== passwordFingerprint(user.Contrasena)) return null;
  return {
    id: Number(user.ID_Usuario),
    rol: user.Rol || null,
    sessionId: payload.jti,
  };
}

/** Evita escribir en cada petición: como máximo una marca por minuto. */
const activityTouched = new Map();
const ACTIVITY_TOUCH_MS = 60 * 1000;

function touchSiteActivity(id) {
  const now = Date.now();
  if (now - (activityTouched.get(id) || 0) < ACTIVITY_TOUCH_MS) return;
  activityTouched.set(id, now);
  siteAccessModel.touchActivity(id).catch(() => {});
}

/** Autenticates the independent site-access account exclusively from its cookie. */
export async function authenticateSiteAccessRequest(req) {
  const payload = verifyToken(getSiteAccessCookie(req), 'site-access');
  if (!payload) return null;
  const user = await siteAccessModel.findActiveById(Number(payload.id));
  if (!user) return null;
  // Una sesión revocada o reemplazada deja de ser válida de inmediato.
  // Si la columna no existe (migración pendiente), `undefined` no bloquea.
  if (user.Sesion_ID === null) return null;
  if (typeof user.Sesion_ID === 'string' && user.Sesion_ID !== payload.jti) return null;
  touchSiteActivity(Number(user.ID_Acceso));
  return {
    id: Number(user.ID_Acceso),
    username: user.Usuario,
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

/** Attaches a valid store identity when present without blocking site-only activity. */
export async function optionalAuth(req, _res, next) {
  try {
    const user = await authenticateRequest(req);
    if (user) req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Attaches the independent, active site-access identity to the request. */
export async function requireSiteAccessAuth(req, res, next) {
  try {
    const siteAccess = await authenticateSiteAccessRequest(req);
    if (!siteAccess) return res.status(401).json({ error: 'Sesion de acceso invalida o expirada' });
    req.siteAccess = siteAccess;
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Requires the independent access cookie and consent for this login session. */
export async function requireSiteSession(req, res, next) {
  try {
    const siteAccess = await authenticateSiteAccessRequest(req);
    if (!siteAccess) return res.status(401).json({ error: 'Sesion de acceso invalida o expirada' });
    const accepted = await siteAccessModel.hasAcceptedDisclaimer(
      siteAccess.id,
      siteAccess.sessionId,
      process.env.SITE_DISCLAIMER_VERSION || '2026-10-21-v1',
    );
    if (!accepted) {
      return res.status(428).json({ error: 'Debes aceptar el descargo antes de continuar.' });
    }
    req.siteAccess = siteAccess;
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
  passwordFingerprint,
  signToken,
  signSiteAccessToken,
  authenticateRequest,
  authenticateSiteAccessRequest,
  requireAuth,
  optionalAuth,
  requireSiteAccessAuth,
  requireSiteSession,
  requireRole,
  requireSelfOrAdmin,
  isAdminRole,
  isStaffRole,
  assertJwtSecret,
};
