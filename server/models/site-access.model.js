/**
 * @fileoverview Allowlist, session control and academic disclaimer records.
 */
import pool from '../config/site-access-db.js';

const BASE_COLUMNS = 'ID_Acceso, Usuario, Hash_Contrasena, Activo, Ultimo_Acceso';
const SESSION_COLUMNS = `Sesion_ID, Sesion_Iniciada_En, Ultima_Actividad,
  Sesion_Revocada_En, Intentos_Fallidos, Ultimo_Intento_Fallido,
  Bloqueado_Hasta`;

/** true si la migración de control de sesiones aún no se aplicó. */
function missingSchema(error) {
  return error?.code === 'ER_BAD_FIELD_ERROR' || error?.code === 'ER_BAD_TABLE_ERROR';
}

/** Tolerancia de despliegue: sin columnas nuevas no se bloquea el acceso. */
async function ignoreMissing(run) {
  try {
    return await run();
  } catch (error) {
    if (missingSchema(error)) return null;
    throw error;
  }
}

export const siteAccessModel = {
  async findByUsername(username) {
    try {
      const [rows] = await pool.query(
        `SELECT ${BASE_COLUMNS}, ${SESSION_COLUMNS}
         FROM usuarios_acceso WHERE Usuario = ? LIMIT 1`,
        [username],
      );
      return rows[0] || null;
    } catch (error) {
      if (!missingSchema(error)) throw error;
      const [rows] = await pool.query(
        `SELECT ${BASE_COLUMNS} FROM usuarios_acceso
         WHERE Usuario = ? LIMIT 1`,
        [username],
      );
      return rows[0] || null;
    }
  },

  async findActiveById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT ID_Acceso, Usuario, Activo, ${SESSION_COLUMNS}
         FROM usuarios_acceso WHERE ID_Acceso = ? AND Activo = 1 LIMIT 1`,
        [id],
      );
      return rows[0] || null;
    } catch (error) {
      if (!missingSchema(error)) throw error;
      const [rows] = await pool.query(
        'SELECT ID_Acceso, Usuario, Activo FROM usuarios_acceso '
        + 'WHERE ID_Acceso = ? AND Activo = 1 LIMIT 1',
        [id],
      );
      return rows[0] || null;
    }
  },

  async updateLastLogin(id) {
    await pool.query(
      'UPDATE usuarios_acceso SET Ultimo_Acceso = CURRENT_TIMESTAMP WHERE ID_Acceso = ?',
      [id],
    );
  },

  /** Abre una sesión nueva (un único token vigente por cuenta). */
  async startSession(id, sessionId) {
    await ignoreMissing(() => pool.query(
      `UPDATE usuarios_acceso
       SET Sesion_ID = ?, Sesion_Iniciada_En = CURRENT_TIMESTAMP(3),
           Ultima_Actividad = CURRENT_TIMESTAMP(3),
           Intentos_Fallidos = 0, Ultimo_Intento_Fallido = NULL,
           Bloqueado_Hasta = NULL
       WHERE ID_Acceso = ?`,
      [sessionId, id],
    ));
  },

  /** Renueva la marca de actividad (llamada con límite de frecuencia). */
  async touchActivity(id) {
    await ignoreMissing(() => pool.query(
      'UPDATE usuarios_acceso SET Ultima_Actividad = CURRENT_TIMESTAMP(3) '
      + 'WHERE ID_Acceso = ?',
      [id],
    ));
  },

  /** Cierra la sesión activa sin revocar tokens anteriores. */
  async endSession(id) {
    await ignoreMissing(() => pool.query(
      `UPDATE usuarios_acceso
       SET Sesion_ID = NULL, Sesion_Iniciada_En = NULL, Ultima_Actividad = NULL
       WHERE ID_Acceso = ?`,
      [id],
    ));
  },

  /** Invalida el token vigente y marca la revocación para auditoría. */
  async revokeSession(id) {
    await ignoreMissing(() => pool.query(
      `UPDATE usuarios_acceso
       SET Sesion_ID = NULL, Sesion_Iniciada_En = NULL,
           Ultima_Actividad = NULL, Sesion_Revocada_En = CURRENT_TIMESTAMP(3)
       WHERE ID_Acceso = ?`,
      [id],
    ));
  },

  async registerFailedAttempt(id, attempts, blockedUntil) {
    await ignoreMissing(() => pool.query(
      `UPDATE usuarios_acceso
       SET Intentos_Fallidos = ?, Ultimo_Intento_Fallido = CURRENT_TIMESTAMP(3),
           Bloqueado_Hasta = ?
       WHERE ID_Acceso = ?`,
      [attempts, blockedUntil, id],
    ));
  },

  async resetFailures(id) {
    await ignoreMissing(() => pool.query(
      `UPDATE usuarios_acceso
       SET Intentos_Fallidos = 0, Ultimo_Intento_Fallido = NULL,
           Bloqueado_Hasta = NULL
       WHERE ID_Acceso = ?`,
      [id],
    ));
  },

  async hasAcceptedDisclaimer(userId, sessionId, version) {
    const [rows] = await pool.query(
      `SELECT 1 FROM aceptaciones_descargo
       WHERE ID_Acceso = ? AND Session_ID = ? AND Version = ? LIMIT 1`,
      [userId, sessionId, version],
    );
    return rows.length === 1;
  },

  async recordDisclaimerAcceptance(userId, sessionId, version) {
    await pool.query(
      `INSERT INTO aceptaciones_descargo (ID_Acceso, Session_ID, Version)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE Aceptado_En = CURRENT_TIMESTAMP`,
      [userId, sessionId, version],
    );
  },

  async createUser(username, passwordHash) {
    await pool.query(
      'INSERT INTO usuarios_acceso (Usuario, Hash_Contrasena) VALUES (?, ?)',
      [username, passwordHash],
    );
  },

  async disableUser(username) {
    const [result] = await pool.query(
      'UPDATE usuarios_acceso SET Activo = 0 WHERE Usuario = ? AND Activo = 1',
      [username],
    );
    return result.affectedRows === 1;
  },

  async listUsers() {
    try {
      const [rows] = await pool.query(
        `SELECT ID_Acceso, Usuario, Activo, Ultimo_Acceso, ${SESSION_COLUMNS}
         FROM usuarios_acceso ORDER BY Usuario`,
      );
      return rows;
    } catch (error) {
      if (!missingSchema(error)) throw error;
      const [rows] = await pool.query(
        'SELECT ID_Acceso, Usuario, Activo, Ultimo_Acceso '
        + 'FROM usuarios_acceso ORDER BY Usuario',
      );
      return rows;
    }
  },
};

export default siteAccessModel;
