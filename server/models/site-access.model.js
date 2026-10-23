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

  /**
   * Busca una sesión concreta por su `jti`.
   *
   * Si la tabla `sesiones_acceso` todavía no existe devuelve un marcador para
   * que el middleware pueda usar las columnas antiguas durante el despliegue.
   */
  async findSession(userId, sessionId) {
    if (!sessionId) return null;
    try {
      const [rows] = await pool.query(
        `SELECT ID_Sesion, ID_Acceso, Creada_En, Ultima_Actividad,
                Revocada_En, User_Agent, Direccion_IP
         FROM sesiones_acceso
         WHERE ID_Sesion = ? AND ID_Acceso = ? LIMIT 1`,
        [sessionId, userId],
      );
      return rows[0] || null;
    } catch (error) {
      if (!missingSchema(error)) throw error;
      return { missingSchema: true };
    }
  },

  async updateLastLogin(id) {
    await pool.query(
      'UPDATE usuarios_acceso SET Ultimo_Acceso = CURRENT_TIMESTAMP WHERE ID_Acceso = ?',
      [id],
    );
  },

  /**
   * Abre una sesión nueva sin cerrar las de otros dispositivos.
   * `metadata` guarda el dispositivo (User-Agent) y la IP para el panel.
   */
  async startSession(id, sessionId, metadata = {}) {
    const userAgent = metadata.userAgent
      ? String(metadata.userAgent).slice(0, 255) : null;
    const ip = metadata.ip ? String(metadata.ip).slice(0, 45) : null;
    try {
      await pool.query(
        `INSERT INTO sesiones_acceso
           (ID_Sesion, ID_Acceso, User_Agent, Direccion_IP)
         VALUES (?, ?, ?, ?)`,
        [sessionId, id, userAgent, ip],
      );
      await pool.query(
        `UPDATE usuarios_acceso
         SET Intentos_Fallidos = 0, Ultimo_Intento_Fallido = NULL,
             Bloqueado_Hasta = NULL
         WHERE ID_Acceso = ?`,
        [id],
      );
      return { multiSession: true };
    } catch (error) {
      if (!missingSchema(error)) throw error;
      // Compatibilidad mientras la migración no se haya aplicado.
      await pool.query(
        `UPDATE usuarios_acceso
         SET Sesion_ID = ?, Sesion_Iniciada_En = CURRENT_TIMESTAMP(3),
             Ultima_Actividad = CURRENT_TIMESTAMP(3),
             Intentos_Fallidos = 0, Ultimo_Intento_Fallido = NULL,
             Bloqueado_Hasta = NULL
         WHERE ID_Acceso = ?`,
        [sessionId, id],
      );
      return { multiSession: false };
    }
  },

  /** Renueva la actividad de una sesión concreta, no de toda la cuenta. */
  async touchActivity(sessionId, userId) {
    if (!sessionId) return;
    try {
      await pool.query(
        `UPDATE sesiones_acceso
         SET Ultima_Actividad = CURRENT_TIMESTAMP(3)
         WHERE ID_Sesion = ? AND Revocada_En IS NULL`,
        [sessionId],
      );
    } catch (error) {
      if (!missingSchema(error)) throw error;
      if (!userId) return;
      await pool.query(
        `UPDATE usuarios_acceso
         SET Ultima_Actividad = CURRENT_TIMESTAMP(3)
         WHERE ID_Acceso = ? AND Sesion_ID = ?`,
        [userId, sessionId],
      );
    }
  },

  /** Cierra solo la sesión indicada. */
  async endSession(sessionId, userId = null) {
    try {
      await pool.query(
        `UPDATE sesiones_acceso
         SET Revocada_En = CURRENT_TIMESTAMP(3)
         WHERE ID_Sesion = ? AND Revocada_En IS NULL`,
        [sessionId],
      );
    } catch (error) {
      if (!missingSchema(error)) throw error;
      if (!userId) return;
      await pool.query(
        `UPDATE usuarios_acceso
         SET Sesion_ID = NULL, Sesion_Iniciada_En = NULL, Ultima_Actividad = NULL
         WHERE ID_Acceso = ? AND Sesion_ID = ?`,
        [userId, sessionId],
      );
    }
  },

  /**
   * Revoca una sesión concreta o todas las de la cuenta.
   * Devuelve cuántas sesiones quedaron revocadas en esta llamada.
   */
  async revokeSession(id, sessionId = null) {
    try {
      const [result] = sessionId
        ? await pool.query(
          `UPDATE sesiones_acceso
           SET Revocada_En = CURRENT_TIMESTAMP(3)
           WHERE ID_Sesion = ? AND ID_Acceso = ? AND Revocada_En IS NULL`,
          [sessionId, id],
        )
        : await pool.query(
          `UPDATE sesiones_acceso
           SET Revocada_En = CURRENT_TIMESTAMP(3)
           WHERE ID_Acceso = ? AND Revocada_En IS NULL`,
          [id],
        );
      return result.affectedRows;
    } catch (error) {
      if (!missingSchema(error)) throw error;
      const [result] = sessionId
        ? await pool.query(
          `UPDATE usuarios_acceso
           SET Sesion_ID = NULL, Sesion_Iniciada_En = NULL,
               Ultima_Actividad = NULL, Sesion_Revocada_En = CURRENT_TIMESTAMP(3)
           WHERE ID_Acceso = ? AND Sesion_ID = ?`,
          [id, sessionId],
        )
        : await pool.query(
          `UPDATE usuarios_acceso
           SET Sesion_ID = NULL, Sesion_Iniciada_En = NULL,
               Ultima_Actividad = NULL, Sesion_Revocada_En = CURRENT_TIMESTAMP(3)
           WHERE ID_Acceso = ?`,
          [id],
        );
      return result.affectedRows;
    }
  },

  /** Sesiones no revocadas, ordenadas por cuenta y actividad reciente. */
  async listSessions() {
    try {
      const [rows] = await pool.query(
        `SELECT ID_Sesion, ID_Acceso, Creada_En, Ultima_Actividad,
                Revocada_En, User_Agent, Direccion_IP
         FROM sesiones_acceso
         WHERE Revocada_En IS NULL
         ORDER BY ID_Acceso, Ultima_Actividad DESC`,
      );
      return rows;
    } catch (error) {
      if (!missingSchema(error)) throw error;
      return [];
    }
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
