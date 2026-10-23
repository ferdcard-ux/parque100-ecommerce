import '../server/config/load-env.js';
import './admin-db-env.mjs';
import mysql from 'mysql2/promise';

/**
 * Credenciales de las cuentas demo: se leen del entorno (no se publican en
 * el repositorio). Ej.: $env:SMOKE_ADMIN_PASSWORD='...'.
 */
const SMOKE = {
  adminEmail: process.env.SMOKE_ADMIN_EMAIL || 'admin@parque100.com',
  adminPassword: process.env.SMOKE_ADMIN_PASSWORD,
  userEmail: process.env.SMOKE_USER_EMAIL || 'usuario@ejemplo.com',
  userPassword: process.env.SMOKE_USER_PASSWORD,
  deliveryEmail: process.env.SMOKE_DELIVERY_EMAIL || 'domiciliario@parque100.com',
  deliveryPassword: process.env.SMOKE_DELIVERY_PASSWORD,
};
for (const key of ['adminPassword', 'userPassword', 'deliveryPassword']) {
  if (!SMOKE[key]) {
    console.error('Define SMOKE_ADMIN_PASSWORD, SMOKE_USER_PASSWORD y SMOKE_DELIVERY_PASSWORD antes de ejecutar la bateria.');
    process.exit(1);
  }
}

/**
 * @fileoverview Pruebas automatizadas del lote 1 y 2 (API + BD).
 * Verifica negocio, permisos, calificaciones, foto de perfil, roles y
 * autorizacion por token JWT. Uso: node scripts/smoke-lote2.mjs
 * Requiere el backend en http://localhost:3001 y MySQL local.
 * Limpia los datos de prueba que crea (rating de prueba, cambios revertidos).
 */
const API = 'http://localhost:3001/api';

let passed = 0;
let failed = 0;
let siteCookie = '';
let testSessionId = '';
let disclaimerVersion = '';

/**
 * Ejecuta una prueba y reporta el resultado.
 *
 * @param {string} name - Nombre de la prueba.
 * @param {Function} fn - Funcion asincrona de la prueba.
 * @returns {Promise<void>}
 */
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FALLO - ${name}: ${err.message}`);
  }
}

/**
 * Afirma una condicion.
 *
 * @param {boolean} cond - Condicion a verificar.
 * @param {string} message - Mensaje si falla.
 */
function assert(cond, message) {
  if (!cond) throw new Error(message);
}

/**
 * Llama a la API y retorna status + cuerpo.
 *
 * @param {string} method - Metodo HTTP.
 * @param {string} path - Ruta de la API.
 * @param {Object} [body] - Cuerpo JSON opcional.
 * @param {string} [token] - Token JWT para el encabezado Authorization.
 * @returns {Promise<{status: number, data: any}>} Respuesta.
 */
async function call(method, path, body, token) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (siteCookie) headers.Cookie = siteCookie;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function readConsole(prompt, hidden = false) {
  if (!process.stdin.isTTY || (hidden && typeof process.stdin.setRawMode !== 'function')) {
    throw new Error('Ejecuta esta suite desde una terminal interactiva local.');
  }
  process.stdout.write(prompt);
  if (!hidden) {
    return new Promise((resolve) => {
      process.stdin.setEncoding('utf8');
      process.stdin.resume();
      process.stdin.once('data', (value) => {
        process.stdin.pause();
        resolve(value.trim());
      });
    });
  }

  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      process.stdin.removeListener('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\u0003') return finish(new Error('Operación cancelada.'));
        if (char === '\r' || char === '\n') return finish();
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        if (char >= ' ' && char !== '\u007f') {
          value += char;
          process.stdout.write('*');
        }
      }
    };
    process.stdin.on('data', onData);
  });
}

async function establishSiteSession() {
  const username = await readConsole('Usuario autorizado del equipo: ');
  const password = await readConsole('Contraseña (entrada oculta): ', true);
  const loginResponse = await fetch(`${API}/site-access/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!loginResponse.ok) {
    throw new Error(`No fue posible autenticar el acceso de prueba (HTTP ${loginResponse.status}).`);
  }
  const cookieHeader = loginResponse.headers.get('set-cookie') || '';
  const cookie = cookieHeader.match(/(?:^|,\s*)(p100_access=[^;]+)/)?.[1];
  if (!cookie) throw new Error('El backend no emitió la cookie de acceso esperada.');
  siteCookie = cookie;
  const [, token] = cookie.split('=');
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  if (typeof payload.jti !== 'string' || !Number.isSafeInteger(Number(payload.id))) {
    throw new Error('La sesión de acceso de prueba no tiene el formato esperado.');
  }
  testSessionId = payload.jti;

  const status = await call('GET', '/site-access/disclaimer/status');
  if (status.status !== 200 || typeof status.data?.version !== 'string') {
    throw new Error(`No fue posible consultar el descargo (HTTP ${status.status}).`);
  }
  disclaimerVersion = status.data.version;
  const accepted = await call('POST', '/site-access/disclaimer/accept', { version: disclaimerVersion });
  if (accepted.status !== 201) {
    throw new Error(`No fue posible aceptar el descargo de prueba (HTTP ${accepted.status}).`);
  }
}

async function cleanupTestDisclaimerAcceptance() {
  if (!testSessionId) return;
  if (!process.env.DB_USER) throw new Error('Falta DB_USER para limpiar la aceptación de prueba.');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
  });
  try {
    await connection.execute(
      `DELETE FROM parque100_acceso.aceptaciones_descargo
       WHERE Session_ID = ? AND Version = ?`,
      [testSessionId, disclaimerVersion],
    );
  } finally {
    await connection.end();
  }
}

/**
 * Inicia sesion y devuelve el token JWT.
 *
 * @param {string} correo - Correo de la cuenta de prueba.
 * @param {string} contrasena - Contrasena de la cuenta de prueba.
 * @returns {Promise<string>} Token JWT.
 */
async function login(correo, contrasena) {
  const { status, data } = await call('POST', '/auth/login', { Correo: correo, Contrasena: contrasena });
  assert(status === 200, `login ${correo} status ${status}`);
  assert(data && typeof data.token === 'string' && data.token.length > 10, 'sin token');
  return data.token;
}

const results = [];

/* --- Autenticacion --- */
let adminToken = null;
let clientToken = null;
let deliveryToken = null;

try {
  await establishSiteSession();
} catch (error) {
  console.error(error instanceof Error ? error.message : 'No fue posible preparar la sesión de prueba.');
  try {
    await cleanupTestDisclaimerAcceptance();
  } catch {
    console.error('No fue posible limpiar la aceptación parcial de la sesión de prueba.');
  }
  process.exit(1);
}

await test('Login admin emite token', async () => {
  adminToken = await login(SMOKE.adminEmail, SMOKE.adminPassword);
});

await test('Login cliente emite token y conserva rol', async () => {
  const { status, data } = await call('POST', '/auth/login', {
    Correo: SMOKE.userEmail,
    Contrasena: SMOKE.userPassword,
  });
  assert(status === 200 && data.rol !== 'admin', `status ${status}`);
  assert(typeof data.token === 'string' && data.token.length > 10, 'sin token');
  clientToken = data.token;
});

await test('Login domiciliario emite token', async () => {
  deliveryToken = await login(SMOKE.deliveryEmail, SMOKE.deliveryPassword);
});

await test('Login con clave erronea es 401', async () => {
  const { status } = await call('POST', '/auth/login', {
    Correo: 'usuario@ejemplo.com',
    Contrasena: 'clave-mala',
  });
  assert(status === 401, `status ${status}`);
});

await test('Recover permanece deshabilitado hasta configurar un canal verificado', async () => {
  const { status, data } = await call('POST', '/auth/recover', { Correo: 'nadie@ejemplo.com' });
  assert(status === 503, `status ${status}`);
  assert(data && !('tempPassword' in data), 'expone clave temporal');
});

/* --- Negocio (lote 1) --- */
await test('GET /business responde la ficha', async () => {
  const { status, data } = await call('GET', '/business');
  assert(status === 200, `status ${status}`);
  assert(data.Nombre === 'Tienda Parque 100', 'nombre inesperado');
  results.push({ negocio: data });
});

await test('PUT /business sin token es 401', async () => {
  const { status } = await call('PUT', '/business', { Nombre: 'X' });
  assert(status === 401, `status ${status}`);
});

await test('PUT /business con cliente es 403', async () => {
  const { status } = await call('PUT', '/business', { Nombre: 'X' }, clientToken);
  assert(status === 403, `status ${status}`);
});

await test('PUT /business valida nombre obligatorio', async () => {
  const { status } = await call('PUT', '/business', { Nombre: '' }, adminToken);
  assert(status === 400, `status ${status}`);
});

await test('PUT /business guarda y devuelve la ficha', async () => {
  const before = (await call('GET', '/business')).data;
  const { status, data } = await call('PUT', '/business', { ...before, Horario: 'Lun-Sab 8:00-19:00' }, adminToken);
  assert(status === 200, `status ${status}`);
  assert(data.Horario === 'Lun-Sab 8:00-19:00', 'horario no actualizado');
  await call('PUT', '/business', before, adminToken);
});

await test('PUT /business rechaza telefono distinto de 10 digitos', async () => {
  const before = (await call('GET', '/business')).data;
  for (const telefono of ['300987654', '30098765431', '30098abcde']) {
    const { status } = await call('PUT', '/business', { ...before, Telefono: telefono }, adminToken);
    assert(status === 400, `telefono ${telefono} status ${status}`);
  }
  const restored = await call('PUT', '/business', before, adminToken);
  assert(restored.status === 200, `restaurar status ${restored.status}`);
});

await test('PUT /business acepta telefono de 10 digitos', async () => {
  const before = (await call('GET', '/business')).data;
  const { status, data } = await call('PUT', '/business', { ...before, Telefono: '3001234567' }, adminToken);
  assert(status === 200, `status ${status}`);
  assert(data.Telefono === '3001234567', `telefono ${data.Telefono}`);
  const restored = await call('PUT', '/business', before, adminToken);
  assert(restored.status === 200, `restaurar status ${restored.status}`);
});

const QR_TEST_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

await test('PUT /business rechaza un QR invalido', async () => {
  const before = (await call('GET', '/business')).data;
  const { status } = await call('PUT', '/business', { ...before, Imagen_QR: 'no-es-imagen' }, adminToken);
  assert(status === 400, `status ${status}`);
});

await test('PUT /business guarda y conserva el QR', async () => {
  const before = (await call('GET', '/business')).data;
  const saved = await call('PUT', '/business', { ...before, Imagen_QR: QR_TEST_DATA }, adminToken);
  assert(saved.status === 200, `guardar status ${saved.status}`);
  assert(saved.data.Imagen_QR === QR_TEST_DATA, 'no guardo el QR');

  const withoutQr = { ...before };
  delete withoutQr.Imagen_QR;
  const updated = await call('PUT', '/business', { ...withoutQr, Horario: 'Lun-Sab 8:00-18:00' }, adminToken);
  assert(updated.status === 200, `actualizar status ${updated.status}`);
  assert(updated.data.Imagen_QR === QR_TEST_DATA, 'se perdio el QR al actualizar sin enviarlo');

  const restored = await call('PUT', '/business', before, adminToken);
  assert(restored.status === 200, `restaurar status ${restored.status}`);
  assert((restored.data.Imagen_QR ?? null) === (before.Imagen_QR ?? null), 'no se restauro el QR original');
});

/* --- Permisos / roles (lote 2) --- */
await test('GET /users/2/permissions (admin puede cancelar)', async () => {
  const { status, data } = await call('GET', '/users/2/permissions', undefined, adminToken);
  assert(status === 200, `status ${status}`);
  assert(data.puede_cancelar === true, 'admin deberia poder cancelar');
});

await test('GET /users sin token es 401', async () => {
  const { status } = await call('GET', '/users');
  assert(status === 401, `status ${status}`);
});

await test('GET /users con cliente es 403', async () => {
  const { status } = await call('GET', '/users', undefined, clientToken);
  assert(status === 403, `status ${status}`);
});

await test('PUT /users/1/permissions delega y revierte', async () => {
  const r1 = await call('PUT', '/users/1/permissions', { puede_cancelar: true }, adminToken);
  assert(r1.status === 200 && r1.data.puede_cancelar === true, 'no delego');
  const r2 = await call('PUT', '/users/1/permissions', { puede_cancelar: false }, adminToken);
  assert(r2.status === 200 && r2.data.puede_cancelar === false, 'no revoco');
});

await test('PUT /users/1/permissions rechaza no booleano', async () => {
  const { status } = await call('PUT', '/users/1/permissions', { puede_cancelar: 'si' }, adminToken);
  assert(status === 400, `status ${status}`);
});

await test('GET /users expone Foto y Rol', async () => {
  const { status, data } = await call('GET', '/users', undefined, adminToken);
  assert(status === 200 && Array.isArray(data), `status ${status}`);
  assert('Foto' in data[0] && 'Rol' in data[0], 'faltan columnas');
});

/* --- Reglas de cancelacion por actor --- */
let cancelOrderId = null;

await test('POST /orders sin token es 401', async () => {
  const { status } = await call('POST', '/orders', { Total: 100 });
  assert(status === 401, `status ${status}`);
});

await test('POST /orders crea pedido de prueba (pendiente)', async () => {
  const { status, data } = await call('POST', '/orders', {
    Total: 4500,
    Tipo_Entrega: 'domicilio',
    ID_Usuario: 1,
    Destinatario: 'Prueba Auto',
    Telefono: '300123456',
    Torre: '1',
    Piso: '1',
    Apartamento: '101',
    Metodo_Pago: 'Efectivo',
    productos: [{ ID_Producto: 'P010', Cantidad: 1, Subtotal: 4500 }],
  }, clientToken);
  assert(status === 201, `status ${status} ${JSON.stringify(data)}`);
  cancelOrderId = data.id;
  const toPrep = await call('PUT', `/orders/${cancelOrderId}/status`, { Estado: 'preparando' }, adminToken);
  assert(toPrep.status === 200, `a preparando status ${toPrep.status}`);
  const st = await call('PUT', `/orders/${cancelOrderId}/status`, { Estado: 'enviando' }, adminToken);
  assert(st.status === 200, `a enviando status ${st.status}`);
});

await test('PUT /orders/:id/status con cliente es 403', async () => {
  const { status } = await call('PUT', `/orders/${cancelOrderId}/status`, { Estado: 'preparando' }, clientToken);
  assert(status === 403, `status ${status}`);
});

await test('Cliente NO cancela en enviando (409)', async () => {
  const { status, data } = await call('PUT', `/orders/${cancelOrderId}/cancel`, {
    Motivo: 'Ya no lo quiero',
  }, clientToken);
  assert(status === 409, `status ${status} ${JSON.stringify(data)}`);
});

await test('Domiciliario sin permiso NO cancela (403)', async () => {
  const orig = await call('GET', '/users/4/permissions', undefined, adminToken);
  await call('PUT', '/users/4/permissions', { puede_cancelar: false }, adminToken);
  const { status } = await call('PUT', `/orders/${cancelOrderId}/cancel`, {
    Motivo: 'Prueba',
  }, deliveryToken);
  assert(status === 403, `status ${status}`);
  await call('PUT', '/users/4/permissions', { puede_cancelar: orig.data?.puede_cancelar ?? false }, adminToken);
});

await test('Domiciliario con permiso SI cancela en enviando', async () => {
  const orig = await call('GET', '/users/4/permissions', undefined, adminToken);
  await call('PUT', '/users/4/permissions', { puede_cancelar: true }, adminToken);
  const { status } = await call('PUT', `/orders/${cancelOrderId}/cancel`, {
    Motivo: 'Prueba automatizada',
  }, deliveryToken);
  assert(status === 200, `status ${status}`);
  await call('PUT', '/users/4/permissions', { puede_cancelar: orig.data?.puede_cancelar ?? false }, adminToken);
});

let ownedOrderId = null;

await test('Cliente NO ve el pedido de otro usuario (403)', async () => {
  const created = await call('POST', '/orders', {
    Total: 4500,
    Tipo_Entrega: 'domicilio',
    Destinatario: 'Pedido Admin',
    Telefono: '300987654',
    Torre: '1',
    Piso: '1',
    Apartamento: '101',
    Metodo_Pago: 'Efectivo',
    productos: [{ ID_Producto: 'P010', Cantidad: 1, Subtotal: 4500 }],
  }, adminToken);
  assert(created.status === 201, `status ${created.status}`);
  ownedOrderId = created.data.id;
  const { status } = await call('GET', `/orders/${ownedOrderId}`, undefined, clientToken);
  assert(status === 403, `status ${status}`);
});
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

await test('PUT /users/1/profile guarda y devuelve Foto', async () => {
  const before = await call('GET', '/users/1', undefined, clientToken);
  const profile = {
    Nombre: 'Usuario Demo',
    Correo: 'usuario@ejemplo.com',
    Telefono: before.data?.Telefono ? String(before.data.Telefono) : '',
    Foto: PIXEL,
  };
  const { status, data } = await call('PUT', '/users/1/profile', profile, clientToken);
  assert(status === 200, `status ${status} ${JSON.stringify(data)}`);
  assert(data.Foto === PIXEL, 'foto no persistida');
  await call('PUT', '/users/1/profile', { Nombre: profile.Nombre, Correo: profile.Correo, Telefono: profile.Telefono, Foto: null }, clientToken);
});

await test('Cliente NO consulta el perfil de otro usuario (403)', async () => {
  const { status } = await call('GET', '/users/2', undefined, clientToken);
  assert(status === 403, `status ${status}`);
});

await test('PUT /users/1/profile rechaza foto invalida', async () => {
  const { status } = await call('PUT', '/users/1/profile', {
    Nombre: 'Usuario Demo',
    Correo: 'usuario@ejemplo.com',
    Telefono: '',
    Foto: 'no-es-imagen',
  }, clientToken);
  assert(status === 400, `status ${status}`);
});

/* --- Calificaciones (lote 2 + resenas con compra verificada) --- */
let summaryBefore = { total: 0, promedio: null };
// Pedido propio de la prueba (entregado) con P010: compra verificada autocontenida.
const REVIEW_USER = 1;
const REVIEW_PRODUCT = 'P010';
let reviewOrderId = null;

await test('POST /orders crea pedido entregable para la resena', async () => {
  const { status, data } = await call('POST', '/orders', {
    Total: 4500,
    Tipo_Entrega: 'domicilio',
    ID_Usuario: REVIEW_USER,
    Destinatario: 'Prueba Resena',
    Telefono: '300123456',
    Torre: '1',
    Piso: '1',
    Apartamento: '101',
    Metodo_Pago: 'Efectivo',
    productos: [{ ID_Producto: REVIEW_PRODUCT, Cantidad: 1, Subtotal: 4500 }],
  }, clientToken);
  assert(status === 201, `status ${status} ${JSON.stringify(data)}`);
  reviewOrderId = data.id;
  for (const estado of ['preparando', 'enviando', 'entregado']) {
    const st = await call('PUT', `/orders/${reviewOrderId}/status`, { Estado: estado }, adminToken);
    assert(st.status === 200, `a ${estado} status ${st.status}`);
  }
});

await test('GET /ratings/resumen base de P010', async () => {
  const { status, data } = await call('GET', '/ratings/resumen?producto=P010');
  assert(status === 200, `status ${status}`);
  summaryBefore = data;
});

await test('POST /ratings sin token es 401', async () => {
  const { status } = await call('POST', '/ratings', { Tipo: 'pedido', Estrellas: 4 });
  assert(status === 401, `status ${status}`);
});

await test('POST /ratings producto 5 estrellas con compra verificada', async () => {
  const { status, data } = await call('POST', '/ratings', {
    ID_Usuario: REVIEW_USER,
    ID_Producto: REVIEW_PRODUCT,
    ID_Pedido: reviewOrderId,
    Tipo: 'producto',
    Estrellas: 5,
    Comentario: 'Prueba automatizada',
  }, clientToken);
  assert(status === 201, `status ${status} ${JSON.stringify(data)}`);
  results.push({ ratingId: data.id });
});

await test('POST /ratings duplicada en el mismo pedido es 409', async () => {
  const { status } = await call('POST', '/ratings', {
    ID_Usuario: REVIEW_USER,
    ID_Producto: REVIEW_PRODUCT,
    ID_Pedido: reviewOrderId,
    Tipo: 'producto',
    Estrellas: 4,
    Comentario: 'Duplicada',
  }, clientToken);
  assert(status === 409, `status ${status}`);
});

await test('POST /ratings en pedido enviando (no entregado) es 403', async () => {
  // Pedido 4 esta en enviando con P002: aun no habilita resenas.
  const { status } = await call('POST', '/ratings', {
    ID_Usuario: REVIEW_USER,
    ID_Producto: 'P002',
    ID_Pedido: 4,
    Tipo: 'producto',
    Estrellas: 5,
  }, clientToken);
  assert(status === 403, `status ${status}`);
});

await test('POST /ratings producto sin ID_Pedido es 400', async () => {
  const { status } = await call('POST', '/ratings', {
    ID_Usuario: REVIEW_USER,
    ID_Producto: REVIEW_PRODUCT,
    Tipo: 'producto',
    Estrellas: 5,
  }, clientToken);
  assert(status === 400, `status ${status}`);
});

await test('PUT /ratings/:id edita la resena del autor', async () => {
  const ratingId = results.find((r) => r.ratingId)?.ratingId;
  assert(ratingId, 'sin id de prueba');
  const { status, data } = await call('PUT', `/ratings/${ratingId}`, {
    ID_Usuario: REVIEW_USER,
    Estrellas: 4,
    Comentario: 'Prueba automatizada editada',
  }, clientToken);
  assert(status === 200, `status ${status} ${JSON.stringify(data)}`);
});

await test('PUT /ratings/:id de otro usuario es 403', async () => {
  const ratingId = results.find((r) => r.ratingId)?.ratingId;
  assert(ratingId, 'sin id de prueba');
  const { status } = await call('PUT', `/ratings/${ratingId}`, {
    ID_Usuario: 2,
    Estrellas: 1,
  }, adminToken);
  assert(status === 403, `status ${status}`);
});

await test('GET /ratings/resumen suma la nueva calificacion', async () => {
  const { status, data } = await call('GET', '/ratings/resumen?producto=P010');
  assert(status === 200, `status ${status}`);
  assert(data.total === summaryBefore.total + 1, `total ${data.total} vs base ${summaryBefore.total}`);
  const expected = (Number(summaryBefore.promedio || 0) * summaryBefore.total + 4) / data.total;
  assert(Math.abs(Number(data.promedio) - expected) < 0.01, `promedio ${data.promedio} vs ${expected}`);
});

await test('POST /ratings rechaza 6 estrellas', async () => {
  const { status } = await call('POST', '/ratings', { ID_Producto: 'P001', Tipo: 'producto', Estrellas: 6 }, clientToken);
  assert(status === 400, `status ${status}`);
});

await test('POST /ratings pedido sin ID_Pedido es 400', async () => {
  const { status } = await call('POST', '/ratings', { Tipo: 'pedido', Estrellas: 4 }, clientToken);
  assert(status === 400, `status ${status}`);
});

await test('GET /ratings?producto=P010 lista la prueba editada', async () => {
  const { status, data } = await call('GET', '/ratings?producto=P010');
  assert(
    status === 200 &&
      data.some((r) => r.Comentario === 'Prueba automatizada editada' && r.Usuario_Nombre === 'Usuario Demo'),
    'no encontrada',
  );
});

/* --- Pedidos pendientes (badge lote 1) --- */
await test('GET /orders responde lista para el badge', async () => {
  const { status, data } = await call('GET', '/orders', undefined, clientToken);
  assert(status === 200 && Array.isArray(data), `status ${status}`);
  console.log(`  info: ${data.filter((o) => o.Estado === 'pendiente').length} pendientes de ${data.length}`);
});

await test('GET /orders?items=1 trae lineas de detalle', async () => {
  const { status, data } = await call('GET', '/orders?items=1', undefined, clientToken);
  assert(status === 200 && Array.isArray(data), `status ${status}`);
  assert(data.every((o) => Array.isArray(o.detalles)), 'sin detalles');
});

await test('GET /orders del cliente solo trae los propios', async () => {
  const { status, data } = await call('GET', '/orders', undefined, clientToken);
  assert(status === 200 && Array.isArray(data), `status ${status}`);
  assert(data.every((o) => Number(o.ID_Usuario) === 1), 'hay pedidos ajenos');
});

await test('GET /orders del staff trae todos', async () => {
  const { status, data } = await call('GET', '/orders', undefined, deliveryToken);
  assert(status === 200 && Array.isArray(data) && data.length > 0, `status ${status}`);
});

/* --- Integridad del pedido (fase 2: el servidor es autoridad) --- */
let tamperOrderId = null;

await test('POST /orders ignora Total/Estado/ID_Usuario del cliente', async () => {
  const { status, data } = await call('POST', '/orders', {
    Total: 1,
    Estado: 'entregado',
    Tipo_Entrega: 'domicilio',
    ID_Usuario: 999,
    Destinatario: 'Prueba',
    Telefono: '300123456',
    Torre: '1',
    Piso: '1',
    Apartamento: '101',
    Metodo_Pago: 'Efectivo',
    productos: [{ ID_Producto: 'P010', Cantidad: 1, Subtotal: 1 }],
  }, clientToken);
  assert(status === 201, `status ${status} ${JSON.stringify(data)}`);
  tamperOrderId = data.id;
  const full = await call('GET', `/orders/${tamperOrderId}`, undefined, adminToken);
  assert(full.status === 200, `detalle status ${full.status}`);
  assert(full.data.Total === 4500, `total ${full.data.Total}`);
  assert(full.data.Estado === 'pendiente', `estado ${full.data.Estado}`);
  assert(Number(full.data.ID_Usuario) === 1, 'dueno inesperado');
});

await test('POST /orders sin productos es 400', async () => {
  const { status } = await call('POST', '/orders', {
    Total: 100,
    Tipo_Entrega: 'domicilio',
    productos: [],
  }, clientToken);
  assert(status === 400, `status ${status}`);
});

await test('POST /orders con entrega invalida es 400', async () => {
  const { status } = await call('POST', '/orders', {
    Tipo_Entrega: 'drone',
    productos: [{ ID_Producto: 'P010', Cantidad: 1 }],
  }, clientToken);
  assert(status === 400, `status ${status}`);
});

let stateOrderId = null;

await test('Maquina de estados: sin saltos ni retrocesos', async () => {
  const created = await call('POST', '/orders', {
    Tipo_Entrega: 'domicilio',
    Metodo_Pago: 'Efectivo',
    productos: [{ ID_Producto: 'P010', Cantidad: 1 }],
  }, clientToken);
  assert(created.status === 201, `status ${created.status}`);
  stateOrderId = created.data.id;
  const skip = await call('PUT', `/orders/${stateOrderId}/status`, { Estado: 'entregado' }, adminToken);
  assert(skip.status === 409, `salto status ${skip.status}`);
  const fwd = await call('PUT', `/orders/${stateOrderId}/status`, { Estado: 'preparando' }, adminToken);
  assert(fwd.status === 200, `avance status ${fwd.status}`);
  const back = await call('PUT', `/orders/${stateOrderId}/status`, { Estado: 'pendiente' }, adminToken);
  assert(back.status === 409, `retroceso status ${back.status}`);
});

await test('GET /payments/mode solo informa el modo configurado', async () => {
  const { status, data } = await call('GET', '/payments/mode');
  assert(status === 200, `status ${status}`);
  assert(data.mode === 'demo' || data.mode === 'disabled', `modo inesperado ${data.mode}`);
});

await test('POST /payments/process rechaza datos financieros', async () => {
  const { status, data } = await call('POST', '/payments/process', {
    method: 'card',
    cardNumber: '4111111111111111',
    expiryDate: '12/30',
    cvv: '123',
  }, clientToken);
  assert(status === 400, `status ${status}`);
  assert(data && data.success === false, 'respuesta de pago inesperada');
});

await test('POST /payments/process solo confirma una simulacion no pagada', async () => {
  const { data: mode } = await call('GET', '/payments/mode');
  const { status, data } = await call('POST', '/payments/process', { method: 'nequi' }, clientToken);
  if (mode.mode === 'demo') {
    assert(status === 200, `status ${status}`);
    assert(data.simulated === true && data.paid === false, 'la simulacion no debe representar un cobro');
    assert(typeof data.simulationId === 'string', 'falta referencia de simulacion');
  } else {
    assert(status === 503, `status ${status}`);
    assert(data.paid === false, 'el modo deshabilitado no debe informar pago');
  }
});

await test('POST /orders rechaza metodos electronicos sin verificacion', async () => {
  const { status } = await call('POST', '/orders', {
    Metodo_Pago: 'Tarjeta',
    Tipo_Entrega: 'domicilio',
    productos: [{ ID_Producto: 'P010', Cantidad: 1 }],
  }, clientToken);
  assert(status === 400, `status ${status}`);
});

await test('POST /orders rechaza comprobantes electronicos no verificados', async () => {
  const { status } = await call('POST', '/orders', {
    Metodo_Pago: 'Efectivo',
    Comprobante: 'data:image/png;base64,AA==',
    productos: [{ ID_Producto: 'P010', Cantidad: 1 }],
  }, clientToken);
  assert(status === 400, `status ${status}`);
});

await test('POST /products valida precio no negativo', async () => {
  const { status } = await call('POST', '/products', {
    ID_Producto: 'PX-TEST',
    Nombre: 'X',
    Descripcion: 'X',
    Precio_Venta: -5,
    Stock_Minimo: 1,
    ID_Categoria: 1,
  }, adminToken);
  assert(status === 400, `status ${status}`);
});

await test('POST /products duplicado es 409', async () => {
  const { status } = await call('POST', '/products', {
    ID_Producto: 'P001',
    Nombre: 'N',
    Descripcion: 'D',
    Precio_Venta: 100,
    Stock_Minimo: 1,
    ID_Categoria: 1,
  }, adminToken);
  assert(status === 409, `status ${status}`);
});

await test('PUT /products inexistente es 404', async () => {
  const { status } = await call('PUT', '/products/NO-EXISTE', {
    Nombre: 'N',
    Descripcion: 'D',
    Precio_Venta: 100,
    Stock_Minimo: 1,
    ID_Categoria: 1,
  }, adminToken);
  assert(status === 404, `status ${status}`);
});

const IMAGE_TEST_ID = 'PX-IMG-TEST';
const IMAGE_TEST_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

await test('GET /products expone promedio y total de calificaciones', async () => {
  const { status, data } = await call('GET', '/products');
  assert(status === 200 && Array.isArray(data), `status ${status}`);
  const rated = data.find((p) => p.ID_Producto === 'P001');
  assert(rated && Number(rated.Total_Calificaciones) > 0, 'P001 sin calificaciones');
  const avg = Number(rated.Promedio_Calificacion);
  assert(avg >= 1 && avg <= 5, `promedio invalido: ${rated.Promedio_Calificacion}`);
});

await test('PUT /products conserva la imagen si no se envia', async () => {
  // Limpia un resto de una ejecucion anterior, si existe.
  await call('DELETE', `/products/${IMAGE_TEST_ID}`, undefined, adminToken);
  const created = await call('POST', '/products', {
    ID_Producto: IMAGE_TEST_ID,
    Nombre: 'Producto imagen prueba',
    Descripcion: 'Prueba de preservacion de imagen',
    Imagen: IMAGE_TEST_DATA,
    Precio_Venta: 1000,
    Stock_Minimo: 5,
    ID_Categoria: 1,
  }, adminToken);
  assert(created.status === 201, `crear status ${created.status} ${JSON.stringify(created.data)}`);
  const updated = await call('PUT', `/products/${IMAGE_TEST_ID}`, {
    Nombre: 'Producto imagen prueba',
    Descripcion: 'Prueba de preservacion de imagen',
    Precio_Venta: 1200,
    Stock_Minimo: 6,
    ID_Categoria: 1,
  }, adminToken);
  assert(updated.status === 200, `actualizar status ${updated.status} ${JSON.stringify(updated.data)}`);
  const row = await call('GET', `/products/${IMAGE_TEST_ID}`);
  assert(row.status === 200, `detalle status ${row.status}`);
  assert(row.data.Imagen === IMAGE_TEST_DATA, 'la imagen se perdio al actualizar sin enviarla');
  assert(Number(row.data.Precio_Venta) === 1200, 'el precio no se actualizo');
});

await test('Limpieza del producto de prueba de imagen', async () => {
  const { status } = await call('DELETE', `/products/${IMAGE_TEST_ID}`, undefined, adminToken);
  assert(status === 200, `status ${status}`);
});

const DESC_TEST_ID = 'PX-DESC-TEST';

await test('PUT /products conserva la descripcion si no se envia', async () => {
  await call('DELETE', `/products/${DESC_TEST_ID}`, undefined, adminToken);
  const created = await call('POST', '/products', {
    ID_Producto: DESC_TEST_ID,
    Nombre: 'Producto descripcion prueba',
    Descripcion: 'Descripcion original de prueba',
    Precio_Venta: 1000,
    Stock_Minimo: 5,
    ID_Categoria: 1,
  }, adminToken);
  assert(created.status === 201, `crear status ${created.status} ${JSON.stringify(created.data)}`);
  // Actualizacion parcial sin el campo Descripcion: debe conservar la
  // descripcion real en lugar de reemplazarla por el nombre.
  const updated = await call('PUT', `/products/${DESC_TEST_ID}`, {
    Nombre: 'Producto descripcion prueba',
    Precio_Venta: 1200,
    Stock_Minimo: 6,
    ID_Categoria: 1,
  }, adminToken);
  assert(updated.status === 200, `actualizar status ${updated.status} ${JSON.stringify(updated.data)}`);
  const row = await call('GET', `/products/${DESC_TEST_ID}`);
  assert(row.status === 200, `detalle status ${row.status}`);
  assert(row.data.Descripcion === 'Descripcion original de prueba', `la descripcion cambio a: ${row.data.Descripcion}`);
  assert(Number(row.data.Precio_Venta) === 1200, 'el precio no se actualizo');
});

await test('PUT /products actualiza la descripcion cuando se envia', async () => {
  const updated = await call('PUT', `/products/${DESC_TEST_ID}`, {
    Nombre: 'Producto descripcion prueba',
    Descripcion: 'Descripcion editada por el admin',
    Precio_Venta: 1200,
    Stock_Minimo: 6,
    ID_Categoria: 1,
  }, adminToken);
  assert(updated.status === 200, `actualizar status ${updated.status} ${JSON.stringify(updated.data)}`);
  const row = await call('GET', `/products/${DESC_TEST_ID}`);
  assert(row.status === 200, `detalle status ${row.status}`);
  assert(row.data.Descripcion === 'Descripcion editada por el admin', `descripcion: ${row.data.Descripcion}`);
});

await test('POST /products sin descripcion usa el nombre (alta)', async () => {
  await call('DELETE', `/products/${DESC_TEST_ID}`, undefined, adminToken);
  const created = await call('POST', '/products', {
    ID_Producto: DESC_TEST_ID,
    Nombre: 'Producto sin descripcion',
    Precio_Venta: 1000,
    Stock_Minimo: 5,
    ID_Categoria: 1,
  }, adminToken);
  assert(created.status === 201, `crear status ${created.status} ${JSON.stringify(created.data)}`);
  const row = await call('GET', `/products/${DESC_TEST_ID}`);
  assert(row.status === 200, `detalle status ${row.status}`);
  assert(row.data.Descripcion === 'Producto sin descripcion', `descripcion: ${row.data.Descripcion}`);
});

await test('Limpieza del producto de prueba de descripcion', async () => {
  const { status } = await call('DELETE', `/products/${DESC_TEST_ID}`, undefined, adminToken);
  assert(status === 200 || status === 404, `status ${status}`);
});

let foreignOrderId = null;

await test('POST /ratings de pedido ajeno es 403', async () => {
  const created = await call('POST', '/orders', {
    Tipo_Entrega: 'domicilio',
    Metodo_Pago: 'Efectivo',
    productos: [{ ID_Producto: 'P010', Cantidad: 1 }],
  }, adminToken);
  assert(created.status === 201, `status ${created.status}`);
  foreignOrderId = created.data.id;
  const { status } = await call('POST', '/ratings', {
    Tipo: 'pedido',
    ID_Pedido: foreignOrderId,
    Estrellas: 5,
  }, clientToken);
  assert(status === 403, `status ${status}`);
});

/* --- Limpieza: elimina la calificacion y el pedido de prueba --- */
await test('DELETE /ratings/:id limpia la prueba', async () => {
  const ratingId = results.find((r) => r.ratingId)?.ratingId;
  assert(ratingId, 'sin id de prueba');
  const response = await fetch(`${API}/ratings/${ratingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(response.status === 200, `status ${response.status}`);
});

await test('Limpieza del pedido de prueba en BD', async () => {
  assert(cancelOrderId, 'sin pedido de prueba');
  const { execSync } = await import('node:child_process');
  const { existsSync } = await import('node:fs');
  const candidates = [
    process.env.MYSQL_BIN ? `${process.env.MYSQL_BIN}\\mysql.exe` : '',
    'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
    `${process.env.LOCALAPPDATA}\\MySQL-8.4\\mysql-8.4.9-winx64\\bin\\mysql.exe`,
    'C:\\xampp\\mysql\\bin\\mysql.exe',
  ].filter((c) => c && existsSync(c));
  assert(candidates.length > 0, 'sin cliente mysql');
  execSync(
    `"${candidates[0]}" -u ${process.env.DB_ADMIN_USER || 'root'} -e "DELETE FROM parque100.detalle_pedido WHERE ID_Pedido=${cancelOrderId}; DELETE FROM parque100.pedidos WHERE ID_Pedido=${cancelOrderId};"`,
  );
});

await test('Limpieza del pedido de la resena en BD (restaura stock)', async () => {
  assert(reviewOrderId, 'sin pedido de resena');
  const { execSync } = await import('node:child_process');
  const { existsSync } = await import('node:fs');
  const candidates = [
    process.env.MYSQL_BIN ? `${process.env.MYSQL_BIN}\\mysql.exe` : '',
    'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
    `${process.env.LOCALAPPDATA}\\MySQL-8.4\\mysql-8.4.9-winx64\\bin\\mysql.exe`,
    'C:\\xampp\\mysql\\bin\\mysql.exe',
  ].filter((c) => c && existsSync(c));
  assert(candidates.length > 0, 'sin cliente mysql');
  execSync(
    `"${candidates[0]}" -u ${process.env.DB_ADMIN_USER || 'root'} -e "UPDATE parque100.productos SET Stock_Minimo = Stock_Minimo + 1 WHERE ID_Producto='${REVIEW_PRODUCT}'; DELETE FROM parque100.detalle_pedido WHERE ID_Pedido=${reviewOrderId}; DELETE FROM parque100.pedidos WHERE ID_Pedido=${reviewOrderId};"`,
  );
});

await test('Limpieza del pedido ajeno en BD (restaura stock)', async () => {
  assert(ownedOrderId, 'sin pedido ajeno');
  const { execSync } = await import('node:child_process');
  const { existsSync } = await import('node:fs');
  const candidates = [
    process.env.MYSQL_BIN ? `${process.env.MYSQL_BIN}\\mysql.exe` : '',
    'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
    `${process.env.LOCALAPPDATA}\\MySQL-8.4\\mysql-8.4.9-winx64\\bin\\mysql.exe`,
    'C:\\xampp\\mysql\\bin\\mysql.exe',
  ].filter((c) => c && existsSync(c));
  assert(candidates.length > 0, 'sin cliente mysql');
  execSync(
    `"${candidates[0]}" -u ${process.env.DB_ADMIN_USER || 'root'} -e "UPDATE parque100.productos SET Stock_Minimo = Stock_Minimo + 1 WHERE ID_Producto='P010'; DELETE FROM parque100.detalle_pedido WHERE ID_Pedido=${ownedOrderId}; DELETE FROM parque100.pedidos WHERE ID_Pedido=${ownedOrderId};"`,
  );
});

await test('Limpieza de pedidos de integridad en BD (restaura stock)', async () => {
  assert(tamperOrderId && stateOrderId && foreignOrderId, 'sin pedidos de integridad');
  const { execSync } = await import('node:child_process');
  const { existsSync } = await import('node:fs');
  const candidates = [
    process.env.MYSQL_BIN ? `${process.env.MYSQL_BIN}\\mysql.exe` : '',
    'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
    `${process.env.LOCALAPPDATA}\\MySQL-8.4\\mysql-8.4.9-winx64\\bin\\mysql.exe`,
    'C:\\xampp\\mysql\\bin\\mysql.exe',
  ].filter((c) => c && existsSync(c));
  assert(candidates.length > 0, 'sin cliente mysql');
  const ids = [tamperOrderId, stateOrderId, foreignOrderId].join(',');
  execSync(
    `"${candidates[0]}" -u ${process.env.DB_ADMIN_USER || 'root'} -e "UPDATE parque100.productos SET Stock_Minimo = Stock_Minimo + 3 WHERE ID_Producto='P010'; DELETE FROM parque100.detalle_pedido WHERE ID_Pedido IN (${ids}); DELETE FROM parque100.pedidos WHERE ID_Pedido IN (${ids});"`,
  );
});

await test('Limpieza de aceptación temporal del descargo', cleanupTestDisclaimerAcceptance);
console.log(`\n${passed} pasadas, ${failed} fallidas`);
process.exitCode = failed > 0 ? 1 : 0;
