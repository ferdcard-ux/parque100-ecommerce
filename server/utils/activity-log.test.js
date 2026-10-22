import assert from 'node:assert/strict';
import test from 'node:test';
import { createActivityRecord, createInteractionRecord } from './activity-log.js';

const fixedTime = new Date('2026-10-21T23:00:00.000Z');

test('records selected business actions with both authenticated identities', () => {
  const record = createActivityRecord({
    method: 'DELETE',
    path: '/products/P001',
    siteAccess: { username: '3183694992' },
    user: { id: 7, rol: 'admin' },
  }, 204, fixedTime);

  assert.deepEqual(record, {
    id: record.id,
    timestamp: '2026-10-21T23:00:00.000Z',
    siteUser: '3183694992',
    storeUserId: 7,
    storeRole: 'admin',
    action: 'Eliminó el producto P001',
    outcome: 'OK',
    httpStatus: 204,
  });
  assert.match(record.id, /^[0-9a-f-]{36}$/i);
});

test('does not record unlisted endpoints or requests without an authenticated site identity', () => {
  assert.equal(createActivityRecord({
    method: 'GET',
    path: '/users/7',
    siteAccess: { username: '3183694992' },
  }, 200, fixedTime), null);

  assert.equal(createActivityRecord({
    method: 'POST',
    path: '/orders',
    user: { id: 7, rol: 'cliente' },
  }, 201, fixedTime), null);
});

test('records only safe labels and classifies rejected and server-error outcomes', () => {
  const rejected = createActivityRecord({
    method: 'POST',
    path: '/auth/login',
    siteAccess: { username: '3137320854' },
    body: { Correo: 'private@example.test', Contrasena: 'never-log-this' },
  }, 401, fixedTime);
  assert.equal(rejected.outcome, 'RECHAZADO');
  assert.equal(rejected.action, 'Intentó iniciar sesión en la tienda');
  assert.equal(JSON.stringify(rejected).includes('never-log-this'), false);
  assert.equal(JSON.stringify(rejected).includes('private@example.test'), false);

  const failed = createActivityRecord({
    method: 'POST',
    path: '/payments/confirm',
    siteAccess: { username: '3137320854' },
    user: { id: 9, rol: 'cliente' },
  }, 500, fixedTime);
  assert.equal(failed.outcome, 'ERROR');
});

test('client interactions are restricted to fixed labels and safe resource identifiers', () => {
  const req = { siteAccess: { username: '3222580941' }, user: { id: 12, rol: 'cliente' } };
  const record = createInteractionRecord(req, 'favorite.add', 'P001', fixedTime);
  assert.equal(record.action, 'Agregó un producto a favoritos (#P001)');
  assert.equal(record.siteUser, '3222580941');

  const logout = createInteractionRecord(req, 'session.logout', undefined, fixedTime);
  assert.equal(logout.action, 'Cerró sesión de tienda');
  assert.equal(createInteractionRecord(req, 'arbitrary', 'P001', fixedTime), null);
  assert.equal(createInteractionRecord(req, 'cart.add', '../secret', fixedTime), null);
});
