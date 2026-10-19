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
   * @param {string|null} [data.Imagen_QR] - Imagen del QR de pago.
   * @returns {Promise<boolean>} true si se actualizo la fila.
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async update(data) {
    const fields = [
      'Nombre = ?',
      'NIT = ?',
      'Direccion = ?',
      'Telefono = ?',
      'Email = ?',
      'Horario = ?',
      'Descripcion = ?',
    ];
    const values = [
      data.Nombre,
      data.NIT ?? null,
      data.Direccion ?? null,
      data.Telefono ?? null,
      data.Email ?? null,
      data.Horario ?? null,
      data.Descripcion ?? null,
    ];
    // Solo se toca el QR cuando el cliente lo envia; asi se conserva
    // la imagen actual en actualizaciones parciales.
    if (data.Imagen_QR !== undefined) {
      fields.push('Imagen_QR = ?');
      values.push(data.Imagen_QR ?? null);
    }
    const [result] = await pool.query(
      `UPDATE negocio SET ${fields.join(', ')} WHERE ID_Negocio = 1`,
      values,
    );
    return result.affectedRows === 1;
  },
};

export default businessModel;
