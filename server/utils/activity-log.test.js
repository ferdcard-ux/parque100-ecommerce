import assert from 'node:assert/strict';
import test from 'node:test';
import { createActivityRecord, createInteractionRecord, createSessionRecord } from './activity-log.js';

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
    detail: null,
    event: 'product.delete',
    kind: 'interaction',
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
  assert.equal(rejected.action, 'Falló el inicio de sesión en la tienda');
  assert.equal(rejected.event, 'login.store.fail');
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
  assert.equal(record.action, 'Agregó a favoritos (#P001)');
  assert.equal(record.event, 'favorite.add');
  assert.equal(record.siteUser, '3222580941');

  const named = createInteractionRecord(req, 'cart.add', 'P001', fixedTime,
    'Tomate chonto');
  assert.equal(named.action, 'Agregó al carrito «Tomate chonto» (#P001)');

  const logout = createInteractionRecord(req, 'session.logout', undefined, fixedTime);
  assert.equal(logout.action, 'Cerró sesión de tienda');
  assert.equal(createInteractionRecord(req, 'arbitrary', 'P001', fixedTime), null);
  assert.equal(createInteractionRecord(req, 'cart.add', '../secret', fixedTime), null);
});

test('business actions include safe contextual details', () => {
  const order = createActivityRecord({
    method: 'POST',
    path: '/orders',
    siteAccess: { username: '3183694992' },
    user: { id: 7, rol: 'cliente' },
    body: {
      productos: [
        { ID_Producto: 'P001', Cantidad: 2 },
        { ID_Producto: 'P002', Cantidad: 1 },
      ],
      Metodo_Pago: 'Efectivo',
      Notas: 'texto que no debe registrarse',
    },
  }, 201, fixedTime);
  assert.equal(order.action, 'Creó un pedido');
  assert.equal(order.detail, '2 producto(s) · 3 unidad(es) · pago: Efectivo');
  assert.equal(order.event, 'order.create');
  assert.equal(JSON.stringify(order).includes('texto que no debe registrarse'), false);

  const product = createActivityRecord({
    method: 'GET',
    path: '/products/P001',
    siteAccess: { username: '3183694992' },
    user: { id: 7, rol: 'cliente' },
  }, 200, fixedTime, null, null, null, {
    statusCode: 200,
    locals: { activityDetail: '«Tomate chonto» (#P001)' },
  });
  assert.equal(product.action, 'Consultó el producto P001');
  assert.equal(product.detail, '«Tomate chonto» (#P001)');

  const catalog = createActivityRecord({
    method: 'GET',
    path: '/products',
    query: { ID_Categoria: '3', search: 'texto privado' },
    siteAccess: { username: '3183694992' },
  }, 200, fixedTime);
  assert.equal(catalog.detail, 'categoría #3 · con búsqueda aplicada');
  assert.equal(JSON.stringify(catalog).includes('texto privado'), false);

  const plainCatalog = createActivityRecord({
    method: 'GET',
    path: '/products',
    siteAccess: { username: '3183694992' },
  }, 200, fixedTime);
  assert.equal(plainCatalog.detail, 'sin filtros');

  const orders = createActivityRecord({
    method: 'GET',
    path: '/orders',
    siteAccess: { username: '3183694992' },
    user: { id: 7, rol: 'cliente' },
  }, 200, fixedTime, null, null, null, {
    statusCode: 200,
    locals: { activityDetail: '2 pedido(s) · con detalle' },
  });
  assert.equal(orders.action, 'Consultó sus pedidos');
  assert.equal(orders.detail, '2 pedido(s) · con detalle');
});

test('session records expose login outcome without authenticating a store user', () => {
  const record = createSessionRecord({
    username: '3137320854',
    action: 'Bloqueó la cuenta por reintentos fallidos',
    event: 'login.blocked',
    outcome: 'BLOQUEADO',
    detail: '5 intentos fallidos',
    httpStatus: 423,
    timestamp: fixedTime,
  });
  assert.deepEqual(record, {
    id: record.id,
    timestamp: '2026-10-21T23:00:00.000Z',
    siteUser: '3137320854',
    storeUserId: null,
    storeRole: null,
    action: 'Bloqueó la cuenta por reintentos fallidos',
    detail: '5 intentos fallidos',
    event: 'login.blocked',
    kind: 'session',
    outcome: 'BLOQUEADO',
    httpStatus: 423,
  });
  assert.equal(createSessionRecord({
    username: '3137320854',
    action: 'Intento arbitrario',
    event: 'other.event',
  }), null);
});
