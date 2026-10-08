/**
 * @fileoverview Sincronizacion de la base de datos local con el repositorio.
 *
 * Todos los datos del proyecto son ficticios (creados para pruebas), por lo
 * que el equipo comparte el estado completo de la BD via `.BD/parque100.sql`.
 *
 * Uso:
 *   node scripts/db.mjs dump     -> Exporta la BD local `parque100`
 *                                   (esquema + datos) a .BD/parque100.sql.
 *   node scripts/db.mjs restore  -> Importa .BD/parque100.sql en la BD local,
 *                                   reemplazando las 5 tablas del proyecto.
 *
 * Requisitos:
 *   - MySQL levantado y accesible como `root` sin contrasena (o con
 *     `MYSQL_PWD` definida).
 *   - Localizacion del cliente MySQL (por defecto Windows):
 *       1) Variable de entorno `MYSQL_BIN` apuntando al directorio `bin`.
 *       2) C:\Program Files\MySQL\MySQL Server 8.4\bin (instalacion comun).
 *       3) `mysql` / `mysqldump` disponibles en el PATH.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DUMP_FILE = join(ROOT, '.BD', 'parque100.sql');
const DB = process.env.DB_NAME || 'parque100';
const DEFAULT_BIN = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin';

/** Resuelve el ejecutable pedido o lanza un error claro. */
function resolveClient(name) {
  const bin = process.env.MYSQL_BIN || DEFAULT_BIN;
  const candidates = [join(bin, `${name}.exe`), join(bin, name)];
  for (const c of candidates) {
    if (existsSync(c)) return { cmd: c, shell: false };
  }
  // Sin ruta absoluta conocida: se delega al PATH del sistema.
  return { cmd: name, shell: true };
}

/** Ejecuta un comando; retorna el resultado con stdio controlado. */
function run(cmd, args, options = {}) {
  return spawnSync(cmd, args, {
    shell: options.shell ?? false,
    encoding: options.encoding ?? 'buffer',
    maxBuffer: options.maxBuffer ?? 64 * 1024 * 1024,
    stdio: options.stdio ?? ['inherit', 'pipe', 'inherit'],
    ...(options.input !== undefined ? { input: options.input } : {}),
  });
}

/** Exporta el esquema y los datos de la BD a .BD/parque100.sql (UTF-8). */
function dump() {
  const { cmd, shell } = resolveClient('mysqldump');
  const result = run(cmd, [
    '-u', 'root',
    '--databases', DB,
    '--single-transaction',
    '--routines',
    '--triggers',
    '--add-drop-table',
    '--default-character-set=utf8mb4',
  ], { shell, stdio: ['ignore', 'pipe', 'inherit'] });

  if (result.status !== 0) {
    console.error('Error: no se pudo exportar la BD. ¿Está MySQL levantado?');
    process.exit(result.status ?? 1);
  }
  writeFileSync(DUMP_FILE, result.stdout);
  const sizeKb = (result.stdout.length / 1024).toFixed(1);
  console.log(`Dump generado: ${DUMP_FILE} (${sizeKb} KB)`);
  console.log('Commitea el archivo para compartir los datos con el equipo.');
}

/** Importa .BD/parque100.sql en la BD local reemplazando las tablas. */
function restore() {
  if (!existsSync(DUMP_FILE)) {
    console.error(`No existe el dump ${DUMP_FILE}. Ejecuta primero: node scripts/db.mjs dump`);
    process.exit(1);
  }
  const { cmd, shell } = resolveClient('mysql');
  const sql = readFileSync(DUMP_FILE);
  const result = run(cmd, ['-u', 'root', '--default-character-set=utf8mb4'], {
    shell,
    stdio: ['ignore', 'inherit', 'inherit'],
    input: sql,
  });
  if (result.status !== 0) {
    console.error('Error: no se pudo restaurar la BD. ¿Está MySQL levantado?');
    process.exit(result.status ?? 1);
  }
  console.log(`BD '${DB}' restaurada desde ${DUMP_FILE}`);
}

/** Punto de entrada: node scripts/db.mjs <dump|restore>. */
const action = process.argv[2];
if (action === 'dump') dump();
else if (action === 'restore') restore();
else {
  console.error('Uso: node scripts/db.mjs <dump|restore>');
  process.exit(1);
}