import assert from 'node:assert/strict';
import { test } from 'node:test';
import bcrypt from 'bcryptjs';
import { authController } from './auth.controller.js';
import { siteAccessController } from './site-access.controller.js';
import { DISCLAIMER_VERSION } from '../config/site-access.js';
import { requireSiteSession, signSiteAccessToken } from '../middleware/auth.js';
import siteAccessModel from '../models/site-access.model.js';
import userModel from '../models/user.model.js';

process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
process.env.SITE_ACTIVITY_LOG = 'off';

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    cookies: [],
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    cookie(name, value, options) {
      this.cookies.push({ name, value, options });
      return this;
    },
    clearCookie(name, options) {
      this.cookies.push({ name, options, cleared: true });
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    redirect(code, location) {
      this.statusCode = code;
      this.location = location;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

test('site access login creates an independent secure cookie for a valid team identity', async () => {
  const originalFind = siteAccessModel.findByUsername;
  const originalUpdate = siteAccessModel.updateLastLogin;
  const originalStart = siteAccessModel.startSession;
  const passwordHash = await bcrypt.hash('password123', 4);
  siteAccessModel.findByUsername = async () => ({
    ID_Acceso: 17,
    Usuario: '3183694992',
    Hash_Contrasena: passwordHash,
    Activo: 1,
    Intentos_Fallidos: 0,
    Ultimo_Intento_Fallido: null,
    Bloqueado_Hasta: null,
  });
  let updatedId;
  let session;
  let sessionMetadata;
  siteAccessModel.updateLastLogin = async (id) => { updatedId = id; };
  siteAccessModel.startSession = async (id, sessionId, metadata) => {
    session = { id, sessionId };
    sessionMetadata = metadata;
  };
  const res = responseRecorder();
  const req = {
    body: { username: '3183694992', password: 'password123' },
    headers: {
      'user-agent': 'TestBrowser/1.0',
      'x-forwarded-for': '203.0.113.7',
    },
    ip: '203.0.113.7',
    get(name) { return this.headers[name]; },
  };

  try {
    await siteAccessController.login(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { authenticated: true });
    assert.equal(updatedId, 17);
    assert.equal(session.id, 17);
    assert.match(session.sessionId, /^[0-9a-f-]{36}$/i);
    assert.deepEqual(sessionMetadata, {
      ip: '203.0.113.7',
      userAgent: 'TestBrowser/1.0',
    });
    assert.equal(res.cookies[0].name, 'p100_access');
    assert.deepEqual(res.cookies[0].options, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000,
    });
  } finally {
    siteAccessModel.findByUsername = originalFind;
    siteAccessModel.updateLastLogin = originalUpdate;
    siteAccessModel.startSession = originalStart;
  }
});

test('site access login rejects passwords longer than the field limit', async () => {
  const originalFind = siteAccessModel.findByUsername;
  let lookupCount = 0;
  siteAccessModel.findByUsername = async () => {
    lookupCount += 1;
    return null;
  };
  const res = responseRecorder();
  try {
    await siteAccessController.login({
      body: { username: '3183694992', password: 'x'.repeat(73) },
    }, res);
    assert.equal(res.statusCode, 401);
    assert.equal(lookupCount, 0);
  } finally {
    siteAccessModel.findByUsername = originalFind;
  }
});

test('inactive and unknown site accounts receive the same login rejection', async () => {
  const originalFind = siteAccessModel.findByUsername;
  const originalFailed = siteAccessModel.registerFailedAttempt;
  siteAccessModel.findByUsername = async () => ({
    ID_Acceso: 17,
    Usuario: '3183694992',
    Hash_Contrasena: await bcrypt.hash('password123', 4),
    Activo: 0,
    Intentos_Fallidos: 0,
    Ultimo_Intento_Fallido: null,
    Bloqueado_Hasta: null,
  });
  siteAccessModel.registerFailedAttempt = async () => {};
  const res = responseRecorder();
  try {
    await siteAccessController.login({
      body: { username: '3183694992', password: 'password123' },
    }, res);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: 'Usuario o contraseña no válidos.' });
    assert.equal(res.cookies.length, 0);
  } finally {
    siteAccessModel.findByUsername = originalFind;
    siteAccessModel.registerFailedAttempt = originalFailed;
  }
});

test('repeated failures lock the account for a while and report 423', async () => {
  const originalFind = siteAccessModel.findByUsername;
  const originalFailed = siteAccessModel.registerFailedAttempt;
  let stored;
  siteAccessModel.findByUsername = async () => ({
    ID_Acceso: 21,
    Usuario: '3000000001',
    Hash_Contrasena: await bcrypt.hash('password123', 4),
    Activo: 1,
    Intentos_Fallidos: 4,
    Ultimo_Intento_Fallido: new Date(),
    Bloqueado_Hasta: null,
  });
  siteAccessModel.registerFailedAttempt = async (id, attempts, until) => {
    stored = { id, attempts, until };
  };
  const res = responseRecorder();
  try {
    await siteAccessController.login({
      body: { username: '3000000001', password: 'wrong-password' },
    }, res);
    assert.equal(res.statusCode, 423);
    assert.match(res.body.error, /bloqueada temporalmente/i);
    assert.equal(stored.id, 21);
    assert.equal(stored.attempts, 5);
    assert.ok(stored.until instanceof Date);
  } finally {
    siteAccessModel.findByUsername = originalFind;
    siteAccessModel.registerFailedAttempt = originalFailed;
  }
});

test('a blocked account cannot start a session even with the right password', async () => {
  const originalFind = siteAccessModel.findByUsername;
  siteAccessModel.findByUsername = async () => ({
    ID_Acceso: 22,
    Usuario: '3000000002',
    Hash_Contrasena: await bcrypt.hash('password123', 4),
    Activo: 1,
    Intentos_Fallidos: 5,
    Ultimo_Intento_Fallido: new Date(),
    Bloqueado_Hasta: new Date(Date.now() + 10 * 60 * 1000),
  });
  const res = responseRecorder();
  try {
    await siteAccessController.login({
      body: { username: '3000000002', password: 'password123' },
    }, res);
    assert.equal(res.statusCode, 423);
    assert.equal(res.cookies.length, 0);
  } finally {
    siteAccessModel.findByUsername = originalFind;
  }
});

test('shop-role login remains independent and does not issue the site cookie', async () => {
  const originalFindByEmail = userModel.findByEmail;
  const passwordHash = await bcrypt.hash('password123', 4);
  userModel.findByEmail = async () => ({
    ID_Usuario: 17,
    Nombre: 'Cuenta Demo',
    Correo: 'shop@example.test',
    Rol: 'admin',
    Contrasena: passwordHash,
  });
  const res = responseRecorder();

  try {
    await authController.login({
      body: { Correo: 'shop@example.test', Contrasena: 'password123' },
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 17);
    assert.equal(typeof res.body.token, 'string');
    assert.equal(res.cookies.length, 0);
  } finally {
    userModel.findByEmail = originalFindByEmail;
  }
});

test('disclaimer acceptance is stored against the active site account session', async () => {
  const originalRecord = siteAccessModel.recordDisclaimerAcceptance;
  let recorded;
  siteAccessModel.recordDisclaimerAcceptance = async (...args) => { recorded = args; };
  const res = responseRecorder();

  try {
    await siteAccessController.acceptDisclaimer({
      siteAccess: { id: 17, sessionId: 'session-uuid' },
      body: { version: DISCLAIMER_VERSION },
    }, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(recorded, [17, 'session-uuid', DISCLAIMER_VERSION]);
    assert.deepEqual(res.body, { accepted: true, version: DISCLAIMER_VERSION });
  } finally {
    siteAccessModel.recordDisclaimerAcceptance = originalRecord;
  }
});

function jwtPayload(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
}

test('protected API session blocks requests until this site session accepts', async () => {
  const originalFindActive = siteAccessModel.findActiveById;
  const originalFindSession = siteAccessModel.findSession;
  const originalTouch = siteAccessModel.touchActivity;
  const originalHasAccepted = siteAccessModel.hasAcceptedDisclaimer;
  siteAccessModel.findActiveById = async () => ({ ID_Acceso: 17, Usuario: '3183694992' });
  siteAccessModel.findSession = async () => ({
    ID_Sesion: 'session', Revocada_En: null,
  });
  siteAccessModel.touchActivity = async () => {};
  siteAccessModel.hasAcceptedDisclaimer = async () => false;
  const res = responseRecorder();
  let continued = false;
  const token = signSiteAccessToken({ ID_Acceso: 17 });
  const req = { headers: { cookie: `p100_access=${token}` } };

  try {
    await requireSiteSession(req, res, () => { continued = true; });
    assert.equal(res.statusCode, 428);
    assert.equal(continued, false);

    siteAccessModel.hasAcceptedDisclaimer = async () => true;
    await requireSiteSession(req, res, () => { continued = true; });
    assert.equal(continued, true);
    assert.equal(req.siteAccess.username, '3183694992');
  } finally {
    siteAccessModel.findActiveById = originalFindActive;
    siteAccessModel.findSession = originalFindSession;
    siteAccessModel.touchActivity = originalTouch;
    siteAccessModel.hasAcceptedDisclaimer = originalHasAccepted;
  }
});

test('two independent site sessions remain valid at the same time', async () => {
  const originalFindActive = siteAccessModel.findActiveById;
  const originalFindSession = siteAccessModel.findSession;
  const originalTouch = siteAccessModel.touchActivity;
  const originalHasAccepted = siteAccessModel.hasAcceptedDisclaimer;
  siteAccessModel.findActiveById = async () => ({
    ID_Acceso: 17, Usuario: '3183694992',
  });
  siteAccessModel.findSession = async (_userId, sessionId) => ({
    ID_Sesion: sessionId, Revocada_En: null,
  });
  siteAccessModel.touchActivity = async () => {};
  siteAccessModel.hasAcceptedDisclaimer = async () => true;

  const tokenA = signSiteAccessToken({ ID_Acceso: 17 });
  const tokenB = signSiteAccessToken({ ID_Acceso: 17 });
  const reqA = { headers: { cookie: `p100_access=${tokenA}` } };
  const reqB = { headers: { cookie: `p100_access=${tokenB}` } };
  let continuedA = false;
  let continuedB = false;

  try {
    await requireSiteSession(reqA, responseRecorder(), () => { continuedA = true; });
    await requireSiteSession(reqB, responseRecorder(), () => { continuedB = true; });
    assert.equal(continuedA, true);
    assert.equal(continuedB, true);
    assert.notEqual(reqA.siteAccess.sessionId, reqB.siteAccess.sessionId);
  } finally {
    siteAccessModel.findActiveById = originalFindActive;
    siteAccessModel.findSession = originalFindSession;
    siteAccessModel.touchActivity = originalTouch;
    siteAccessModel.hasAcceptedDisclaimer = originalHasAccepted;
  }
});

test('a revoked site session is rejected before disclaimer checks', async () => {
  const originalFindActive = siteAccessModel.findActiveById;
  const originalFindSession = siteAccessModel.findSession;
  const originalTouch = siteAccessModel.touchActivity;
  const originalHasAccepted = siteAccessModel.hasAcceptedDisclaimer;
  siteAccessModel.findActiveById = async () => ({
    ID_Acceso: 17, Usuario: '3183694992',
  });
  siteAccessModel.findSession = async () => ({
    ID_Sesion: 'session', Revocada_En: new Date(),
  });
  siteAccessModel.touchActivity = async () => {};
  siteAccessModel.hasAcceptedDisclaimer = async () => {
    throw new Error('no debe consultarse');
  };
  const res = responseRecorder();
  let continued = false;
  const token = signSiteAccessToken({ ID_Acceso: 17 });
  const req = { headers: { cookie: `p100_access=${token}` } };

  try {
    await requireSiteSession(req, res, () => { continued = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(continued, false);
  } finally {
    siteAccessModel.findActiveById = originalFindActive;
    siteAccessModel.findSession = originalFindSession;
    siteAccessModel.touchActivity = originalTouch;
    siteAccessModel.hasAcceptedDisclaimer = originalHasAccepted;
  }
});

test('legacy single-session fallback still applies while the migration is pending', async () => {
  const originalFindActive = siteAccessModel.findActiveById;
  const originalFindSession = siteAccessModel.findSession;
  const originalTouch = siteAccessModel.touchActivity;
  const originalHasAccepted = siteAccessModel.hasAcceptedDisclaimer;
  const token = signSiteAccessToken({ ID_Acceso: 17 });
  const payload = jwtPayload(token);
  let currentLegacySession = payload.jti;
  siteAccessModel.findActiveById = async () => ({
    ID_Acceso: 17,
    Usuario: '3183694992',
    Sesion_ID: currentLegacySession,
  });
  siteAccessModel.findSession = async () => ({ missingSchema: true });
  siteAccessModel.touchActivity = async () => {};
  siteAccessModel.hasAcceptedDisclaimer = async () => true;
  let continued = false;

  try {
    await requireSiteSession(
      { headers: { cookie: `p100_access=${token}` } },
      responseRecorder(),
      () => { continued = true; },
    );
    assert.equal(continued, true);

    currentLegacySession = 'a-different-session';
    const res = responseRecorder();
    continued = false;
    await requireSiteSession(
      { headers: { cookie: `p100_access=${token}` } },
      res,
      () => { continued = true; },
    );
    assert.equal(res.statusCode, 401);
    assert.equal(continued, false);
  } finally {
    siteAccessModel.findActiveById = originalFindActive;
    siteAccessModel.findSession = originalFindSession;
    siteAccessModel.touchActivity = originalTouch;
    siteAccessModel.hasAcceptedDisclaimer = originalHasAccepted;
  }
});

test('logout revokes only the current site session', async () => {
  const originalFindActive = siteAccessModel.findActiveById;
  const originalFindSession = siteAccessModel.findSession;
  const originalTouch = siteAccessModel.touchActivity;
  const originalEnd = siteAccessModel.endSession;
  const token = signSiteAccessToken({ ID_Acceso: 17 });
  const payload = jwtPayload(token);
  let ended;
  siteAccessModel.findActiveById = async () => ({
    ID_Acceso: 17, Usuario: '3183694992',
  });
  siteAccessModel.findSession = async () => ({
    ID_Sesion: payload.jti, Revocada_En: null,
  });
  siteAccessModel.touchActivity = async () => {};
  siteAccessModel.endSession = async (...args) => { ended = args; };
  const res = responseRecorder();

  try {
    await siteAccessController.logout({
      headers: { cookie: `p100_access=${token}` },
    }, res);
    assert.deepEqual(ended, [payload.jti, 17]);
    assert.equal(res.statusCode, 204);
    assert.equal(res.cookies[0].cleared, true);
  } finally {
    siteAccessModel.findActiveById = originalFindActive;
    siteAccessModel.findSession = originalFindSession;
    siteAccessModel.touchActivity = originalTouch;
    siteAccessModel.endSession = originalEnd;
  }
});

test('proxy access redirects unauthenticated requests to a local access path', async () => {
  const res = responseRecorder();
  await siteAccessController.proxyAccess({
    headers: {},
    get: () => 'https://evil.example/path',
  }, res);
  assert.equal(res.statusCode, 302);
  assert.equal(res.location, '/access.html?next=%2F');
  assert.equal(res.cookies[0].cleared, true);
});

test('proxy access redirects the SPA index URL to its internal requested route', async () => {
  const res = responseRecorder();
  await siteAccessController.proxyAccess({
    headers: {},
    get: () => '/index.html?next=%2Fpayment-card%3Fmethod%3Dcard',
  }, res);
  assert.equal(
    res.location,
    '/access.html?next=%2Fpayment-card%3Fmethod%3Dcard',
  );
});

test('proxy access preserves the original deep route and query string', async () => {
  const res = responseRecorder();
  await siteAccessController.proxyAccess({
    headers: {},
    get: () => '/payment-card?method=card',
  }, res);
  assert.equal(
    res.location,
    '/access.html?next=%2Fpayment-card%3Fmethod%3Dcard',
  );
});

test('proxy access normalizes the SPA index URL without a nested route to root', async () => {
  const res = responseRecorder();
  await siteAccessController.proxyAccess({
    headers: {},
    get: () => '/index.html',
  }, res);
  assert.equal(res.location, '/access.html?next=%2F');
});

test('proxy access rejects external and access-page nested redirects', async () => {
  const res = responseRecorder();
  await siteAccessController.proxyAccess({
    headers: {},
    get: () => '/index.html?next=https%3A%2F%2Fevil.example',
  }, res);
  assert.equal(res.location, '/access.html?next=%2F');
});
