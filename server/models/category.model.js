/**
 * @fileoverview Modelo de categorias.
 * Encapsula las consultas SQL sobre la tabla `categorias`
 * (patron MVC - Model).
 */
import pool from '../config/db.js';

/**
 * Modelo de categorias.
 * @namespace categoryModel
 */
export const categoryModel = {
  /**
   * Obtiene todas las categorias registradas ordenadas por nombre.
   *
   * @async
   * @returns {Promise<Array<Object>>} Lista de categorias.
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM categorias ORDER BY Nombre_Categoria');
    return rows;
  },
};

export default categoryModel;
