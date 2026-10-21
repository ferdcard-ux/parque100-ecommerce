import { DISCLAIMER_VERSION } from '../config/site-access.js';
import { authenticateRequest } from '../middleware/auth.js';
import siteAccessModel from '../models/site-access.model.js';

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
  async status(req, res) {
    const accepted = await siteAccessModel.hasAcceptedDisclaimer(
      req.user.id,
      req.user.sessionId,
      DISCLAIMER_VERSION,
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ authorized: true, accepted, version: DISCLAIMER_VERSION });
  },

  async acceptDisclaimer(req, res) {
    if (req.body?.version !== DISCLAIMER_VERSION) {
      return res.status(409).json({ error: 'El descargo cambio; vuelve a leerlo antes de aceptar.' });
    }
    await siteAccessModel.recordDisclaimerAcceptance(
      req.user.id,
      req.user.sessionId,
      DISCLAIMER_VERSION,
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({ accepted: true, version: DISCLAIMER_VERSION });
  },

  async proxyAccess(req, res) {
    const user = await authenticateRequest(req);
    if (!user) {
      res.clearCookie('p100_access', { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
      return redirectToAccess(req, res);
    }
    if (!(await siteAccessModel.isAuthorized(user.id))) {
      res.clearCookie('p100_access', { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
      return redirectToAccess(req, res);
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(204).end();
  },

  async logout(_req, res) {
    res.clearCookie('p100_access', { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
    return res.status(204).end();
  },
};

export default siteAccessController;
