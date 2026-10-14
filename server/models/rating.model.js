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
      conditions.push('c.ID_Producto = ?');
      params.push(ID_Producto);
    }
    if (ID_Pedido) {
      conditions.push('c.ID_Pedido = ?');
      params.push(Number(ID_Pedido));
    }
    if (ID_Usuario) {
      conditions.push('c.ID_Usuario = ?');
      params.push(Number(ID_Usuario));
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT c.*, u.Nombre AS Usuario_Nombre, u.Foto AS Usuario_Foto
       FROM calificaciones c
       LEFT JOIN usuario u ON c.ID_Usuario = u.ID_Usuario
       ${where} ORDER BY c.Fecha DESC LIMIT 200`,
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
   * Reglas de negocio:
   *   - Tipo 'producto': exige ID_Usuario e ID_Pedido y verifica que el
   *     usuario compro ese producto en ese pedido con estado 'entregado'.
   *     Solo una resena por producto y pedido (409 si existe).
   *
   * @async
   * @param {Object} data - Datos validados.
   * @returns {Promise<number>} El `insertId` generado.
   * @throws {Error} 400 si faltan datos, 403 sin compra verificada, 409 duplicada.
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
    if (Tipo === 'pedido' || Tipo === 'envio') {
      const userId = Number(ID_Usuario);
      const orderId = Number(ID_Pedido);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw createRatingError('Debes iniciar sesion para calificar.', 400);
      }
      if (!Number.isInteger(orderId) || orderId <= 0) {
        throw createRatingError('ID_Pedido es obligatorio para esta calificacion.', 400);
      }
      const [orders] = await pool.query('SELECT ID_Usuario FROM pedidos WHERE ID_Pedido = ? LIMIT 1', [orderId]);
      if (orders.length === 0) {
        throw createRatingError('El pedido no existe.', 404);
      }
      if (Number(orders[0].ID_Usuario) !== userId) {
        throw createRatingError('Solo puedes calificar tus propios pedidos.', 403);
      }
      const [existing] = await pool.query(
        'SELECT ID_Calificacion FROM calificaciones WHERE Tipo = ? AND ID_Usuario = ? AND ID_Pedido = ? LIMIT 1',
        [Tipo, userId, orderId],
      );
      if (existing.length > 0) {
        throw createRatingError('Ya calificaste este pedido. Puedes editar tu resena.', 409);
      }
    }
    if (Tipo === 'producto') {
      const userId = Number(ID_Usuario);
      const orderId = Number(ID_Pedido);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw createRatingError('Debes iniciar sesion para calificar un producto.', 400);
      }
      if (!Number.isInteger(orderId) || orderId <= 0) {
        throw createRatingError('ID_Pedido es obligatorio para calificar un producto.', 400);
      }
      const [purchase] = await pool.query(
        `SELECT 1 FROM pedidos p
         INNER JOIN detalle_pedido d ON d.ID_Pedido = p.ID_Pedido AND d.ID_Producto = ?
         WHERE p.ID_Pedido = ? AND p.ID_Usuario = ? AND p.Estado = 'entregado'
         LIMIT 1`,
        [ID_Producto, orderId, userId],
      );
      if (purchase.length === 0) {
        throw createRatingError(
          'Solo puedes calificar productos de un pedido entregado.',
          403,
        );
      }
      const [existing] = await pool.query(
        `SELECT ID_Calificacion FROM calificaciones
         WHERE Tipo = 'producto' AND ID_Usuario = ? AND ID_Producto = ? AND ID_Pedido = ?
         LIMIT 1`,
        [userId, ID_Producto, orderId],
      );
      if (existing.length > 0) {
        throw createRatingError(
          'Ya calificaste este producto en este pedido. Puedes editar tu resena.',
          409,
        );
      }
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
   * Edita las estrellas y el comentario de una calificacion.
   * Solo el autor (ID_Usuario coincidente) puede editarla.
   *
   * @async
   * @param {number} id - Identificador de la calificacion.
   * @param {Object} data - `{ ID_Usuario, Estrellas, Comentario }`.
   * @returns {Promise<boolean|null>} true si edito, null si no existe.
   * @throws {Error} 400 datos invalidos, 403 si no es el autor.
   */
  async updateById(id, { ID_Usuario, Estrellas, Comentario }) {
    const [rows] = await pool.query(
      'SELECT ID_Calificacion, ID_Usuario FROM calificaciones WHERE ID_Calificacion = ?',
      [id],
    );
    if (rows.length === 0) return null;
    if (rows[0].ID_Usuario === null || Number(rows[0].ID_Usuario) !== Number(ID_Usuario)) {
      throw createRatingError('Solo el autor puede editar esta resena.', 403);
    }
    const stars = Number(Estrellas);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      throw createRatingError('Las estrellas deben ser un entero de 1 a 5.', 400);
    }
    const [result] = await pool.query(
      'UPDATE calificaciones SET Estrellas = ?, Comentario = ? WHERE ID_Calificacion = ?',
      [
        stars,
        typeof Comentario === 'string' && Comentario.trim() ? Comentario.trim().slice(0, 255) : null,
        id,
      ],
    );
    return result.affectedRows === 1;
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
