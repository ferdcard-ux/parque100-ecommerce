/**
 * @fileoverview Capa de configuracion de base de datos.
 * Crea y exporta el pool de conexiones MySQL compartido por todos
 * los modelos del backend. Un pool reutiliza conexiones abiertas,
 * evitando el costo de abrir/cerrar una conexion por cada consulta.
 */
import mysql from 'mysql2/promise';

/**
 * Pool de conexiones a la base de datos `parque100`.
 *
 * @type {import('mysql2/promise').Pool}
 * @constant
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'parque100',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
