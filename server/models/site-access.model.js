/**
 * @fileoverview Allowlist and session-scoped academic disclaimer records.
 */
import pool from '../config/site-access-db.js';

export const siteAccessModel = {
  async findByUsername(username) {
    const [rows] = await pool.query(
      `SELECT ID_Acceso, Usuario, Hash_Contrasena, Activo
       FROM usuarios_acceso WHERE Usuario = ? LIMIT 1`,
      [username],
    );
    return rows[0] || null;
  },

  async findActiveById(id) {
    const [rows] = await pool.query(
      'SELECT ID_Acceso, Usuario FROM usuarios_acceso WHERE ID_Acceso = ? AND Activo = 1 LIMIT 1',
      [id],
    );
    return rows[0] || null;
  },

  async updateLastLogin(id) {
    await pool.query(
      'UPDATE usuarios_acceso SET Ultimo_Acceso = CURRENT_TIMESTAMP WHERE ID_Acceso = ?',
      [id],
    );
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
    const [rows] = await pool.query(
      'SELECT Usuario, Activo, Ultimo_Acceso FROM usuarios_acceso ORDER BY Usuario',
    );
    return rows;
  },
};

export default siteAccessModel;
