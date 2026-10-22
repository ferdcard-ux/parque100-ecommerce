import { appendFile, mkdir, rename, stat, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const LOG_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'logs', 'site-activity.jsonl');
const MAX_LOG_BYTES = 5 * 1024 * 1024;
let writeQueue = Promise.resolve();
const INTERACTION_ACTIONS = {
  'cart.add': 'Agregó un producto al carrito',
  'cart.remove': 'Retiró un producto del carrito',
  'favorite.add': 'Agregó un producto a favoritos',
  'favorite.remove': 'Quitó un producto de favoritos',
  'session.logout': 'Cerró sesión de tienda',
};

const activityFor = (method, pathname) => {
  if (method === 'GET' && pathname === '/products') return 'Consultó el catálogo';
  let match = pathname.match(/^\/products\/([A-Za-z0-9_-]{1,64})$/);
  if (method === 'GET' && match) return `Consultó el producto ${match[1]}`;
  if (method === 'POST' && pathname === '/auth/login') return 'Intentó iniciar sesión en la tienda';
  if (method === 'GET' && pathname === '/orders') return 'Consultó sus pedidos';
  match = pathname.match(/^\/orders\/(\d+)$/);
  if (method === 'GET' && match) return `Consultó el pedido #${match[1]}`;
  if (method === 'POST' && pathname === '/orders') return 'Creó un pedido en efectivo';
  match = pathname.match(/^\/orders\/(\d+)\/status$/);
  if (method === 'PUT' && match) return `Actualizó el estado del pedido #${match[1]}`;
  match = pathname.match(/^\/orders\/(\d+)\/cancel$/);
  if (method === 'PUT' && match) return `Canceló el pedido #${match[1]}`;
  if (method === 'POST' && pathname === '/payments/process') return 'Inició el flujo de pago DEMO';
  if (method === 'POST' && pathname === '/payments/confirm') return 'Confirmó un pedido DEMO';
  if (method === 'PUT' && /^\/payments\/[^/]+\/cancel$/.test(pathname)) return 'Canceló un intento de pago DEMO';
  if (method === 'POST' && pathname === '/products') return 'Creó un producto';
  if (method === 'POST' && pathname === '/categories') return 'Creó una categoría';
  if (method === 'PUT' && /^\/categories\/\d+$/.test(pathname)) return 'Editó una categoría';
  if (method === 'DELETE' && /^\/categories\/\d+$/.test(pathname)) return 'Eliminó una categoría';
  if (method === 'POST' && pathname === '/units') return 'Creó una unidad de medida';
  if (method === 'PUT' && /^\/units\/\d+$/.test(pathname)) return 'Editó una unidad de medida';
  if (method === 'DELETE' && /^\/units\/\d+$/.test(pathname)) return 'Eliminó una unidad de medida';
  match = pathname.match(/^\/products\/([A-Za-z0-9_-]{1,64})$/);
  if (method === 'PUT' && match) return `Editó el producto ${match[1]}`;
  if (method === 'DELETE' && match) return `Eliminó el producto ${match[1]}`;
  if (method === 'POST' && pathname === '/users') return 'Creó un usuario de tienda';
  if (method === 'PUT' && /^\/users\/\d+\/admin$/.test(pathname)) return 'Editó un usuario de tienda';
  if (method === 'DELETE' && /^\/users\/\d+$/.test(pathname)) return 'Eliminó un usuario de tienda';
  if (method === 'POST' && pathname === '/ratings') return 'Publicó una valoración';
  if (method === 'PUT' && /^\/ratings\/\d+$/.test(pathname)) return 'Editó una valoración';
  if (method === 'DELETE' && /^\/ratings\/\d+$/.test(pathname)) return 'Eliminó una valoración';
  if (method === 'PUT' && pathname === '/business') return 'Actualizó los datos del negocio';
  return null;
};

export function createActivityRecord(
  req,
  statusCode,
  timestamp = new Date(),
  actionOverride = null,
) {
  const action = actionOverride || activityFor(req.method, req.path);
  const siteUser = req.siteAccess?.username;
  if (!action || typeof siteUser !== 'string' || !siteUser) return null;

  const storeUserId = Number(req.user?.id);
  return {
    id: randomUUID(),
    timestamp: timestamp.toISOString(),
    siteUser: siteUser.slice(0, 64),
    storeUserId: Number.isSafeInteger(storeUserId) && storeUserId > 0 ? storeUserId : null,
    storeRole: typeof req.user?.rol === 'string' ? req.user.rol.slice(0, 32) : null,
    action,
    outcome: statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'RECHAZADO' : 'OK',
    httpStatus: statusCode,
  };
}

export function createInteractionRecord(req, event, resourceId, timestamp = new Date()) {
  const label = INTERACTION_ACTIONS[event];
  const requiresResource = event !== 'session.logout';
  const validResourceId = (typeof resourceId === 'number'
      && Number.isSafeInteger(resourceId) && resourceId > 0)
    || (typeof resourceId === 'string'
      && /^[A-Za-z0-9_-]{1,64}$/.test(resourceId));
  if (!label || (requiresResource && !validResourceId)
    || (!requiresResource && resourceId !== undefined)) return null;
  return createActivityRecord(
    req,
    202,
    timestamp,
    validResourceId ? `${label} (#${resourceId})` : label,
  );
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
  if (!record) return Promise.resolve();
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
    const record = createActivityRecord(req, res.statusCode);
    if (record) void writeActivityRecord(record);
  });
  next();
}

export default { activityLogMiddleware, createActivityRecord, writeActivityRecord };
