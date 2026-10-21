import bcrypt from 'bcryptjs';
import { DISCLAIMER_VERSION } from '../config/site-access.js';
import {
  authenticateSiteAccessRequest,
  signSiteAccessToken,
} from '../middleware/auth.js';
import siteAccessModel from '../models/site-access.model.js';

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

function redirectToAccess(req, res) {
  const originalUri = req.get('X-Forwarded-Uri') || '/';
  const safeUri = originalUri.startsWith('/') && !originalUri.startsWith('//')
    && !originalUri.startsWith('/access.html')
    ? originalUri
    : '/';
  res.setHeader('Cache-Control', 'no-store');
  return res.redirect(302, `/access.html?next=${encodeURIComponent(safeUri)}`);
}

export const siteAccessController = {
  async login(req, res) {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || !/^[0-9]{1,32}$/.test(username)
      || typeof password !== 'string' || password.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña no válidos.' });
    }

    const user = await siteAccessModel.findByUsername(username);
    const passwordMatches = user
      ? await bcrypt.compare(password, user.Hash_Contrasena)
      : false;
    if (!user || !user.Activo || !passwordMatches) {
      return res.status(401).json({ error: 'Usuario o contraseña no válidos.' });
    }

    await siteAccessModel.updateLastLogin(user.ID_Acceso);
    const token = signSiteAccessToken(user);
    res.cookie('p100_access', token, COOKIE_OPTIONS);
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ authenticated: true });
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

  async logout(_req, res) {
    res.clearCookie('p100_access', CLEAR_COOKIE_OPTIONS);
    return res.status(204).end();
  },
};

export default siteAccessController;
