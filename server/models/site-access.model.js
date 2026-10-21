/**
 * @fileoverview Allowlist and session-scoped academic disclaimer records.
 */
import pool from '../config/db.js';

export const siteAccessModel = {
  async isAuthorized(userId) {
    const [rows] = await pool.query(
      'SELECT 1 FROM sitio_usuarios_autorizados WHERE ID_Usuario = ? LIMIT 1',
      [userId],
    );
    return rows.length === 1;
  },

  async hasAcceptedDisclaimer(userId, sessionId, version) {
    const [rows] = await pool.query(
      `SELECT 1 FROM sitio_aceptaciones_descargo
       WHERE ID_Usuario = ? AND Session_ID = ? AND Version = ? LIMIT 1`,
      [userId, sessionId, version],
    );
    return rows.length === 1;
  },

  async recordDisclaimerAcceptance(userId, sessionId, version) {
    await pool.query(
      `INSERT INTO sitio_aceptaciones_descargo (ID_Usuario, Session_ID, Version)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE Aceptado_En = CURRENT_TIMESTAMP`,
      [userId, sessionId, version],
    );
  },
};

export default siteAccessModel;
