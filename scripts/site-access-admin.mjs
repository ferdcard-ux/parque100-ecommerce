import bcrypt from 'bcryptjs';
import mysql from 'mysql2';
import mysqlPromise from 'mysql2/promise';
import { randomBytes } from 'node:crypto';
import {
  existsSync, readFileSync, renameSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createSessionRecord,
  writeActivityRecord,
} from '../server/utils/activity-log.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = join(ROOT, '.env');
const MIGRATION_FILE = join(ROOT, 'scripts', 'migrations', '20261021-academic-site-access.sql');
const DB_USER = 'p100_site_access';
const DATABASE = 'parque100_acceso';
const SESSION_COLUMNS = {
  Sesion_ID: 'char(36) CHARACTER SET ascii COLLATE ascii_bin NULL DEFAULT NULL',
  Sesion_Iniciada_En: 'timestamp(3) NULL DEFAULT NULL',
  Ultima_Actividad: 'timestamp(3) NULL DEFAULT NULL',
  Sesion_Revocada_En: 'timestamp(3) NULL DEFAULT NULL',
  Intentos_Fallidos: 'int unsigned NOT NULL DEFAULT 0',
  Ultimo_Intento_Fallido: 'timestamp(3) NULL DEFAULT NULL',
  Bloqueado_Hasta: 'timestamp(3) NULL DEFAULT NULL',
};

function loadLocalEnv() {
  try {
    process.loadEnvFile(ENV_FILE);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function adminConnectionOptions({ multipleStatements = true } = {}) {
  if (!process.env.DB_USER) {
    throw new Error('Falta DB_USER en el .env local para aprovisionar la base privada.');
  }
  const host = process.env.DB_HOST || '127.0.0.1';
  if (!['localhost', '127.0.0.1', '::1'].includes(host.toLowerCase())) {
    throw new Error('La administración del acceso solo admite una base de datos local.');
  }
  return {
    host,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    multipleStatements,
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

function validateUsername(username) {
  return typeof username === 'string' && /^[0-9]{1,32}$/.test(username);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 12
    && Buffer.byteLength(password, 'utf8') <= 72;
}

/** Agrega las columnas de sesión a instalaciones previas (idempotente). */
async function ensureSessionColumns(connection) {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios_acceso'`,
    [DATABASE],
  );
  const existing = new Set(rows.map((row) => row.COLUMN_NAME));
  for (const [name, definition] of Object.entries(SESSION_COLUMNS)) {
    if (!existing.has(name)) {
      await connection.query(
        `ALTER TABLE ${DATABASE}.usuarios_acceso ADD COLUMN ${name} ${definition}`,
      );
    }
  }
}

/** Vida del token de acceso, para distinguir sesión vigente de expirada. */
function jwtLifetimeMs() {
  const value = String(process.env.JWT_EXPIRES_IN || '8h').trim();
  const match = /^(\d+)\s*([smhd])$/.exec(value);
  if (!match) return 8 * 60 * 60 * 1000;
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Number(match[1]) * units[match[2]];
}

function timeLabel(value) {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);
  } catch {
    return value.toISOString();
  }
}

/** Estado de login que verá el panel (Conectado, Inactivo, Bloqueado...). */
function sessionStatus(row, now = new Date()) {
  const started = row.Sesion_Iniciada_En
    ? new Date(row.Sesion_Iniciada_En) : null;
  const revoked = row.Sesion_Revocada_En
    ? new Date(row.Sesion_Revocada_En) : null;
  const expired = Boolean(started
    && now.getTime() - started.getTime() >= jwtLifetimeMs());
  const hasSession = Boolean(row.Activo && started
    && !(revoked && revoked >= started) && !expired);
  if (!row.Activo) {
    return { state: 'disabled', label: 'Deshabilitado', hasSession: false };
  }
  const blocked = row.Bloqueado_Hasta ? new Date(row.Bloqueado_Hasta) : null;
  if (blocked && blocked > now) {
    return {
      state: 'blocked',
      label: `Bloqueado hasta ${timeLabel(blocked)}`,
      blockedUntil: blocked.toISOString(),
      hasSession,
    };
  }
  if (!started) {
    return { state: 'offline', label: 'Sin sesión', hasSession: false };
  }
  if (revoked && revoked >= started) {
    return { state: 'offline', label: 'Sin sesión', hasSession: false };
  }
  if (expired) {
    return { state: 'offline', label: 'Sesión expirada', hasSession: false };
  }
  const activity = row.Ultima_Actividad
    ? new Date(row.Ultima_Actividad) : started;
  const idle = now.getTime() - activity.getTime();
  if (idle <= 5 * 60 * 1000) {
    return { state: 'online', label: 'Conectado', hasSession: true };
  }
  return { state: 'idle', label: 'Inactivo', hasSession: true };
}

/** Deja constancia de la revocación en el monitor ACTIVIDAD WEB. */
async function appendSessionEvent(username, action, event, outcome, detail) {
  try {
    const record = createSessionRecord({
      username, action, event, outcome, detail,
    });
    if (record) await writeActivityRecord(record);
  } catch {
    // La auditoría es complementaria: no impide revocar la sesión.
  }
}

async function panelCommand() {
  let connection;
  try {
    loadLocalEnv();
    let input = '';
    for await (const chunk of process.stdin) {
      input += chunk;
      if (input.length > 65536) throw new Error('La solicitud supera el tamaño permitido.');
    }
    const request = JSON.parse(input);
    if (!request || typeof request !== 'object' || Array.isArray(request)) {
      throw new Error('Solicitud de administración no válida.');
    }

    connection = await mysqlPromise.createConnection(
      adminConnectionOptions({ multipleStatements: false }),
    );
    let result;
    if (request.action === 'provision') {
      result = await prepareAccessDatabase();
    } else {
      await ensureSessionColumns(connection);
    }
    if (request.action === 'provision') {
      // prepareAccessDatabase ya aplicó la migración.
    } else if (request.action === 'list') {
      const [rows] = await connection.query(
        `SELECT ID_Acceso, Usuario, Activo, Ultimo_Acceso,
                Sesion_Iniciada_En, Ultima_Actividad, Sesion_Revocada_En,
                Bloqueado_Hasta, Intentos_Fallidos, Ultimo_Intento_Fallido
         FROM ${DATABASE}.usuarios_acceso ORDER BY Usuario`,
      );
      result = {
        users: rows.map((row) => ({ ...row, session: sessionStatus(row) })),
      };
    } else if (request.action === 'add') {
      if (!validateUsername(request.username)) {
        throw new Error('El usuario debe ser un identificador numérico de hasta 32 dígitos.');
      }
      if (!validatePassword(request.password)) {
        throw new Error('La contraseña debe tener al menos 12 caracteres y máximo 72 bytes UTF-8.');
      }
      const hash = await bcrypt.hash(request.password, 12);
      const [inserted] = await connection.execute(
        `INSERT INTO ${DATABASE}.usuarios_acceso (Usuario, Hash_Contrasena)
         VALUES (?, ?)`,
        [request.username, hash],
      );
      result = { id: inserted.insertId, username: request.username };
    } else if (request.action === 'update') {
      if (!Number.isSafeInteger(request.id) || request.id < 1) {
        throw new Error('Selecciona una cuenta válida para editar.');
      }
      if (!validateUsername(request.username)) {
        throw new Error('El usuario debe ser un identificador numérico de hasta 32 dígitos.');
      }
      if (request.password !== undefined && !validatePassword(request.password)) {
        throw new Error('La nueva contraseña debe tener al menos 12 caracteres y máximo 72 bytes UTF-8.');
      }
      if (request.active !== undefined && typeof request.active !== 'boolean') {
        throw new Error('El estado de la cuenta no es válido.');
      }
      const fields = ['Usuario = ?'];
      const values = [request.username];
      if (request.password !== undefined) {
        fields.push('Hash_Contrasena = ?');
        values.push(await bcrypt.hash(request.password, 12));
      }
      if (request.active !== undefined) {
        fields.push('Activo = ?');
        values.push(request.active ? 1 : 0);
      }
      // Cambiar la contraseña o desactivar la cuenta cierra la sesión vigente.
      if (request.password !== undefined || request.active === false) {
        fields.push('Sesion_ID = NULL', 'Sesion_Iniciada_En = NULL',
          'Ultima_Actividad = NULL',
          'Sesion_Revocada_En = CURRENT_TIMESTAMP(3)');
      }
      values.push(request.id);
      const [updated] = await connection.execute(
        `UPDATE ${DATABASE}.usuarios_acceso SET ${fields.join(', ')}
         WHERE ID_Acceso = ?`,
        values,
      );
      if (updated.affectedRows !== 1) {
        const [rows] = await connection.execute(
          `SELECT 1 FROM ${DATABASE}.usuarios_acceso WHERE ID_Acceso = ? LIMIT 1`,
          [request.id],
        );
        if (rows.length !== 1) throw new Error('La cuenta ya no existe.');
      }
      result = { id: request.id, username: request.username };
    } else if (request.action === 'delete') {
      if (!Number.isSafeInteger(request.id) || request.id < 1) {
        throw new Error('Selecciona una cuenta válida para eliminar.');
      }
      const [deleted] = await connection.execute(
        `DELETE FROM ${DATABASE}.usuarios_acceso WHERE ID_Acceso = ?`,
        [request.id],
      );
      if (deleted.affectedRows !== 1) throw new Error('La cuenta ya no existe.');
      result = { id: request.id };
    } else if (request.action === 'revoke') {
      if (!Number.isSafeInteger(request.id) || request.id < 1) {
        throw new Error('Selecciona una cuenta válida para revocar su sesión.');
      }
      const [rows] = await connection.execute(
        `SELECT Usuario FROM ${DATABASE}.usuarios_acceso
         WHERE ID_Acceso = ? LIMIT 1`,
        [request.id],
      );
      if (rows.length !== 1) throw new Error('La cuenta ya no existe.');
      await connection.execute(
        `UPDATE ${DATABASE}.usuarios_acceso
         SET Sesion_ID = NULL, Sesion_Iniciada_En = NULL,
             Ultima_Actividad = NULL,
             Sesion_Revocada_En = CURRENT_TIMESTAMP(3)
         WHERE ID_Acceso = ?`,
        [request.id],
      );
      await appendSessionEvent(rows[0].Usuario,
        'Se revocó la sesión desde el panel', 'login.revoked', 'OK',
        'El usuario deberá autenticarse de nuevo');
      result = {
        id: request.id,
        username: rows[0].Usuario,
        revoked: true,
        session: { state: 'offline', label: 'Sin sesión' },
      };
    } else {
      throw new Error('Operación de administración no permitida.');
    }

    process.stdout.write(`${JSON.stringify({ ok: true, ...result })}\n`);
  } catch (error) {
    const message = error?.code === 'ER_DUP_ENTRY'
      ? 'Ya existe una cuenta con ese identificador.'
      : error instanceof Error ? error.message : 'No se pudo administrar el acceso.';
    process.stderr.write(`${JSON.stringify({ ok: false, error: message })}\n`);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

async function provision({ quiet = false } = {}) {
  loadLocalEnv();
  const admin = await mysqlPromise.createConnection(adminConnectionOptions());
  const servicePassword = randomBytes(36).toString('base64url');
  try {
    await admin.query(readFileSync(MIGRATION_FILE, 'utf8'));
    await ensureSessionColumns(admin);
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
    if (!quiet) {
      console.log(`Base privada '${DATABASE}' y usuario MySQL de mínimo privilegio configurados.`);
      console.log('Las credenciales del servicio se guardaron solo en el .env local ignorado por Git.');
      console.log('No se crearon cuentas de acceso. Añade cada una en una terminal local segura.');
    }
  } finally {
    await admin.end();
  }
}

async function ensureSchemaWithAdmin() {
  loadLocalEnv();
  const admin = await mysqlPromise.createConnection(
    adminConnectionOptions({ multipleStatements: false }),
  );
  try {
    await ensureSessionColumns(admin);
  } finally {
    await admin.end();
  }
}

async function prepareAccessDatabase() {
  loadLocalEnv();
  if (process.env.SITE_ACCESS_DB_USER && process.env.SITE_ACCESS_DB_PASSWORD) {
    try {
      await withAccessPool(async (pool) => {
        await pool.query('SELECT 1 FROM usuarios_acceso LIMIT 1');
      });
    } catch {
      throw new Error('Ya hay credenciales privadas configuradas, pero no funcionan; no se modificó la base.');
    }
    await ensureSchemaWithAdmin();
    return { alreadyConfigured: true };
  }
  await provision({ quiet: true });
  return { alreadyConfigured: false };
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
  if (!validatePassword(password)) {
    throw new Error('La contraseña debe tener al menos 12 caracteres y máximo 72 bytes UTF-8.');
  }
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
  await ensureSchemaWithAdmin();
  const users = await withAccessPool(async (pool) => {
    const [rows] = await pool.query(
      `SELECT Usuario, Activo, Ultimo_Acceso, Sesion_Iniciada_En,
              Ultima_Actividad, Sesion_Revocada_En, Bloqueado_Hasta,
              Intentos_Fallidos
       FROM usuarios_acceso ORDER BY Usuario`,
    );
    return rows;
  });
  if (users.length === 0) {
    console.log('No hay cuentas de acceso creadas.');
    return;
  }
  for (const user of users) {
    const session = sessionStatus(user);
    console.log(`${user.Usuario}\t${user.Activo ? 'activa' : 'desactivada'}\t${session.label}\t${user.Ultimo_Acceso || 'sin acceso'}`);
  }
}

const [action, username] = process.argv.slice(2);
if (action === 'panel') {
  await panelCommand();
} else {
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
}
