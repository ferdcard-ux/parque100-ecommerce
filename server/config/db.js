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
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'parque100',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
