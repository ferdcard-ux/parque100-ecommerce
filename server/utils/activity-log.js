import { appendFile, mkdir, rename, stat, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const LOG_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'logs', 'site-activity.jsonl');
const MAX_LOG_BYTES = 5 * 1024 * 1024;
let writeQueue = Promise.resolve();
const INTERACTION_ACTIONS = {
  'cart.add': 'Agregó al carrito',
  'cart.remove': 'Retiró del carrito',
  'favorite.add': 'Agregó a favoritos',
  'favorite.remove': 'Quitó de favoritos',
  'session.logout': 'Cerró sesión de tienda',
};

const SESSION_EVENTS = /^(login|session)\./;

/** Recorta y limpia un texto apto para el registro (sin controles). */
function safeText(value, max = 120) {
  if (typeof value !== 'string') return null;
  const text = value.replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.slice(0, max) : null;
}

/** Identificador seguro de recurso (número o etiqueta corta). */
function safeResourceId(value) {
  return (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
    || (typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value));
}

/** Detalle corto con el nombre de un producto, categoría o unidad. */
function namedResource(name, id) {
  const label = safeText(name, 80);
  if (label && id !== undefined && id !== null) return `«${label}» (#${id})`;
  if (label) return `«${label}»`;
  return id !== undefined && id !== null ? `(#${id})` : null;
}

/** Cantidad de líneas y unidades de un pedido, sin importes. */
function orderDetail(body) {
  const items = Array.isArray(body?.productos) ? body.productos : [];
  const parts = [];
  if (items.length) parts.push(`${items.length} producto(s)`);
  const units = items.reduce((sum, item) => {
    const quantity = Number(item?.Cantidad);
    return sum + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
  }, 0);
  if (units) parts.push(`${units} unidad(es)`);
  const method = safeText(body?.Metodo_Pago, 24);
  if (method) parts.push(`pago: ${method}`);
  return parts.join(' · ') || null;
}

/** Filtros de consulta reconocidos (nunca valores arbitrarios). */
function catalogDetail(query) {
  if (!query || typeof query !== 'object') return null;
  const parts = [];
  const category = safeText(query.ID_Categoria || query.categoria, 24);
  if (category) parts.push(`categoría #${category}`);
  const search = safeText(query.search || query.buscar || query.q, 60);
  if (search) parts.push('con búsqueda aplicada');
  const estado = safeText(query.estado || query.status, 24);
  if (estado) parts.push(`estado: ${estado}`);
  if (query.items === '1') parts.push('con detalle de líneas');
  return parts.join(' · ') || null;
}

/** Define la acción, el tipo de evento y un detalle por defecto. */
const activityFor = (req, res) => {
  const method = req.method;
  const pathname = req.path || '/';
  const explicitDetail = safeText(res?.locals?.activityDetail, 160);
  const make = (action, event, fallbackDetail = null) => ({
    action,
    event,
    detail: explicitDetail || fallbackDetail || null,
  });
  if (method === 'GET' && pathname === '/products') {
    return make('Consultó el catálogo', 'catalog.view',
      catalogDetail(req.query) || 'sin filtros');
  }
  let match = pathname.match(/^\/products\/([A-Za-z0-9_-]{1,64})$/);
  if (method === 'GET' && match) {
    return make(`Consultó el producto ${match[1]}`, 'product.view', null);
  }
  if (method === 'POST' && pathname === '/auth/login') {
    const success = res?.statusCode >= 200 && res?.statusCode < 300;
    return make(
      success ? 'Inició sesión en la tienda'
        : 'Falló el inicio de sesión en la tienda',
      success ? 'login.store.ok' : 'login.store.fail',
      success && req.user?.id ? `Cuenta #${req.user.id}` : 'Credenciales rechazadas',
    );
  }
  if (method === 'GET' && pathname === '/orders') {
    const staff = ['admin', 'domiciliario', 'empleado'].includes(req.user?.rol);
    return make(staff ? 'Consultó los pedidos' : 'Consultó sus pedidos',
      'orders.view', null);
  }
  match = pathname.match(/^\/orders\/(\d+)$/);
  if (method === 'GET' && match) {
    return make(`Consultó el pedido #${match[1]}`, 'order.view', null);
  }
  if (method === 'POST' && pathname === '/orders') {
    return make('Creó un pedido', 'order.create', orderDetail(req.body));
  }
  match = pathname.match(/^\/orders\/(\d+)\/status$/);
  if (method === 'PUT' && match) {
    return make(`Actualizó el estado del pedido #${match[1]}`, 'order.status',
      safeText(req.body?.Estado, 24) ? `Nuevo estado: ${safeText(req.body.Estado, 24)}` : null);
  }
  match = pathname.match(/^\/orders\/(\d+)\/cancel$/);
  if (method === 'PUT' && match) {
    const actor = safeText(req.body?.Actor, 24);
    return make(`Canceló el pedido #${match[1]}`, 'order.cancel',
      actor ? `Actor: ${actor}` : null);
  }
  if (method === 'POST' && pathname === '/payments/process') {
    const channel = safeText(req.body?.method, 24);
    return make('Inició el flujo de pago DEMO', 'payment.process',
      channel ? `Método: ${channel}` : null);
  }
  if (method === 'POST' && pathname === '/payments/confirm') {
    return make('Confirmó un pedido DEMO', 'payment.confirm', null);
  }
  if (method === 'PUT' && /^\/payments\/[^/]+\/cancel$/.test(pathname)) {
    return make('Canceló un intento de pago DEMO', 'payment.cancel', null);
  }
  if (method === 'POST' && pathname === '/products') {
    return make('Creó un producto', 'product.create',
      namedResource(req.body?.Nombre, req.body?.ID_Producto));
  }
  match = pathname.match(/^\/products\/([A-Za-z0-9_-]{1,64})$/);
  if (method === 'PUT' && match) {
    return make(`Editó el producto ${match[1]}`, 'product.update',
      namedResource(req.body?.Nombre, match[1]));
  }
  if (method === 'DELETE' && match) {
    return make(`Eliminó el producto ${match[1]}`, 'product.delete', null);
  }
  if (method === 'POST' && pathname === '/categories') {
    return make('Creó una categoría', 'category.create',
      namedResource(req.body?.Nombre_Categoria));
  }
  if (method === 'PUT' && /^\/categories\/\d+$/.test(pathname)) {
    return make(`Editó la categoría #${pathname.split('/').pop()}`,
      'category.update', namedResource(req.body?.Nombre_Categoria));
  }
  if (method === 'DELETE' && /^\/categories\/\d+$/.test(pathname)) {
    return make(`Eliminó la categoría #${pathname.split('/').pop()}`,
      'category.delete', null);
  }
  if (method === 'POST' && pathname === '/units') {
    return make('Creó una unidad de medida', 'unit.create',
      namedResource(req.body?.Nombre_Unidad));
  }
  if (method === 'PUT' && /^\/units\/\d+$/.test(pathname)) {
    return make(`Editó la unidad de medida #${pathname.split('/').pop()}`,
      'unit.update', namedResource(req.body?.Nombre_Unidad));
  }
  if (method === 'DELETE' && /^\/units\/\d+$/.test(pathname)) {
    return make(`Eliminó la unidad de medida #${pathname.split('/').pop()}`,
      'unit.delete', null);
  }
  if (method === 'POST' && pathname === '/users') {
    const role = safeText(req.body?.Rol, 24);
    return make('Creó un usuario de tienda', 'store-user.create',
      role ? `Rol: ${role}` : null);
  }
  match = pathname.match(/^\/users\/(\d+)\/admin$/);
  if (method === 'PUT' && match) {
    const role = safeText(req.body?.Rol, 24);
    return make(`Editó el usuario de tienda #${match[1]}`, 'store-user.update',
      role ? `Rol: ${role}` : null);
  }
  match = pathname.match(/^\/users\/(\d+)$/);
  if (method === 'DELETE' && match) {
    return make(`Eliminó el usuario de tienda #${match[1]}`, 'store-user.delete', null);
  }
  if (method === 'PUT' && /^\/users\/\d+$/.test(pathname)) {
    return make(`Actualizó los datos de entrega del usuario #${pathname.split('/').pop()}`,
      'store-user.profile', null);
  }
  if (method === 'PUT' && /^\/users\/\d+\/profile$/.test(pathname)) {
    return make('Actualizó su perfil de tienda', 'store-user.profile', null);
  }
  if (method === 'PUT' && /^\/users\/\d+\/permissions$/.test(pathname)) {
    return make(`Actualizó permisos del usuario #${pathname.split('/')[2]}`,
      'store-user.permissions', null);
  }
  if (method === 'PUT' && pathname === '/auth/password') {
    return make('Cambió su contraseña de tienda', 'login.password', null);
  }
  if (method === 'POST' && pathname === '/ratings') {
    const product = safeText(req.body?.ID_Producto, 64);
    const stars = Number(req.body?.Estrellas);
    const parts = [];
    if (product) parts.push(`producto #${product}`);
    if (Number.isInteger(stars) && stars >= 1 && stars <= 5) parts.push(`${stars}★`);
    return make('Publicó una valoración', 'rating.create',
      parts.join(' · ') || null);
  }
  if (method === 'PUT' && /^\/ratings\/\d+$/.test(pathname)) {
    const stars = Number(req.body?.Estrellas);
    return make(`Editó la valoración #${pathname.split('/').pop()}`,
      'rating.update',
      Number.isInteger(stars) && stars >= 1 && stars <= 5 ? `${stars}★` : null);
  }
  if (method === 'DELETE' && /^\/ratings\/\d+$/.test(pathname)) {
    return make(`Eliminó la valoración #${pathname.split('/').pop()}`,
      'rating.delete', null);
  }
  if (method === 'PUT' && pathname === '/business') {
    return make('Actualizó los datos del negocio', 'business.update',
      namedResource(req.body?.Nombre));
  }
  return null;
};

/** Clasifica un evento como interacción de negocio o de sesión. */
function eventKind(event) {
  return SESSION_EVENTS.test(event || '') ? 'session' : 'interaction';
}

export function createActivityRecord(
  req,
  statusCode,
  timestamp = new Date(),
  actionOverride = null,
  eventOverride = null,
  detailOverride = null,
  response = null,
) {
  const definition = actionOverride
    ? {
      action: actionOverride,
      event: eventOverride || 'interaction',
      detail: safeText(detailOverride, 160),
    }
    : activityFor(req, response || { locals: {}, statusCode });
  if (!definition) return null;
  const siteUser = safeText(req.siteAccess?.username, 64);
  if (!siteUser) return null;

  const storeUserId = Number(req.user?.id);
  return {
    id: randomUUID(),
    timestamp: timestamp.toISOString(),
    siteUser,
    storeUserId: Number.isSafeInteger(storeUserId) && storeUserId > 0 ? storeUserId : null,
    storeRole: typeof req.user?.rol === 'string' ? req.user.rol.slice(0, 32) : null,
    action: definition.action,
    detail: definition.detail || null,
    event: definition.event,
    kind: eventKind(definition.event),
    outcome: statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'RECHAZADO' : 'OK',
    httpStatus: statusCode,
  };
}

export function createInteractionRecord(
  req,
  event,
  resourceId,
  timestamp = new Date(),
  resourceName = null,
) {
  const label = INTERACTION_ACTIONS[event];
  const requiresResource = event !== 'session.logout';
  if (!label || (requiresResource && !safeResourceId(resourceId))
    || (!requiresResource && resourceId !== undefined)) return null;
  const target = requiresResource
    ? namedResource(resourceName, resourceId)
    : null;
  return createActivityRecord(
    req,
    202,
    timestamp,
    target ? `${label} ${target}` : label,
    event,
    null,
  );
}

/**
 * Registra un evento de sesión (inicio, fallo, bloqueo, cierre o revocación)
 * sin necesitar una identidad de tienda autenticada.
 */
export function createSessionRecord({
  username,
  action,
  event,
  outcome = 'OK',
  detail = null,
  httpStatus = null,
  timestamp = new Date(),
}) {
  const siteUser = safeText(username, 64) || '(desconocido)';
  const label = safeText(action, 160);
  if (!label || !SESSION_EVENTS.test(event || '')) return null;
  const safeOutcome = ['OK', 'RECHAZADO', 'ERROR', 'BLOQUEADO'].includes(outcome)
    ? outcome : 'OK';
  return {
    id: randomUUID(),
    timestamp: timestamp.toISOString(),
    siteUser,
    storeUserId: null,
    storeRole: null,
    action: label,
    detail: safeText(detail, 160),
    event,
    kind: 'session',
    outcome: safeOutcome,
    httpStatus: Number.isInteger(httpStatus) ? httpStatus : null,
  };
}

async function appendRecord(record) {
  await mkdir(dirname(LOG_PATH), { recursive: true });
  try {
    const current = await stat(LOG_PATH);
    if (current.size >= MAX_LOG_BYTES) {
      const previousPath = `${LOG_PATH}.1`;
      try {
        await unlink(previousPath);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      await rename(LOG_PATH, previousPath);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await appendFile(LOG_PATH, `${JSON.stringify(record)}\n`, 'utf8');
}

export function writeActivityRecord(record) {
  if (!record || process.env.SITE_ACTIVITY_LOG === 'off') {
    return Promise.resolve(true);
  }
  writeQueue = writeQueue
    .then(async () => {
      await appendRecord(record);
      return true;
    })
    .catch((error) => {
      console.error('[activity-log] No fue posible guardar el registro:', error.message);
      return false;
    });
  return writeQueue;
}

export function activityLogMiddleware(req, res, next) {
  res.once('finish', () => {
    const record = createActivityRecord(req, res.statusCode, new Date(),
      null, null, null, res);
    if (record) void writeActivityRecord(record);
  });
  next();
}

export default {
  activityLogMiddleware,
  createActivityRecord,
  createInteractionRecord,
  createSessionRecord,
  writeActivityRecord,
};
