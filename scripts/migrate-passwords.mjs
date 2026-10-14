/**
 * @fileoverview Migracion de contrasenas a bcrypt.
 *
 * 1. Ensancha `usuario.Contrasena` a varchar(255) (un hash bcrypt mide 60).
 * 2. Recorre los usuarios y reemplaza cualquier contrasena en texto plano
 *    por su hash bcrypt (los hashes existentes se dejan intactos).
 *
 * Uso: node scripts/migrate-passwords.mjs
 */
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const pool = await mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'parque100',
});

const isHash = (value) => typeof value === 'string' && /^\$2[aby]\$/.test(value);

const [cols] = await pool.query("SHOW COLUMNS FROM usuario LIKE 'Contrasena'");
if (cols.length > 0 && !String(cols[0].Type).startsWith('varchar(255)')) {
  await pool.query('ALTER TABLE usuario MODIFY Contrasena varchar(255) NOT NULL');
  console.log('ok - columna Contrasena ampliada a varchar(255)');
}

const [rows] = await pool.query('SELECT ID_Usuario, Correo, Contrasena FROM usuario ORDER BY ID_Usuario');
let migrated = 0;
for (const row of rows) {
  if (isHash(row.Contrasena)) continue;
  const hash = await bcrypt.hash(String(row.Contrasena), 10);
  await pool.query('UPDATE usuario SET Contrasena = ? WHERE ID_Usuario = ?', [hash, row.ID_Usuario]);
  migrated += 1;
  console.log(`ok - contrasena migrada: ${row.Correo}`);
}

console.log(`Listo. Usuarios revisados: ${rows.length}, migrados: ${migrated}.`);
await pool.end();
