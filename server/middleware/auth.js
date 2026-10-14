/**
 * @fileoverview Utilidades de autenticacion y autorizacion (JWT).
 * Emite tokens en el login/registro y expone middlewares para exigir
 * sesion (`requireAuth`) y roles (`requireRole`, `requireSelfOrAdmin`).
 * La secret se lee de `JWT_SECRET`; en desarrollo usa un valor por
 * defecto (debe definirse en produccion).
 */
import jwt from 'jsonwebtoken';

/** Secret de firma de tokens. */
const JWT_SECRET = process.env.JWT_SECRET || 'parque100-dev-secret-cambiar-en-produccion';

/** Vigencia de la sesion. */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/** Roles con acceso operativo (pedidos, panel). */
const STAFF_ROLES = ['admin', 'domiciliario', 'empleado'];

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
 * @param {Object} user - Fila de `usuario` (usa `ID_Usuario` y `Rol`).
 * @returns {string} Token JWT firmado.
 */
export function signToken(user) {
  return jwt.sign({ id: user.ID_Usuario, rol: user.Rol || null }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Extrae y verifica el token `Bearer` del encabezado Authorization.
 * Adjunta `req.user = { id, rol }` si es valido.
 *
 * @param {import('express').Request} req - Peticion entrante.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @param {import('express').NextFunction} next - Continuacion.
 * @returns {void} 401 si falta o es invalido.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: Number(payload.id), rol: payload.rol || null };
    return next();
  } catch {
    return res.status(401).json({ error: 'Sesion invalida o expirada' });
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

export default { signToken, requireAuth, requireRole, requireSelfOrAdmin, isAdminRole, isStaffRole };
