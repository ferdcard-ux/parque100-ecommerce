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

  async findByName(name, exceptId = null) {
    const query = exceptId === null
      ? 'SELECT ID_Categoria FROM categorias WHERE Nombre_Categoria = ? LIMIT 1'
      : 'SELECT ID_Categoria FROM categorias WHERE Nombre_Categoria = ? AND ID_Categoria <> ? LIMIT 1';
    const values = exceptId === null ? [name] : [name, exceptId];
    const [rows] = await pool.query(query, values);
    return rows[0] || null;
  },

  async create(name) {
    const [result] = await pool.query(
      'INSERT INTO categorias (Nombre_Categoria) VALUES (?)',
      [name],
    );
    return result.insertId;
  },

  async update(id, name) {
    await pool.query('UPDATE categorias SET Nombre_Categoria = ? WHERE ID_Categoria = ?', [name, id]);
  },

  async remove(id) {
    await pool.query('DELETE FROM categorias WHERE ID_Categoria = ?', [id]);
  },
};

export default categoryModel;
