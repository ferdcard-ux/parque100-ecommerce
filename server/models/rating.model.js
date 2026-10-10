/**
 * @fileoverview Modelo de calificaciones.
 * Encapsula las consultas SQL sobre la tabla `calificaciones`
 * (productos, pedidos y envios, 1 a 5 estrellas) (patron MVC - Model).
 */
import pool from '../config/db.js';

function createRatingError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const VALID_TYPES = ['producto', 'pedido', 'envio'];

/**
 * Modelo de calificaciones.
 * @namespace ratingModel
 */
export const ratingModel = {
  /**
   * Lista calificaciones con filtros opcionales.
   *
   * @async
   * @param {Object} filters - Filtros.
   * @param {string} [filters.ID_Producto] - Solo de un producto.
   * @param {number} [filters.ID_Pedido] - Solo de un pedido.
   * @param {number} [filters.ID_Usuario] - Solo de un usuario.
   * @returns {Promise<Array<Object>>} Calificaciones recientes primero.
   */
  async findAll({ ID_Producto, ID_Pedido, ID_Usuario } = {}) {
    const conditions = [];
    const params = [];
    if (ID_Producto) {
      conditions.push('ID_Producto = ?');
      params.push(ID_Producto);
    }
    if (ID_Pedido) {
      conditions.push('ID_Pedido = ?');
      params.push(Number(ID_Pedido));
    }
    if (ID_Usuario) {
      conditions.push('ID_Usuario = ?');
      params.push(Number(ID_Usuario));
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT * FROM calificaciones ${where} ORDER BY Fecha DESC LIMIT 200`,
      params,
    );
    return rows;
  },

  /**
   * Calcula promedio y total de calificaciones de un producto.
   *
   * @async
   * @param {string} productId - Identificador del producto.
   * @returns {Promise<Object>} `{ promedio, total }`.
   */
  async summaryByProduct(productId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total, AVG(Estrellas) AS promedio
       FROM calificaciones WHERE Tipo = 'producto' AND ID_Producto = ?`,
      [productId],
    );
    return {
      total: Number(rows[0]?.total || 0),
      promedio: rows[0]?.promedio === null ? null : Number(rows[0].promedio),
    };
  },

  /**
   * Crea una calificacion de 1 a 5 estrellas.
   *
   * @async
   * @param {Object} data - Datos validados.
   * @returns {Promise<number>} El `insertId` generado.
   * @throws {Error} 400 si el tipo o las estrellas son invalidos.
   */
  async create({ ID_Usuario, ID_Producto, ID_Pedido, Tipo, Estrellas, Comentario }) {
    if (!VALID_TYPES.includes(Tipo)) {
      throw createRatingError(`Tipo invalido. Usa: ${VALID_TYPES.join(', ')}`, 400);
    }
    const stars = Number(Estrellas);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      throw createRatingError('Las estrellas deben ser un entero de 1 a 5.', 400);
    }
    if (Tipo === 'producto' && !ID_Producto) {
      throw createRatingError('ID_Producto es obligatorio para calificar un producto.', 400);
    }
    if ((Tipo === 'pedido' || Tipo === 'envio') && !ID_Pedido) {
      throw createRatingError('ID_Pedido es obligatorio para esta calificacion.', 400);
    }
    const [result] = await pool.query(
      `INSERT INTO calificaciones (ID_Usuario, ID_Producto, ID_Pedido, Tipo, Estrellas, Comentario)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ID_Usuario ?? null,
        ID_Producto ?? null,
        ID_Pedido ?? null,
        Tipo,
        stars,
        typeof Comentario === 'string' && Comentario.trim() ? Comentario.trim().slice(0, 255) : null,
      ],
    );
    return result.insertId;
  },

  /**
   * Elimina una calificacion por su identificador (moderacion).
   *
   * @async
   * @param {number} id - Identificador de la calificacion.
   * @returns {Promise<boolean>} true si elimino una fila.
   */
  async deleteById(id) {
    const [result] = await pool.query('DELETE FROM calificaciones WHERE ID_Calificacion = ?', [id]);
    return result.affectedRows === 1;
  },
};

export default ratingModel;
