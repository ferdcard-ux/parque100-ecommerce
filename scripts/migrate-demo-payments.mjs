import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import '../server/config/load-env.js';

if ((process.env.DB_NAME || 'parque100').toLowerCase() === 'parque100_acceso') {
  throw new Error('La migración DEMO no se debe ejecutar en la base privada parque100_acceso.');
}

const { default: pool } = await import('../server/config/db.js');

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  'migrations',
  '20261021-demo-payment-transactions.sql',
);

try {
  const migration = await readFile(migrationPath, 'utf8');
  await pool.query(migration);
  console.log('Tabla de transacciones DEMO creada o ya existente.');
} catch (error) {
  console.error('No fue posible aplicar la migracion de pagos DEMO:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
