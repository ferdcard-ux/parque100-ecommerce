import './admin-db-env.mjs';
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
const MULTI_SESSION_MIGRATION_FILE = join(
  ROOT, 'scripts', 'migrations', '20261023-multi-session.sql');
const DB_USER = 'p100_site_access';
const DATABASE = 'parque100_acceso';
const ACTIVE_SESSION_WINDOW_MS = 5 * 60 * 1000;
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
    throw new Error('Falta DB_ADMIN_USER (o DB_USER) para aprovisionar la base privada.');
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

/** Crea la tabla de sesiones y conserva la sesión activa anterior. */
async function ensureMultiSessionTable(connection) {
  const sql = readFileSync(MULTI_SESSION_MIGRATION_FILE, 'utf8');
  for (const part of sql.split(';')) {
    const statement = part
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim();
    if (statement) await connection.query(statement);
  }
}

async function ensureSessionSchema(connection) {
  await ensureSessionColumns(connection);
  await ensureMultiSessionTable(connection);
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

function dateValue(value) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isoValue(value) {
  const parsed = dateValue(value);
  return parsed ? parsed.toISOString() : null;
}

function platformLabel(userAgent) {
  const ua = String(userAgent || '');
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return '';
}

/** Etiqueta corta y legible del dispositivo para el panel. */
function deviceLabel(userAgent) {
  const ua = String(userAgent || '').trim();
  if (!ua) return 'Dispositivo desconocido';
  let browser = 'Navegador';
  if (/OpenCode/i.test(ua)) browser = 'OpenCode';
  else if (/HeadlessChrome/i.test(ua)) browser = 'Chrome headless';
  else if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua)) browser = 'Opera';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/CriOS|Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua)) browser = 'Safari';
  else if (/curl\//i.test(ua)) browser = 'curl';
  const platform = platformLabel(ua);
  return platform ? `${browser} · ${platform}` : browser;
}

/** Estado de una fila individual de sesiones_acceso. */
function sessionState(row, now = new Date()) {
  const started = dateValue(row.Creada_En ?? row.Sesion_Iniciada_En);
  const last = dateValue(row.Ultima_Actividad) || started;
  const revoked = dateValue(row.Revocada_En);
  if (!started) {
    return { state: 'offline', label: 'Sin sesión', hasSession: false, expired: false };
  }
  if (revoked) {
    return { state: 'offline', label: 'Revocada', hasSession: false, expired: false };
  }
  const expired = now.getTime() - started.getTime() >= jwtLifetimeMs();
  if (expired) {
    return { state: 'expired', label: 'Expirada', hasSession: false, expired: true };
  }
  const idle = now.getTime() - last.getTime();
  if (idle <= ACTIVE_SESSION_WINDOW_MS) {
    return { state: 'online', label: 'Conectado', hasSession: true, expired: false };
  }
  return { state: 'idle', label: 'Inactivo', hasSession: true, expired: false };
}

/** Resumen de la cuenta y todas sus sesiones vigentes o expiradas. */
function sessionStatus(row, sessions = [], now = new Date()) {
  const list = Array.isArray(sessions) ? sessions : [];
  const valid = list.filter((session) => sessionState(session, now).hasSession);
  const canRevoke = list.length > 0;
  if (!row.Activo) {
    return {
      state: 'disabled', label: 'Deshabilitado', hasSession: false,
      count: valid.length, can_revoke: canRevoke,
    };
  }
  const blocked = dateValue(row.Bloqueado_Hasta);
  if (blocked && blocked > now) {
    return {
      state: 'blocked',
      label: `Bloqueado hasta ${timeLabel(blocked)}`,
      blockedUntil: blocked.toISOString(),
      hasSession: valid.length > 0,
      count: valid.length,
      can_revoke: canRevoke,
    };
  }
  if (valid.length === 0) {
    if (list.length > 0) {
      return {
        state: 'expired', label: 'Sesión expirada', hasSession: false,
        count: 0, can_revoke: true,
      };
    }
    return {
      state: 'offline', label: 'Sin sesión', hasSession: false,
      count: 0, can_revoke: false,
    };
  }
  const online = valid.some((session) => sessionState(session, now).state === 'online');
  return {
    state: online ? 'online' : 'idle',
    label: valid.length > 1
      ? `${valid.length} sesiones` : (online ? 'Conectado' : 'Inactivo'),
    hasSession: true,
    count: valid.length,
    can_revoke: true,
  };
}

function sessionPayload(row, now = new Date()) {
  const state = sessionState(row, now);
  const started = dateValue(row.Creada_En ?? row.Sesion_Iniciada_En);
  return {
    id: row.ID_Sesion,
    shortId: String(row.ID_Sesion || '').slice(0, 8),
    device: deviceLabel(row.User_Agent),
    userAgent: row.User_Agent || '',
    ip: row.Direccion_IP || '',
    startedAt: isoValue(started),
    lastActivityAt: isoValue(row.Ultima_Actividad) || isoValue(started),
    expiresAt: started
      ? new Date(started.getTime() + jwtLifetimeMs()).toISOString() : null,
    state: state.state,
    label: state.label,
    expired: state.expired,
  };
}

/** Revoca todas las sesiones vigentes de una cuenta. */
async function revokeAllSessions(connection, id) {
  const [result] = await connection.execute(
    `UPDATE ${DATABASE}.sesiones_acceso
     SET Revocada_En = CURRENT_TIMESTAMP(3)
     WHERE ID_Acceso = ? AND Revocada_En IS NULL`,
    [id],
  );
  return result.affectedRows;
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
      await ensureSessionSchema(connection);
    }
    if (request.action === 'provision') {
      // prepareAccessDatabase ya aplicó la migración.
    } else if (request.action === 'list') {
      const [rows] = await connection.query(
        `SELECT ID_Acceso, Usuario, Activo, Ultimo_Acceso,
                Bloqueado_Hasta, Intentos_Fallidos, Ultimo_Intento_Fallido
         FROM ${DATABASE}.usuarios_acceso ORDER BY Usuario`,
      );
      const [sessionRows] = await connection.query(
        `SELECT ID_Sesion, ID_Acceso, Creada_En, Ultima_Actividad,
                Revocada_En, User_Agent, Direccion_IP
         FROM ${DATABASE}.sesiones_acceso
         WHERE Revocada_En IS NULL
         ORDER BY ID_Acceso, Ultima_Actividad DESC`,
      );
      const sessionsByUser = new Map();
      for (const session of sessionRows) {
        const key = String(session.ID_Acceso);
        if (!sessionsByUser.has(key)) sessionsByUser.set(key, []);
        sessionsByUser.get(key).push(session);
      }
      const now = new Date();
      result = {
        users: rows.map((row) => {
          const sessions = sessionsByUser.get(String(row.ID_Acceso)) || [];
          return {
            ...row,
            session: sessionStatus(row, sessions, now),
            sessions: sessions.map((session) => sessionPayload(session, now)),
          };
        }),
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
      const revokeSessions = request.password !== undefined || request.active === false;
      // Cambiar la contraseña o desactivar la cuenta cierra todas las sesiones.
      if (revokeSessions) {
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
      let revokedSessions = 0;
      if (revokeSessions) {
        revokedSessions = await revokeAllSessions(connection, request.id);
        if (revokedSessions > 0) {
          await appendSessionEvent(
            request.username,
            'Se revocaron las sesiones al cambiar la cuenta',
            'login.revoked',
            'OK',
            `${revokedSessions} sesión(es) cerrada(s) por contraseña o estado`,
          );
        }
      }
      result = { id: request.id, username: request.username, revokedSessions };
    } else if (request.action === 'delete') {
      if (!Number.isSafeInteger(request.id) || request.id < 1) {
        throw new Error('Selecciona una cuenta válida para eliminar.');
      }
      await connection.execute(
        `DELETE FROM ${DATABASE}.sesiones_acceso WHERE ID_Acceso = ?`,
        [request.id],
      );
      await connection.execute(
        `DELETE FROM ${DATABASE}.aceptaciones_descargo WHERE ID_Acceso = ?`,
        [request.id],
      );
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
        `SELECT Usuario, Activo, Bloqueado_Hasta
         FROM ${DATABASE}.usuarios_acceso
         WHERE ID_Acceso = ? LIMIT 1`,
        [request.id],
      );
      if (rows.length !== 1) throw new Error('La cuenta ya no existe.');
      const user = rows[0];
      const requestedSession = typeof request.sessionId === 'string'
        ? request.sessionId.trim() : '';
      if (requestedSession && !/^[0-9a-f-]{36}$/i.test(requestedSession)) {
        throw new Error('La sesión seleccionada no es válida.');
      }
      const [sessionRows] = await connection.execute(
        `SELECT ID_Sesion, User_Agent, Direccion_IP, Creada_En, Ultima_Actividad
         FROM ${DATABASE}.sesiones_acceso
         WHERE ID_Acceso = ? AND Revocada_En IS NULL
         ORDER BY Ultima_Actividad DESC`,
        [request.id],
      );
      let revokedCount = 0;
      let detail = '';
      let actionLabel = 'Se revocó una sesión desde el panel';
      if (requestedSession) {
        const target = sessionRows.find(
          (session) => session.ID_Sesion === requestedSession);
        if (!target) throw new Error('La sesión seleccionada ya no está activa.');
        const [revoked] = await connection.execute(
          `UPDATE ${DATABASE}.sesiones_acceso
           SET Revocada_En = CURRENT_TIMESTAMP(3)
           WHERE ID_Sesion = ? AND ID_Acceso = ? AND Revocada_En IS NULL`,
          [requestedSession, request.id],
        );
        if (revoked.affectedRows !== 1) {
          throw new Error('La sesión seleccionada ya no está activa.');
        }
        revokedCount = 1;
        detail = `Se revocó la sesión de ${deviceLabel(target.User_Agent)} `
          + `(${requestedSession.slice(0, 8)})`;
        // Mantener coherente la columna antigua si apuntaba a esta sesión.
        await connection.execute(
          `UPDATE ${DATABASE}.usuarios_acceso
           SET Sesion_ID = NULL, Sesion_Iniciada_En = NULL,
               Ultima_Actividad = NULL
           WHERE ID_Acceso = ? AND Sesion_ID = ?`,
          [request.id, requestedSession],
        );
      } else {
        actionLabel = 'Se revocaron las sesiones desde el panel';
        const [revoked] = await connection.execute(
          `UPDATE ${DATABASE}.sesiones_acceso
           SET Revocada_En = CURRENT_TIMESTAMP(3)
           WHERE ID_Acceso = ? AND Revocada_En IS NULL`,
          [request.id],
        );
        revokedCount = revoked.affectedRows;
        detail = revokedCount > 0
          ? `${revokedCount} sesión(es) cerrada(s); el usuario deberá autenticarse de nuevo`
          : 'No había sesiones activas';
        await connection.execute(
          `UPDATE ${DATABASE}.usuarios_acceso
           SET Sesion_ID = NULL, Sesion_Iniciada_En = NULL,
               Ultima_Actividad = NULL,
               Sesion_Revocada_En = CURRENT_TIMESTAMP(3)
           WHERE ID_Acceso = ?`,
          [request.id],
        );
      }
      await appendSessionEvent(user.Usuario, actionLabel, 'login.revoked', 'OK', detail);
      const [remainingRows] = await connection.execute(
        `SELECT ID_Sesion, ID_Acceso, Creada_En, Ultima_Actividad,
                Revocada_En, User_Agent, Direccion_IP
         FROM ${DATABASE}.sesiones_acceso
         WHERE ID_Acceso = ? AND Revocada_En IS NULL
         ORDER BY Ultima_Actividad DESC`,
        [request.id],
      );
      const now = new Date();
      result = {
        id: request.id,
        username: user.Usuario,
        revoked: revokedCount > 0,
        revokedCount,
        session: sessionStatus(user, remainingRows, now),
        sessions: remainingRows.map((session) => sessionPayload(session, now)),
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
    await ensureSessionSchema(admin);
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
    await ensureSessionSchema(admin);
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
    const [users] = await pool.query(
      'SELECT ID_Acceso FROM usuarios_acceso WHERE Usuario = ? AND Activo = 1 LIMIT 1',
      [username],
    );
    if (users.length !== 1) return false;
    const id = users[0].ID_Acceso;
    await pool.query('UPDATE usuarios_acceso SET Activo = 0 WHERE ID_Acceso = ?', [id]);
    try {
      await pool.query(
        `UPDATE usuarios_acceso
         SET Sesion_ID = NULL, Sesion_Iniciada_En = NULL,
             Ultima_Actividad = NULL, Sesion_Revocada_En = CURRENT_TIMESTAMP(3)
         WHERE ID_Acceso = ?`,
        [id],
      );
    } catch (error) {
      if (error?.code !== 'ER_BAD_FIELD_ERROR') throw error;
    }
    try {
      await pool.query(
        `UPDATE sesiones_acceso
         SET Revocada_En = CURRENT_TIMESTAMP(3)
         WHERE ID_Acceso = ? AND Revocada_En IS NULL`,
        [id],
      );
    } catch (error) {
      if (!['ER_BAD_TABLE_ERROR', 'ER_BAD_FIELD_ERROR'].includes(error?.code)) {
        throw error;
      }
    }
    return true;
  });
  if (!changed) throw new Error('La cuenta no existe o ya estaba desactivada.');
  console.log(`Cuenta de acceso ${username} desactivada; sus sesiones fueron revocadas.`);
}

async function listUsers() {
  await ensureSchemaWithAdmin();
  const { users, sessions } = await withAccessPool(async (pool) => {
    const [userRows] = await pool.query(
      `SELECT ID_Acceso, Usuario, Activo, Ultimo_Acceso,
              Bloqueado_Hasta, Intentos_Fallidos
       FROM usuarios_acceso ORDER BY Usuario`,
    );
    const [sessionRows] = await pool.query(
      `SELECT ID_Sesion, ID_Acceso, Creada_En, Ultima_Actividad,
              Revocada_En, User_Agent, Direccion_IP
       FROM sesiones_acceso
       WHERE Revocada_En IS NULL
       ORDER BY ID_Acceso, Ultima_Actividad DESC`,
    );
    return { users: userRows, sessions: sessionRows };
  });
  if (users.length === 0) {
    console.log('No hay cuentas de acceso creadas.');
    return;
  }
  const now = new Date();
  for (const user of users) {
    const userSessions = sessions.filter(
      (session) => String(session.ID_Acceso) === String(user.ID_Acceso));
    const summary = sessionStatus(user, userSessions, now);
    console.log(`${user.Usuario}\t${user.Activo ? 'activa' : 'desactivada'}`
      + `\t${summary.label}\t${user.Ultimo_Acceso || 'sin acceso'}`);
    for (const session of userSessions.map((row) => sessionPayload(row, now))) {
      console.log(`  - ${session.device} · ${session.ip || 'IP desconocida'}`
        + ` · ${session.label} · ${session.lastActivityAt || 'sin actividad'}`);
    }
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
