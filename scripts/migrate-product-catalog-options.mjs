import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import '../server/config/load-env.js';
import './admin-db-env.mjs';

if ((process.env.DB_NAME || 'parque100').toLowerCase() === 'parque100_acceso') {
  throw new Error('La migración de catálogos no se debe ejecutar en la base privada parque100_acceso.');
}

const { default: pool } = await import('../server/config/db.js');
const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  'migrations',
  '20261021-product-catalog-options.sql',
);

try {
  const migration = await readFile(migrationPath, 'utf8');
  await pool.query(migration);
  await pool.query('ALTER TABLE productos MODIFY Contenido_Unidad varchar(30) DEFAULT NULL');
  await pool.query(
    "INSERT IGNORE INTO unidades_medida (Nombre_Unidad) VALUES ('g'), ('kg'), ('ml'), ('un')",
  );
  await pool.query(`
    INSERT IGNORE INTO unidades_medida (Nombre_Unidad)
    SELECT DISTINCT TRIM(Contenido_Unidad)
    FROM productos
    WHERE Contenido_Unidad IS NOT NULL AND TRIM(Contenido_Unidad) <> ''
  `);
  console.log('Catálogos de categorías/unidades listos; unidades existentes preservadas.');
} catch (error) {
  console.error('No fue posible aplicar la migración de catálogos:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
