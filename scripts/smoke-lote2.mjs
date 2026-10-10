/**
 * @fileoverview Pruebas automatizadas del lote 1 y 2 (API + BD).
 * Verifica negocio, permisos, calificaciones, foto de perfil y roles.
 * Uso: node scripts/smoke-lote2.mjs
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
 * @returns {Promise<{status: number, data: any}>} Respuesta.
 */
async function call(method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

const results = [];

/* --- Negocio (lote 1) --- */
await test('GET /business responde la ficha', async () => {
  const { status, data } = await call('GET', '/business');
  assert(status === 200, `status ${status}`);
  assert(data.Nombre === 'Tienda Parque 100', 'nombre inesperado');
  results.push({ negocio: data });
});

await test('PUT /business valida nombre obligatorio', async () => {
  const { status } = await call('PUT', '/business', { Nombre: '' });
  assert(status === 400, `status ${status}`);
});

await test('PUT /business guarda y devuelve la ficha', async () => {
  const before = (await call('GET', '/business')).data;
  const { status, data } = await call('PUT', '/business', { ...before, Horario: 'Lun-Sab 8:00-19:00' });
  assert(status === 200, `status ${status}`);
  assert(data.Horario === 'Lun-Sab 8:00-19:00', 'horario no actualizado');
  await call('PUT', '/business', before);
});

/* --- Permisos / roles (lote 2) --- */
await test('GET /users/2/permissions (admin puede cancelar)', async () => {
  const { status, data } = await call('GET', '/users/2/permissions');
  assert(status === 200, `status ${status}`);
  assert(data.puede_cancelar === true, 'admin deberia poder cancelar');
});

await test('PUT /users/1/permissions delega y revierte', async () => {
  const r1 = await call('PUT', '/users/1/permissions', { puede_cancelar: true });
  assert(r1.status === 200 && r1.data.puede_cancelar === true, 'no delego');
  const r2 = await call('PUT', '/users/1/permissions', { puede_cancelar: false });
  assert(r2.status === 200 && r2.data.puede_cancelar === false, 'no revoco');
});

await test('PUT /users/1/permissions rechaza no booleano', async () => {
  const { status } = await call('PUT', '/users/1/permissions', { puede_cancelar: 'si' });
  assert(status === 400, `status ${status}`);
});

await test('GET /users expone Foto y Rol', async () => {
  const { status, data } = await call('GET', '/users');
  assert(status === 200 && Array.isArray(data), `status ${status}`);
  assert('Foto' in data[0] && 'Rol' in data[0], 'faltan columnas');
});

await test('Login admin y cliente conservan roles', async () => {
  const admin = await call('POST', '/auth/login', { Correo: 'admin@parque100.com', Contrasena: 'admin123' });
  assert(admin.status === 200 && admin.data.rol === 'admin', 'rol admin inesperado');
  const client = await call('POST', '/auth/login', { Correo: 'usuario@ejemplo.com', Contrasena: '12345678' });
  assert(client.status === 200, `login cliente status ${client.status}`);
});

/* --- Reglas de cancelacion por actor --- */
let cancelOrderId = null;

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
  });
  assert(status === 201, `status ${status} ${JSON.stringify(data)}`);
  cancelOrderId = data.id;
  const st = await call('PUT', `/orders/${cancelOrderId}/status`, { Estado: 'enviando' });
  assert(st.status === 200, `a enviando status ${st.status}`);
});

await test('Cliente NO cancela en enviando (409)', async () => {
  const { status, data } = await call('PUT', `/orders/${cancelOrderId}/cancel`, {
    Motivo: 'Ya no lo quiero',
    Actor: 'cliente',
    ActorId: 1,
  });
  assert(status === 409, `status ${status} ${JSON.stringify(data)}`);
});

await test('Domiciliario sin permiso NO cancela (403)', async () => {
  const orig = await call('GET', '/users/4/permissions');
  await call('PUT', '/users/4/permissions', { puede_cancelar: false });
  const { status } = await call('PUT', `/orders/${cancelOrderId}/cancel`, {
    Motivo: 'Prueba',
    Actor: 'domiciliario',
    ActorId: 4,
  });
  assert(status === 403, `status ${status}`);
  await call('PUT', '/users/4/permissions', { puede_cancelar: orig.data?.puede_cancelar ?? false });
});

await test('Domiciliario con permiso SI cancela en enviando', async () => {
  const orig = await call('GET', '/users/4/permissions');
  await call('PUT', '/users/4/permissions', { puede_cancelar: true });
  const { status } = await call('PUT', `/orders/${cancelOrderId}/cancel`, {
    Motivo: 'Prueba automatizada',
    Actor: 'domiciliario',
    ActorId: 4,
  });
  assert(status === 200, `status ${status}`);
  await call('PUT', '/users/4/permissions', { puede_cancelar: orig.data?.puede_cancelar ?? false });
});
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

await test('PUT /users/1/profile guarda y devuelve Foto', async () => {
  const before = await call('GET', '/users/1');
  const profile = {
    Nombre: 'Usuario Demo',
    Correo: 'usuario@ejemplo.com',
    Telefono: before.data?.Telefono ? String(before.data.Telefono) : '',
    Foto: PIXEL,
  };
  const { status, data } = await call('PUT', '/users/1/profile', profile);
  assert(status === 200, `status ${status} ${JSON.stringify(data)}`);
  assert(data.Foto === PIXEL, 'foto no persistida');
  await call('PUT', '/users/1/profile', { Nombre: profile.Nombre, Correo: profile.Correo, Telefono: profile.Telefono, Foto: null });
});

await test('PUT /users/1/profile rechaza foto invalida', async () => {
  const { status } = await call('PUT', '/users/1/profile', {
    Nombre: 'Usuario Demo',
    Correo: 'usuario@ejemplo.com',
    Telefono: '',
    Foto: 'no-es-imagen',
  });
  assert(status === 400, `status ${status}`);
});

/* --- Calificaciones (lote 2) --- */
let summaryBefore = { total: 0, promedio: null };

await test('GET /ratings/resumen base de P001', async () => {
  const { status, data } = await call('GET', '/ratings/resumen?producto=P001');
  assert(status === 200, `status ${status}`);
  summaryBefore = data;
});

await test('POST /ratings producto 5 estrellas', async () => {
  const { status, data } = await call('POST', '/ratings', {
    ID_Usuario: 1,
    ID_Producto: 'P001',
    Tipo: 'producto',
    Estrellas: 5,
    Comentario: 'Prueba automatizada',
  });
  assert(status === 201, `status ${status} ${JSON.stringify(data)}`);
  results.push({ ratingId: data.id });
});

await test('GET /ratings/resumen suma la nueva calificacion', async () => {
  const { status, data } = await call('GET', '/ratings/resumen?producto=P001');
  assert(status === 200, `status ${status}`);
  assert(data.total === summaryBefore.total + 1, `total ${data.total} vs base ${summaryBefore.total}`);
  const expected = (Number(summaryBefore.promedio || 0) * summaryBefore.total + 5) / data.total;
  assert(Math.abs(Number(data.promedio) - expected) < 0.01, `promedio ${data.promedio} vs ${expected}`);
});

await test('POST /ratings rechaza 6 estrellas', async () => {
  const { status } = await call('POST', '/ratings', { ID_Producto: 'P001', Tipo: 'producto', Estrellas: 6 });
  assert(status === 400, `status ${status}`);
});

await test('POST /ratings pedido sin ID_Pedido es 400', async () => {
  const { status } = await call('POST', '/ratings', { Tipo: 'pedido', Estrellas: 4 });
  assert(status === 400, `status ${status}`);
});

await test('GET /ratings?producto=P001 lista la prueba', async () => {
  const { status, data } = await call('GET', '/ratings?producto=P001');
  assert(status === 200 && data.some((r) => r.Comentario === 'Prueba automatizada'), 'no encontrada');
});

/* --- Pedidos pendientes (badge lote 1) --- */
await test('GET /orders responde lista para el badge', async () => {
  const { status, data } = await call('GET', '/orders');
  assert(status === 200 && Array.isArray(data), `status ${status}`);
  console.log(`  info: ${data.filter((o) => o.Estado === 'pendiente').length} pendientes de ${data.length}`);
});

/* --- Limpieza: elimina la calificacion y el pedido de prueba --- */
await test('DELETE /ratings/:id limpia la prueba', async () => {
  const ratingId = results.find((r) => r.ratingId)?.ratingId;
  assert(ratingId, 'sin id de prueba');
  const response = await fetch(`${API}/ratings/${ratingId}`, { method: 'DELETE' });
  assert(response.status === 200, `status ${response.status}`);
});

await test('Limpieza del pedido de prueba en BD', async () => {
  assert(cancelOrderId, 'sin pedido de prueba');
  const { execSync } = await import('node:child_process');
  execSync(
    `"C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe" -u root -e "DELETE FROM parque100.detalle_pedido WHERE ID_Pedido=${cancelOrderId}; DELETE FROM parque100.pedidos WHERE ID_Pedido=${cancelOrderId};"`,
  );
});

console.log(`\n${passed} pasadas, ${failed} fallidas`);
process.exit(failed > 0 ? 1 : 0);
