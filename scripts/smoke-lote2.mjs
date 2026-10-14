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
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
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

await test('Login admin emite token', async () => {
  adminToken = await login('admin@parque100.com', 'admin123');
});

await test('Login cliente emite token y conserva rol', async () => {
  const { status, data } = await call('POST', '/auth/login', {
    Correo: 'usuario@ejemplo.com',
    Contrasena: '12345678',
  });
  assert(status === 200 && data.rol !== 'admin', `status ${status}`);
  assert(typeof data.token === 'string' && data.token.length > 10, 'sin token');
  clientToken = data.token;
});

await test('Login domiciliario emite token', async () => {
  deliveryToken = await login('domiciliario@parque100.com', 'domiciliario123');
});

await test('Login con clave erronea es 401', async () => {
  const { status } = await call('POST', '/auth/login', {
    Correo: 'usuario@ejemplo.com',
    Contrasena: 'clave-mala',
  });
  assert(status === 401, `status ${status}`);
});

await test('Recover es neutro y no expone la clave', async () => {
  const { status, data } = await call('POST', '/auth/recover', { Correo: 'nadie@ejemplo.com' });
  assert(status === 200, `status ${status}`);
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
  const st = await call('PUT', `/orders/${reviewOrderId}/status`, { Estado: 'entregado' }, adminToken);
  assert(st.status === 200, `a entregado status ${st.status}`);
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

await test('GET /orders del cliente solo trae los propios', async () => {
  const { status, data } = await call('GET', '/orders', undefined, clientToken);
  assert(status === 200 && Array.isArray(data), `status ${status}`);
  assert(data.every((o) => Number(o.ID_Usuario) === 1), 'hay pedidos ajenos');
});

await test('GET /orders del staff trae todos', async () => {
  const { status, data } = await call('GET', '/orders', undefined, deliveryToken);
  assert(status === 200 && Array.isArray(data) && data.length > 0, `status ${status}`);
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
    `"${candidates[0]}" -u root -e "DELETE FROM parque100.detalle_pedido WHERE ID_Pedido=${cancelOrderId}; DELETE FROM parque100.pedidos WHERE ID_Pedido=${cancelOrderId};"`,
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
    `"${candidates[0]}" -u root -e "UPDATE parque100.productos SET Stock_Minimo = Stock_Minimo + 1 WHERE ID_Producto='${REVIEW_PRODUCT}'; DELETE FROM parque100.detalle_pedido WHERE ID_Pedido=${reviewOrderId}; DELETE FROM parque100.pedidos WHERE ID_Pedido=${reviewOrderId};"`,
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
    `"${candidates[0]}" -u root -e "UPDATE parque100.productos SET Stock_Minimo = Stock_Minimo + 1 WHERE ID_Producto='P010'; DELETE FROM parque100.detalle_pedido WHERE ID_Pedido=${ownedOrderId}; DELETE FROM parque100.pedidos WHERE ID_Pedido=${ownedOrderId};"`,
  );
});

console.log(`\n${passed} pasadas, ${failed} fallidas`);
process.exit(failed > 0 ? 1 : 0);
