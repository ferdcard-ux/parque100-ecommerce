/**
 * @fileoverview Punto de entrada del servidor backend (Express).
 * Configura middlewares globales, registra los routers de cada
 * modulo bajo el prefijo `/api` y levanta el servidor en el puerto 3001.
 *
 * Estructura MVC del backend:
 *   routes/      -> definicion de endpoints (capa Router)
 *   controllers/ -> logica de negocio (capa Controller)
 *   models/      -> acceso a datos SQL (capa Model)
 *   config/      -> configuracion compartida (pool de conexiones)
 */
import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import authRouter from './routes/auth.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';

/**
 * Puerto de escucha del backend.
 * @constant {number}
 */
const PORT = 3001;

const app = express();

/** Habilita CORS para permitir peticiones desde el frontend (Vite :5173). */
app.use(cors());

/** Permite interpretar cuerpos JSON en las peticiones. */
app.use(express.json());

/** Registro de routers por modulo. */
app.use('/api', productsRouter);
app.use('/api', categoriesRouter);
app.use('/api', authRouter);
app.use('/api', ordersRouter);
app.use('/api', paymentsRouter);

/** Levanta el servidor HTTP e informa la URL base. */
app.listen(PORT, () => {
  console.log(`Servidor backend en http://localhost:${PORT}`);
});
