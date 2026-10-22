import pool from '../config/db.js';

export const unitModel = {
  async findAll() {
    const [rows] = await pool.query('SELECT ID_Unidad, Nombre_Unidad FROM unidades_medida ORDER BY Nombre_Unidad');
    return rows;
  },

  async findByName(name, exceptId = null) {
    const query = exceptId === null
      ? 'SELECT ID_Unidad FROM unidades_medida WHERE Nombre_Unidad = ? LIMIT 1'
      : 'SELECT ID_Unidad FROM unidades_medida WHERE Nombre_Unidad = ? AND ID_Unidad <> ? LIMIT 1';
    const values = exceptId === null ? [name] : [name, exceptId];
    const [rows] = await pool.query(query, values);
    return rows[0] || null;
  },

  async create(name) {
    const [result] = await pool.query(
      'INSERT INTO unidades_medida (Nombre_Unidad) VALUES (?)',
      [name],
    );
    return result.insertId;
  },

  async update(id, name, previousName) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        'UPDATE productos SET Contenido_Unidad = ? WHERE Contenido_Unidad = ?',
        [name, previousName],
      );
      await connection.query(
        'UPDATE unidades_medida SET Nombre_Unidad = ? WHERE ID_Unidad = ?',
        [name, id],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async remove(id, name) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM productos WHERE Contenido_Unidad = ?',
      [name],
    );
    if (Number(rows[0]?.total) > 0) {
      const error = new Error('No se puede eliminar: hay productos que usan esta unidad.');
      error.code = 'UNIT_IN_USE';
      throw error;
    }
    await pool.query('DELETE FROM unidades_medida WHERE ID_Unidad = ?', [id]);
  },
};

export default unitModel;
