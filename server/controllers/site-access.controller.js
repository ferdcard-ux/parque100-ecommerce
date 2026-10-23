import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { DISCLAIMER_VERSION } from '../config/site-access.js';
import {
  authenticateSiteAccessRequest,
  signSiteAccessToken,
} from '../middleware/auth.js';
import siteAccessModel from '../models/site-access.model.js';
import {
  createSessionRecord,
  writeActivityRecord,
} from '../utils/activity-log.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
  maxAge: 8 * 60 * 60 * 1000,
};
const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
};
/** Reintentos fallidos antes de bloquear temporalmente una cuenta. */
const MAX_FAILED_ATTEMPTS = Math.max(
  2, Number(process.env.SITE_ACCESS_MAX_FAILED) || 5);
/** Ventana de conteo y duración del bloqueo (minutos). */
const FAILURE_WINDOW_MS = Math.max(
  1, Number(process.env.SITE_ACCESS_LOCK_MINUTES) || 15) * 60 * 1000;
const LOCK_MS = FAILURE_WINDOW_MS;

/**
 * Hash de relleno (mismo coste que las cuentas reales): se compara aunque el
 * usuario no exista, para que el tiempo de respuesta no revele cuentas.
 */
const DUMMY_HASH = bcrypt.hashSync('parque100-dummy-access', 12);

/** Cola por cuenta: los intentos de una misma cuenta se evaluan de uno en uno. */
const accountQueues = new Map();

/**
 * Serializa los intentos de login de una cuenta para que el contador de
 * fallos no pueda saltarse con peticiones en paralelo.
 *
 * @param {string} key - Usuario (ya validado).
 * @param {() => Promise<any>} task - Evaluacion del intento.
 * @returns {Promise<any>} Resultado de la tarea.
 */
function withAccountQueue(key, task) {
  const previous = accountQueues.get(key) || Promise.resolve();
  const run = previous.catch(() => {}).then(task);
  const tail = run.catch(() => {});
  accountQueues.set(key, tail);
  tail.then(() => {
    if (accountQueues.get(key) === tail) accountQueues.delete(key);
  });
  return run;
}

/** Guarda un evento de sesión sin bloquear la respuesta. */
function logSession({ username, action, event, outcome = 'OK',
  detail = null, httpStatus = null }) {
  void writeActivityRecord(createSessionRecord({
    username, action, event, outcome, detail, httpStatus,
  }));
}

/** Hora local del bloqueo para el mensaje y el registro. */
function localTime(value) {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);
  } catch {
    return value.toISOString();
  }
}

function blockedResponse(res, until) {
  return res.status(423).json({
    error: 'Cuenta bloqueada temporalmente por intentos fallidos. '
      + `Inténtalo de nuevo después de las ${localTime(until)}.`,
  });
}

function redirectToAccess(req, res) {
  const originalUri = req.get('X-Forwarded-Uri') || '/';
  const safePath = (value, allowIndexFallback = true) => {
    if (typeof value !== 'string') return '/';
    let requested;
    try {
      requested = new URL(value, 'http://localhost');
    } catch {
      return '/';
    }
    if (requested.origin !== 'http://localhost'
      || requested.pathname.startsWith('/access.html')) return '/';
    if (requested.pathname === '/index.html') {
      if (!allowIndexFallback) return '/';
      return safePath(requested.searchParams.get('next'), false);
    }
    return `${requested.pathname}${requested.search}${requested.hash}`;
  };
  const safeUri = safePath(originalUri);
  res.setHeader('Cache-Control', 'no-store');
  return res.redirect(302, `/access.html?next=${encodeURIComponent(safeUri)}`);
}

export const siteAccessController = {
  async login(req, res) {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || !/^[0-9]{1,32}$/.test(username)
      || typeof password !== 'string' || password.length === 0 || password.length > 72) {
      logSession({
        username: typeof username === 'string' ? username : '(desconocido)',
        action: 'Falló el inicio de sesión en el sitio',
        event: 'login.fail',
        outcome: 'RECHAZADO',
        detail: 'Datos de acceso con formato no válido',
        httpStatus: 401,
      });
      return res.status(401).json({ error: 'Usuario o contraseña no válidos.' });
    }

    return withAccountQueue(username, async () => {
      const now = new Date();
      const user = await siteAccessModel.findByUsername(username);
      const blockedUntil = user?.Bloqueado_Hasta
        ? new Date(user.Bloqueado_Hasta) : null;
      if (blockedUntil && blockedUntil > now) {
        logSession({
          username,
          action: 'Intentó entrar con la cuenta bloqueada',
          event: 'login.blocked',
          outcome: 'BLOQUEADO',
          detail: `Bloqueo vigente hasta las ${localTime(blockedUntil)}`,
          httpStatus: 423,
        });
        return blockedResponse(res, blockedUntil);
      }

      const passwordMatches = await bcrypt.compare(
        password, user?.Hash_Contrasena || DUMMY_HASH);
      if (!user || !user.Activo || !passwordMatches) {
        let attempts = null;
        let until = null;
        if (user) {
          const lastFailure = user.Ultimo_Intento_Fallido
            ? new Date(user.Ultimo_Intento_Fallido) : null;
          const withinWindow = lastFailure
            && (now.getTime() - lastFailure.getTime()) <= FAILURE_WINDOW_MS
            && Number(user.Intentos_Fallidos) > 0;
          attempts = (withinWindow ? Number(user.Intentos_Fallidos) : 0) + 1;
          if (attempts >= MAX_FAILED_ATTEMPTS) {
            until = new Date(now.getTime() + LOCK_MS);
          }
          await siteAccessModel.registerFailedAttempt(
            user.ID_Acceso, attempts, until);
        }
        const reason = !user ? 'Usuario no registrado'
          : !user.Activo ? 'Cuenta desactivada'
            : 'Contraseña incorrecta';
        logSession({
          username,
          action: 'Falló el inicio de sesión en el sitio',
          event: 'login.fail',
          outcome: 'RECHAZADO',
          detail: attempts
            ? `${reason} · intento ${attempts}/${MAX_FAILED_ATTEMPTS}`
            : reason,
          httpStatus: until ? 423 : 401,
        });
        if (until) {
          logSession({
            username,
            action: 'Bloqueó la cuenta por reintentos fallidos',
            event: 'login.blocked',
            outcome: 'BLOQUEADO',
            detail: `${MAX_FAILED_ATTEMPTS} intentos fallidos · `
              + `hasta las ${localTime(until)}`,
            httpStatus: 423,
          });
          return blockedResponse(res, until);
        }
        return res.status(401).json({ error: 'Usuario o contraseña no válidos.' });
      }

      await siteAccessModel.updateLastLogin(user.ID_Acceso);
      const sessionId = randomUUID();
      await siteAccessModel.startSession(user.ID_Acceso, sessionId);
      const token = signSiteAccessToken(user, sessionId);
      res.cookie('p100_access', token, COOKIE_OPTIONS);
      res.setHeader('Cache-Control', 'no-store');
      logSession({
        username: user.Usuario,
        action: 'Inició sesión en el sitio',
        event: 'login.ok',
        outcome: 'OK',
        detail: 'Sesión web abierta',
        httpStatus: 200,
      });
      return res.json({ authenticated: true });
    });
  },

  async status(req, res) {
    const accepted = await siteAccessModel.hasAcceptedDisclaimer(
      req.siteAccess.id,
      req.siteAccess.sessionId,
      DISCLAIMER_VERSION,
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ authorized: true, accepted, version: DISCLAIMER_VERSION });
  },

  async acceptDisclaimer(req, res) {
    if (req.body?.version !== DISCLAIMER_VERSION) {
      return res.status(409).json({ error: 'El descargo cambió; vuelve a leerlo antes de aceptar.' });
    }
    await siteAccessModel.recordDisclaimerAcceptance(
      req.siteAccess.id,
      req.siteAccess.sessionId,
      DISCLAIMER_VERSION,
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({ accepted: true, version: DISCLAIMER_VERSION });
  },

  async proxyAccess(req, res) {
    const user = await authenticateSiteAccessRequest(req);
    if (!user) {
      res.clearCookie('p100_access', CLEAR_COOKIE_OPTIONS);
      return redirectToAccess(req, res);
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(204).end();
  },

  async logout(req, res) {
    const current = await authenticateSiteAccessRequest(req).catch(() => null);
    if (current) {
      await siteAccessModel.endSession(current.id);
      logSession({
        username: current.username,
        action: 'Cerró sesión en el sitio',
        event: 'session.logout',
        outcome: 'OK',
        detail: 'Sesión web cerrada',
        httpStatus: 204,
      });
    }
    res.clearCookie('p100_access', CLEAR_COOKIE_OPTIONS);
    return res.status(204).end();
  },
};

export default siteAccessController;
