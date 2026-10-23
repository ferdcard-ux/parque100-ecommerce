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
 *                                   reemplazando las tablas del proyecto.
 *
 * Requisitos:
 *   - MySQL (o MariaDB) levantado y accesible localmente.
 *   - Cliente MySQL: se busca en este orden:
 *       1) Variable `MYSQL_BIN` con el directorio `bin` del cliente.
 *       2) Rutas por defecto de la plataforma (Windows 8.4, /usr/bin, etc.).
 *       3) `mysql` / `mysqldump` (o `mariadb` / `mariadb-dump`) en el PATH.
 *   - Autenticacion: `DB_ADMIN_USER` / `DB_ADMIN_PASSWORD` (cuenta con permisos
 *     para crear tablas), o `DB_USER` + `MYSQL_PWD`; por defecto `root`.
 *   - Base de datos: `parque100` (o `DB_NAME`).
 *
 * Seguridad (el repositorio es publico y este equipo tambien es el servidor):
 *   - `dump` reemplaza TODOS los hashes de contrasena por los de claves de
 *     desarrollo fijas (ver DEV_PASSWORD_HASHES). Las contrasenas reales del
 *     servidor nunca llegan al repositorio.
 *   - `restore` se niega a ejecutarse en el equipo servidor (existe
 *     C:\ProgramData\Parque100) salvo con `--confirmar-servidor`, porque
 *     reemplazaria la BD del sitio publico.
 */
import './admin-db-env.mjs';
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DUMP_FILE = join(ROOT, '.BD', 'parque100.sql');
const DB = process.env.DB_NAME || 'parque100';
const DB_USER = process.env.DB_USER || 'root';

/** Marca del equipo que publica el sitio (instalacion endurecida del servidor). */
const SERVER_MARKER = 'C:\\ProgramData\\Parque100';

/**
 * Hashes bcrypt fijos de las claves de desarrollo que se publican en el dump.
 * Las claves son conocidas por el equipo (README) y solo valen en copias
 * locales; el servidor publico usa otras. Fijos para no generar cambios en
 * cada dump (bcrypt usa sal aleatoria).
 */
const DEV_PASSWORD_HASHES = {
  'usuario@ejemplo.com': '$2b$10$1/r/9UWcmGrAnOePe2FNjOhcUQ8aCDfuP/chE1a7ugvkVhU9y3k5K', // 12345678
  'admin@parque100.com': '$2b$10$SaRccAUNaPNeeTYVor1IveMfe2VXKTj1c6Bddf9dkdmG8LUZGCu9i', // admin123
  'domiciliario@parque100.com': '$2b$10$tOn2xS6.w2HjPb8NRJ820.Mck9PkKbpKEUlcrSBsuyg5R25Hw2PVa', // domiciliario123
};
/** Clave de desarrollo para cualquier otra cuenta: parque100-dev */
const DEV_DEFAULT_HASH = '$2b$10$Jfe3DnBzEb.d3yXdlko4AOPfMohadgJSbBUq0y9MKCuPyIWREf.p2';
const BCRYPT_HASH = /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/g;

/**
 * Sustituye los hashes reales del dump por los de desarrollo. En la tabla
 * `usuario` el correo precede a la contrasena (`'correo','$2b$...'`); el resto
 * de hashes que aparezcan se reemplaza por la clave por defecto.
 *
 * @param {string} sql - Dump generado por mysqldump.
 * @returns {string} Dump sin contrasenas reales.
 */
export function sanitizeDump(sql) {
  const allowed = new Set([...Object.values(DEV_PASSWORD_HASHES), DEV_DEFAULT_HASH]);
  const byEmail = sql.replace(
    /'([^'\\]{1,50})','(\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53})'/g,
    (_match, email, _hash) => `'${email}','${DEV_PASSWORD_HASHES[email.toLowerCase()] || DEV_DEFAULT_HASH}'`,
  );
  const clean = byEmail.replace(BCRYPT_HASH, (hash) => (allowed.has(hash) ? hash : DEV_DEFAULT_HASH));
  const leftover = (clean.match(BCRYPT_HASH) || []).filter((hash) => !allowed.has(hash));
  if (leftover.length > 0) throw new Error('El dump conserva hashes reales; no se escribe.');
  return clean;
}

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
  const sql = sanitizeDump(result.stdout.toString('utf8'));
  writeFileSync(DUMP_FILE, sql, 'utf8');
  const sizeKb = (Buffer.byteLength(sql) / 1024).toFixed(1);
  console.log(`Dump generado: ${DUMP_FILE} (${sizeKb} KB)`);
  console.log('Contrasenas reemplazadas por las claves de desarrollo (ver README).');
  console.log('Commitea el archivo para compartir los datos con el equipo.');
  console.log('Revisa antes el diff: incluye las cuentas creadas en el sitio publico (/register).');
}

/** Importa .BD/parque100.sql en la BD local reemplazando las tablas. */
function restore() {
  if (!existsSync(DUMP_FILE)) {
    console.error(`No existe el dump ${DUMP_FILE}. Ejecuta primero: node scripts/db.mjs dump`);
    process.exit(1);
  }
  if (existsSync(SERVER_MARKER) && !process.argv.includes('--confirmar-servidor')) {
    console.error(`Este equipo publica el sitio (${SERVER_MARKER}): restaurar reemplazaria la BD
del servidor publico y sus contrasenas por las de desarrollo. Si de verdad es lo que
quieres, ejecuta: npm run db:restore -- --confirmar-servidor`);
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
else if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.error('Uso: node scripts/db.mjs <dump|restore> [--confirmar-servidor]');
  process.exit(1);
}