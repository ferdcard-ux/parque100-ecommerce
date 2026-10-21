import assert from 'node:assert/strict';
import { test } from 'node:test';
import bcrypt from 'bcryptjs';
import { authController } from './auth.controller.js';
import { siteAccessController } from './site-access.controller.js';
import { DISCLAIMER_VERSION } from '../config/site-access.js';
import { requireSiteSession } from '../middleware/auth.js';
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

test('login rejects valid credentials when account is not allowlisted', async () => {
  const originalFindByEmail = userModel.findByEmail;
  const originalIsAuthorized = siteAccessModel.isAuthorized;
  const passwordHash = await bcrypt.hash('password123', 4);
  userModel.findByEmail = async () => ({ ID_Usuario: 17, Contrasena: passwordHash });
  siteAccessModel.isAuthorized = async () => false;
  const res = responseRecorder();

  try {
    await authController.login({ body: { Correo: 'student@example.test', Contrasena: 'password123' } }, res);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: 'Esta cuenta no esta autorizada para acceder al sitio.' });
    assert.equal(res.cookies.length, 0);
  } finally {
    userModel.findByEmail = originalFindByEmail;
    siteAccessModel.isAuthorized = originalIsAuthorized;
  }
});

test('allowlisted login issues a secure HttpOnly session cookie', async () => {
  const originalFindByEmail = userModel.findByEmail;
  const originalIsAuthorized = siteAccessModel.isAuthorized;
  const passwordHash = await bcrypt.hash('password123', 4);
  userModel.findByEmail = async () => ({
    ID_Usuario: 17,
    Nombre: 'Aprendiz Demo',
    Correo: 'student@example.test',
    Rol: 'cliente',
    Contrasena: passwordHash,
  });
  siteAccessModel.isAuthorized = async () => true;
  const res = responseRecorder();

  try {
    await authController.login({ body: { Correo: 'student@example.test', Contrasena: 'password123' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 17);
    assert.equal(typeof res.body.token, 'string');
    assert.deepEqual(res.cookies[0].options, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000,
    });
  } finally {
    userModel.findByEmail = originalFindByEmail;
    siteAccessModel.isAuthorized = originalIsAuthorized;
  }
});

test('disclaimer acceptance is stored against the active session and version', async () => {
  const originalRecord = siteAccessModel.recordDisclaimerAcceptance;
  let recorded;
  siteAccessModel.recordDisclaimerAcceptance = async (...args) => { recorded = args; };
  const res = responseRecorder();

  try {
    await siteAccessController.acceptDisclaimer({
      user: { id: 17, sessionId: 'session-uuid' },
      body: { version: DISCLAIMER_VERSION },
    }, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(recorded, [17, 'session-uuid', DISCLAIMER_VERSION]);
    assert.deepEqual(res.body, { accepted: true, version: DISCLAIMER_VERSION });
  } finally {
    siteAccessModel.recordDisclaimerAcceptance = originalRecord;
  }
});

test('protected API session middleware blocks requests until consent is stored', async () => {
  const originalIsAuthorized = siteAccessModel.isAuthorized;
  const originalHasAccepted = siteAccessModel.hasAcceptedDisclaimer;
  siteAccessModel.isAuthorized = async () => true;
  siteAccessModel.hasAcceptedDisclaimer = async () => false;
  const res = responseRecorder();
  let continued = false;

  try {
    await requireSiteSession({ user: { id: 17, sessionId: 'session-uuid' } }, res, () => {
      continued = true;
    });
    assert.equal(res.statusCode, 428);
    assert.equal(continued, false);

    siteAccessModel.hasAcceptedDisclaimer = async () => true;
    await requireSiteSession({ user: { id: 17, sessionId: 'session-uuid' } }, res, () => {
      continued = true;
    });
    assert.equal(continued, true);
  } finally {
    siteAccessModel.isAuthorized = originalIsAuthorized;
    siteAccessModel.hasAcceptedDisclaimer = originalHasAccepted;
  }
});

test('proxy access redirects unauthenticated requests only to a local access path', async () => {
  const res = responseRecorder();
  await siteAccessController.proxyAccess({
    headers: {},
    get: () => 'https://evil.example/path',
  }, res);
  assert.equal(res.statusCode, 302);
  assert.equal(res.location, '/access.html?next=%2F');
  assert.equal(res.cookies[0].cleared, true);
});
