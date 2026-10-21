import bcrypt from 'bcryptjs';
import mysql from 'mysql2';
import mysqlPromise from 'mysql2/promise';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = join(ROOT, '.env');
const MIGRATION_FILE = join(ROOT, 'scripts', 'migrations', '20261021-academic-site-access.sql');
const DB_USER = 'p100_site_access';
const DATABASE = 'parque100_acceso';

function loadLocalEnv() {
  try {
    process.loadEnvFile(ENV_FILE);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function adminConnectionOptions() {
  if (!process.env.DB_USER) {
    throw new Error('Falta DB_USER en el .env local para aprovisionar la base privada.');
  }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  };
}

function saveAccessCredentials(password) {
  const original = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
  const values = {
    SITE_ACCESS_DB_USER: DB_USER,
    SITE_ACCESS_DB_PASSWORD: password,
  };
  const lines = original.split(/\r?\n/);
  for (const [key, value] of Object.entries(values)) {
    const expression = new RegExp(`^\\s*${key}\\s*=`);
    const index = lines.findIndex((line) => expression.test(line));
    if (index >= 0) lines[index] = `${key}=${value}`;
    else lines.push(`${key}=${value}`);
  }
  const output = `${lines.filter((line, index) => index < lines.length - 1 || line !== '').join('\n').replace(/\n*$/, '')}\n`;
  const temporary = `${ENV_FILE}.site-access-tmp`;
  writeFileSync(temporary, output, { mode: 0o600 });
  renameSync(temporary, ENV_FILE);
}

async function provision() {
  loadLocalEnv();
  const admin = await mysqlPromise.createConnection(adminConnectionOptions());
  const servicePassword = randomBytes(36).toString('base64url');
  try {
    await admin.query(readFileSync(MIGRATION_FILE, 'utf8'));
    const escapedPassword = mysql.escape(servicePassword);
    await admin.query(
      `CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY ${escapedPassword}`,
    );
    await admin.query(
      `ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY ${escapedPassword}`,
    );
    await admin.query(
      `GRANT SELECT, INSERT, UPDATE ON ${DATABASE}.* TO '${DB_USER}'@'localhost'`,
    );
    saveAccessCredentials(servicePassword);
    console.log(`Base privada '${DATABASE}' y usuario MySQL de mínimo privilegio configurados.`);
    console.log('Las credenciales del servicio se guardaron solo en el .env local ignorado por Git.');
    console.log('No se crearon cuentas de acceso. Añade cada una en una terminal local segura.');
  } finally {
    await admin.end();
  }
}

async function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Ejecuta este comando desde una terminal interactiva local; no pases contraseñas como argumentos.');
  }
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      process.stdin.removeListener('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\u0003') return finish(new Error('Operación cancelada.'));
        if (char === '\r' || char === '\n') return finish();
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        if (char >= ' ' && char !== '\u007f') {
          value += char;
          process.stdout.write('*');
        }
      }
    };
    process.stdin.on('data', onData);
  });
}

async function withAccessPool(callback) {
  loadLocalEnv();
  if (!process.env.SITE_ACCESS_DB_USER || !process.env.SITE_ACCESS_DB_PASSWORD) {
    throw new Error('Primero ejecuta `npm run access:provision`.');
  }
  const pool = mysqlPromise.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.SITE_ACCESS_DB_USER,
    password: process.env.SITE_ACCESS_DB_PASSWORD,
    database: DATABASE,
    waitForConnections: true,
    connectionLimit: 1,
  });
  try {
    return await callback(pool);
  } finally {
    await pool.end();
  }
}

async function addUser(username) {
  if (!/^[0-9]{1,32}$/.test(username || '')) {
    throw new Error('El usuario debe ser el identificador numérico asignado por el equipo.');
  }
  const password = await readHidden('Nueva contraseña (mínimo 12 caracteres): ');
  if (password.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.');
  const confirmation = await readHidden('Confirma la contraseña: ');
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');

  const hash = await bcrypt.hash(password, 12);
  await withAccessPool(async (pool) => {
    await pool.query(
      'INSERT INTO usuarios_acceso (Usuario, Hash_Contrasena) VALUES (?, ?)',
      [username, hash],
    );
  });
  console.log(`Cuenta de acceso ${username} creada. La contraseña no se guarda en texto plano.`);
}

async function disableUser(username) {
  if (!/^[0-9]{1,32}$/.test(username || '')) {
    throw new Error('Indica el identificador numérico de la cuenta que deseas desactivar.');
  }
  const changed = await withAccessPool(async (pool) => {
    const [result] = await pool.query(
      'UPDATE usuarios_acceso SET Activo = 0 WHERE Usuario = ? AND Activo = 1',
      [username],
    );
    return result.affectedRows === 1;
  });
  if (!changed) throw new Error('La cuenta no existe o ya estaba desactivada.');
  console.log(`Cuenta de acceso ${username} desactivada.`);
}

async function listUsers() {
  const users = await withAccessPool(async (pool) => {
    const [rows] = await pool.query(
      'SELECT Usuario, Activo, Ultimo_Acceso FROM usuarios_acceso ORDER BY Usuario',
    );
    return rows;
  });
  if (users.length === 0) {
    console.log('No hay cuentas de acceso creadas.');
    return;
  }
  for (const user of users) {
    console.log(`${user.Usuario}\t${user.Activo ? 'activa' : 'desactivada'}\t${user.Ultimo_Acceso || 'sin acceso'}`);
  }
}

const [action, username] = process.argv.slice(2);
try {
  if (action === 'provision') await provision();
  else if (action === 'add') await addUser(username);
  else if (action === 'disable') await disableUser(username);
  else if (action === 'list') await listUsers();
  else {
    console.error('Uso: node scripts/site-access-admin.mjs <provision|add|disable|list> [usuario]');
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'La operación de acceso falló.');
  process.exitCode = 1;
}
