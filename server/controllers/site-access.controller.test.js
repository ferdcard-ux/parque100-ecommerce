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
  const passwordHash = await bcrypt.hash('password123', 4);
  siteAccessModel.findByUsername = async () => ({
    ID_Acceso: 17,
    Usuario: '3183694992',
    Hash_Contrasena: passwordHash,
    Activo: 1,
  });
  let updatedId;
  siteAccessModel.updateLastLogin = async (id) => { updatedId = id; };
  const res = responseRecorder();

  try {
    await siteAccessController.login({
      body: { username: '3183694992', password: 'password123' },
    }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { authenticated: true });
    assert.equal(updatedId, 17);
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
  }
});

test('inactive and unknown site accounts receive the same login rejection', async () => {
  const originalFind = siteAccessModel.findByUsername;
  siteAccessModel.findByUsername = async () => ({
    ID_Acceso: 17,
    Usuario: '3183694992',
    Hash_Contrasena: await bcrypt.hash('password123', 4),
    Activo: 0,
  });
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

test('protected API session blocks requests until this site session accepts', async () => {
  const originalFindActive = siteAccessModel.findActiveById;
  const originalHasAccepted = siteAccessModel.hasAcceptedDisclaimer;
  siteAccessModel.findActiveById = async () => ({ ID_Acceso: 17, Usuario: '3183694992' });
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
    siteAccessModel.hasAcceptedDisclaimer = originalHasAccepted;
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
