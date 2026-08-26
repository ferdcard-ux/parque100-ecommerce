/**
 * @fileoverview Modelo de pedidos.
 * Encapsula las consultas SQL sobre las tablas `pedidos` y
 * `detalle_pedido`, incluyendo la creacion transaccional de un
 * pedido con sus lineas de detalle (patron MVC - Model).
 */
import pool from '../config/db.js';

/**
 * Modelo de pedidos.
 * @namespace orderModel
 */
export const orderModel = {
  /**
   * Obtiene todos los pedidos junto con el nombre del usuario que
   * los realizo, ordenados del mas reciente al mas antiguo.
   *
   * @async
   * @returns {Promise<Array<Object>>} Lista de pedidos con `Usuario_Nombre`.
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async findAll() {
    const [rows] = await pool.query(`
      SELECT p.*, u.Nombre AS Usuario_Nombre
      FROM pedidos p
      LEFT JOIN usuario u ON p.ID_Usuario = u.ID_Usuario
      ORDER BY p.Fecha DESC
    `);
    return rows;
  },

  /**
   * Busca un pedido por su identificador e incluye sus lineas de
   * detalle con el nombre de cada producto.
   *
   * @async
   * @param {number} id - Identificador del pedido.
   * @returns {Promise<Object|null>} Pedido con propiedad `detalles`
   *   (array) o `null` si no existe.
   * @throws {Error} Si falla alguna consulta.
   */
  async findByIdWithDetails(id) {
    const [rows] = await pool.query('SELECT * FROM pedidos WHERE ID_Pedido = ?', [id]);
    if (rows.length === 0) return null;

    const [details] = await pool.query(
      `
      SELECT d.*, p.Nombre AS Producto_Nombre
      FROM detalle_pedido d
      LEFT JOIN productos p ON d.ID_Producto = p.ID_Producto
      WHERE d.ID_Pedido = ?
    `,
      [id],
    );

    return { ...rows[0], detalles: details };
  },

  /**
   * Crea un pedido y sus detalles dentro de una transaccion.
   * Si alguna linea de detalle falla, se revierte todo (atomicidad).
   *
   * @async
   * @param {Object} data - Datos del pedido.
   * @param {string} [data.Fecha] - Fecha YYYY-MM-DD (por defecto hoy).
   * @param {string} [data.Estado] - Estado inicial ('pendiente' por defecto).
   * @param {number} data.Total - Total monetario del pedido.
   * @param {string} data.Tipo_Entrega - 'domicilio' o 'recogida'.
   * @param {number} data.ID_Usuario - Usuario que realiza el pedido.
   * @param {Array<Object>} [data.productos] - Lineas de detalle:
   *   `{ ID_Producto, Cantidad, Subtotal }`.
   * @returns {Promise<number>} El `insertId` del pedido creado.
   * @throws {Error} Si falla la insercion; la transaccion se revierte.
   */
  async createWithDetails({ Fecha, Estado, Total, Tipo_Entrega, ID_Usuario, productos }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        'INSERT INTO pedidos (Fecha, Estado, Total, Tipo_Entrega, ID_Usuario) VALUES (?, ?, ?, ?, ?)',
        [
          Fecha || new Date().toISOString().split('T')[0],
          Estado || 'pendiente',
          Total,
          Tipo_Entrega,
          ID_Usuario,
        ],
      );
      const pedidoId = result.insertId;

      if (productos && productos.length > 0) {
        for (const item of productos) {
          await connection.query(
            'INSERT INTO detalle_pedido (ID_Pedido, ID_Producto, Cantidad, Subtotal) VALUES (?, ?, ?, ?)',
            [pedidoId, item.ID_Producto, item.Cantidad, item.Subtotal],
          );
        }
      }

      await connection.commit();
      return pedidoId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },
};

export default orderModel;
