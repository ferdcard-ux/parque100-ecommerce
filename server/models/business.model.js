/**
 * @fileoverview Modelo de datos del negocio.
 * Encapsula las consultas SQL sobre la tabla `negocio` (fila unica
 * id = 1) con los datos editables desde el panel admin
 * (patron MVC - Model).
 */
import pool from '../config/db.js';

/**
 * Modelo de datos del negocio.
 * @namespace businessModel
 */
export const businessModel = {
  /**
   * Obtiene los datos del negocio (fila id = 1).
   *
   * @async
   * @returns {Promise<Object|null>} Fila del negocio o null si no existe.
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async find() {
    const [rows] = await pool.query('SELECT * FROM negocio WHERE ID_Negocio = 1');
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Actualiza los datos del negocio (fila id = 1).
   *
   * @async
   * @param {Object} data - Datos a actualizar.
   * @param {string} data.Nombre - Nombre comercial.
   * @param {string} [data.NIT] - NIT del negocio.
   * @param {string} [data.Direccion] - Direccion fisica.
   * @param {string} [data.Telefono] - Telefono de contacto.
   * @param {string} [data.Email] - Correo de contacto.
   * @param {string} [data.Horario] - Horario de atencion.
   * @param {string} [data.Descripcion] - Descripcion corta.
   * @returns {Promise<boolean>} true si se actualizo la fila.
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async update(data) {
    const [result] = await pool.query(
      `UPDATE negocio SET Nombre = ?, NIT = ?, Direccion = ?, Telefono = ?,
        Email = ?, Horario = ?, Descripcion = ? WHERE ID_Negocio = 1`,
      [
        data.Nombre,
        data.NIT ?? null,
        data.Direccion ?? null,
        data.Telefono ?? null,
        data.Email ?? null,
        data.Horario ?? null,
        data.Descripcion ?? null,
      ],
    );
    return result.affectedRows === 1;
  },
};

export default businessModel;
