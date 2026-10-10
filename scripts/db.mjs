/**
 * @fileoverview Sincronizacion de la base de datos local con el repositorio.
 *
 * Todos los datos del proyecto son ficticios (creados para pruebas), por lo
 * que el equipo comparte el estado completo de la BD via `.BD/parque100.sql`.
 *
 * Uso (comun en Windows, Linux y macOS):
 *   node scripts/db.mjs dump     -> Exporta la BD local `parque100`
 *                                   (esquema + datos) a .BD/parque100.sql.
 *   node scripts/db.mjs restore  -> Importa .BD/parque100.sql en la BD local,
 *                                   reemplazando las 5 tablas del proyecto.
 *
 * Requisitos:
 *   - MySQL (o MariaDB) levantado y accesible localmente.
 *   - Cliente MySQL: se busca en este orden:
 *       1) Variable `MYSQL_BIN` con el directorio `bin` del cliente.
 *       2) Rutas por defecto de la plataforma (Windows 8.4, /usr/bin, etc.).
 *       3) `mysql` / `mysqldump` (o `mariadb` / `mariadb-dump`) en el PATH.
 *   - Autenticacion: `root` sin contrasena, o `MYSQL_PWD` definida.
 *     Usuario alternativo: `DB_USER`.
 *   - Base de datos: `parque100` (o `DB_NAME`).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DUMP_FILE = join(ROOT, '.BD', 'parque100.sql');
const DB = process.env.DB_NAME || 'parque100';
const DB_USER = process.env.DB_USER || 'root';

/** Directorios `bin` comunes por plataforma, cuando no se define MYSQL_BIN. */
const DEFAULT_BIN_DIRS = {
  win32: ['C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin'],
  linux: ['/usr/bin', '/usr/local/bin', '/usr/local/mysql/bin'],
  darwin: ['/usr/local/mysql/bin', '/opt/homebrew/bin'],
};

/** Sufijo de ejecutable segun plataforma. */
const EXE_SUFFIX = process.platform === 'win32' ? '.exe' : '';

/**
 * Resuelve el ejecutable de un cliente (`mysql` o `mysqldump`), probando
 * tambien los binarios equivalentes de MariaDB.
 *
 * @param {'mysql'|'mysqldump'} kind - Cliente a resolver.
 * @returns {{cmd: string, shell: boolean}} Comando y si requiere shell (PATH).
 */
function resolveClient(kind) {
  const names = kind === 'mysqldump' ? ['mysqldump', 'mariadb-dump'] : ['mysql', 'mariadb'];
  const bin = (process.env.MYSQL_BIN || '').trim();
  const dirs = bin ? [bin] : DEFAULT_BIN_DIRS[process.platform] || [];
  for (const dir of dirs) {
    for (const name of names) {
      const candidates = EXE_SUFFIX ? [join(dir, `${name}${EXE_SUFFIX}`), join(dir, name)] : [join(dir, name)];
      for (const c of candidates) {
        if (existsSync(c)) return { cmd: c, shell: false };
      }
    }
  }
  // Ruta no encontrada en directorios conocidos: se delega al PATH del sistema.
  return { cmd: names[0], shell: true };
}

/** Ejecuta un comando y retorna el resultado con stdio controlado. */
function run(cmd, args, options = {}) {
  const stdio = options.stdio ?? ['inherit', 'pipe', 'inherit'];
  // `input` debe entregarse por stdin: sin esto Node no crea el pipe y el
  // proceso hijo recibe un stdin vacio (restore silencioso sin efecto).
  if (options.input !== undefined) stdio[0] = 'pipe';
  return spawnSync(cmd, args, {
    shell: options.shell ?? false,
    encoding: options.encoding ?? 'buffer',
    maxBuffer: options.maxBuffer ?? 64 * 1024 * 1024,
    stdio,
    ...(options.input !== undefined ? { input: options.input } : {}),
  });
}

/** Mensaje de error comun cuando el cliente no corre. */
function clientError(action) {
  console.error(`Error: no se pudo ${action}. Revisa que MySQL/MariaDB este levantado y que
haya cliente disponible (MYSQL_BIN apuntando al directorio bin, o mysql/mysqldump en el PATH).`);
}

/** Exporta el esquema y los datos de la BD a .BD/parque100.sql (UTF-8). */
function dump() {
  const { cmd, shell } = resolveClient('mysqldump');
  const result = run(cmd, [
    '-u', DB_USER,
    '--databases', DB,
    '--single-transaction',
    '--routines',
    '--triggers',
    '--add-drop-table',
    '--default-character-set=utf8mb4',
  ], { shell, stdio: ['ignore', 'pipe', 'inherit'] });

  if (result.status !== 0) {
    clientError('exportar la BD');
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
  const result = run(cmd, ['-u', DB_USER, '--default-character-set=utf8mb4'], {
    shell,
    stdio: ['ignore', 'inherit', 'inherit'],
    input: sql,
  });
  if (result.status !== 0) {
    clientError('restaurar la BD');
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