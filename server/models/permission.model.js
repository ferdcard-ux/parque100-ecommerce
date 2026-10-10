/**
 * @fileoverview Modelo de permisos por usuario.
 * Encapsula las consultas SQL sobre la tabla `permisos_usuario`
 * (patron MVC - Model). El admin delega `puede_cancelar`.
 */
import pool from '../config/db.js';

/**
 * Modelo de permisos por usuario.
 * @namespace permissionModel
 */
export const permissionModel = {
  /**
   * Obtiene los permisos de un usuario (fila por defecto si no existe).
   *
   * @async
   * @param {number} userId - Identificador del usuario.
   * @returns {Promise<Object>} Permisos `{ ID_Usuario, puede_cancelar }`.
   */
  async findByUser(userId) {
    const [rows] = await pool.query('SELECT * FROM permisos_usuario WHERE ID_Usuario = ?', [userId]);
    if (rows.length > 0) return { ...rows[0], puede_cancelar: Number(rows[0].puede_cancelar) === 1 };
    return { ID_Usuario: userId, puede_cancelar: false };
  },

  /**
   * Crea o actualiza los permisos de un usuario.
   *
   * @async
   * @param {number} userId - Identificador del usuario.
   * @param {Object} data - Permisos a guardar.
   * @param {boolean} data.puede_cancelar - Puede cancelar pedidos.
   * @returns {Promise<Object>} Permisos actualizados.
   */
  async upsert(userId, { puede_cancelar }) {
    await pool.query(
      `INSERT INTO permisos_usuario (ID_Usuario, puede_cancelar) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE puede_cancelar = VALUES(puede_cancelar)`,
      [userId, puede_cancelar ? 1 : 0],
    );
    return this.findByUser(userId);
  },
};

export default permissionModel;
