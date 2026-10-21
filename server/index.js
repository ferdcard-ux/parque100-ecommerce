/**
 * @fileoverview Punto de entrada del servidor backend (Express).
 * Configura middlewares globales (CORS con lista blanca y limite de
 * intentos de auth), registra los routers de cada modulo bajo el
 * prefijo `/api` y levanta el servidor en el puerto indicado.
 *
 * Estructura MVC del backend:
 *   routes/      -> definicion de endpoints (capa Router)
 *   controllers/ -> logica de negocio (capa Controller)
 *   models/      -> acceso a datos SQL (capa Model)
 *   middleware/  -> sesion y autorizacion (JWT)
 *   config/      -> configuracion compartida (pool de conexiones)
 */
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import authRouter from './routes/auth.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';
import usersRouter from './routes/users.js';
import businessRouter from './routes/business.js';
import ratingsRouter from './routes/ratings.js';
import { assertJwtSecret, requireAuth, requireSiteSession } from './middleware/auth.js';

/** Carga variables de un archivo `.env` si existe (Node >= 20.6). */
try {
  process.loadEnvFile();
} catch {
  /* JWT_SECRET debe estar disponible en el entorno si no hay archivo .env. */
}

assertJwtSecret();

/**
 * Puerto de escucha del backend.
 * @constant {number}
 */
const PORT = Number(process.env.PORT) || 3001;

/**
 * Origenes permitidos para CORS (lista blanca).
 * @constant {string[]}
 */
const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGIN ||
  'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

/** Habilita CORS solo para los origenes conocidos del frontend. */
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('Origen no permitido por CORS'));
    },
  }),
);

/** Permite interpretar cuerpos JSON (limite ampliado para imagenes en dataURL). */
app.use(express.json({ limit: '10mb' }));

/**
 * Limita los intentos contra los endpoints de autenticacion para
 * mitigar ataques de fuerza bruta.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

/**
 * The only unauthenticated API endpoints are sign-in, disabled public
 * registration, proxy access validation and disclaimer/login lifecycle.
 * Everything else requires an allowlisted account and current-session consent.
 */
app.use('/api', async (req, res, next) => {
  const path = req.originalUrl.split('?')[0];
  const publicEndpoints = new Set([
    'POST /api/auth/login',
    'POST /api/auth/register',
    'GET /api/auth/proxy-access',
    'POST /api/auth/logout',
    'GET /api/auth/disclaimer/status',
    'POST /api/auth/disclaimer/accept',
  ]);
  if (publicEndpoints.has(`${req.method} ${path}`)) return next();

  try {
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (err) => (err ? reject(err) : resolve()));
    });
    await new Promise((resolve, reject) => {
      requireSiteSession(req, res, (err) => (err ? reject(err) : resolve()));
    });
    if (!res.headersSent) return next();
    return undefined;
  } catch (err) {
    return next(err);
  }
});

/** Registro de routers por modulo. */
app.use('/api/auth', authLimiter);
app.use('/api', productsRouter);
app.use('/api', categoriesRouter);
app.use('/api', authRouter);
app.use('/api', ordersRouter);
app.use('/api', paymentsRouter);
app.use('/api', usersRouter);
app.use('/api', businessRouter);
app.use('/api', ratingsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    mensaje: `El método ${req.method} no está disponible para ${req.originalUrl}`,
  });
});

/** Manejador de errores centralizado: nunca expone el detalle interno. */
app.use((err, _req, res, _next) => {
  console.error('[error]', err?.message || err);
  res.status(err?.statusCode || 500).json({ error: 'Error interno del servidor' });
});

/** Levanta el servidor HTTP e informa la URL base. */
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Servidor backend en http://localhost:${PORT}`);
});
