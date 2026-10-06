/**
 * @fileoverview Modelo de pedidos.
 * Encapsula las consultas SQL sobre las tablas `pedidos` y
 * `detalle_pedido`, incluyendo la creacion transaccional de un
 * pedido con sus lineas de detalle (patron MVC - Model).
 */
import pool from '../config/db.js';

function createOrderError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

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
   * Actualiza el estado de un pedido existente.
   *
   * @async
   * @param {number} id - Identificador del pedido.
   * @param {string} estado - Nuevo estado ('pendiente', 'preparando',
   *   'enviando', 'entregado').
   * @returns {Promise<boolean>} true si se actualizo, false si no existe.
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async updateStatus(id, estado) {
    const [result] = await pool.query('UPDATE pedidos SET Estado = ? WHERE ID_Pedido = ?', [estado, id]);
    return result.affectedRows === 1;
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
  * Valida y descuenta el stock, y crea un pedido con sus detalles
  * dentro de una misma transaccion.
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
  * @throws {Error} Si falta stock o falla una operacion; revierte todo.
   */
  async createWithDetails({
    Fecha, Estado, Total, Tipo_Entrega, ID_Usuario, productos,
    Destinatario, Telefono, Torre, Piso, Apartamento, Metodo_Pago,
  }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const stockPorProducto = new Map();
      for (const item of productos || []) {
        if (!item?.ID_Producto || !Number.isInteger(item.Cantidad) || item.Cantidad <= 0) {
          throw createOrderError('Cada producto debe tener un identificador y una cantidad valida', 400);
        }

        const productId = String(item.ID_Producto);
        const existing = stockPorProducto.get(productId);
        stockPorProducto.set(productId, {
          ID_Producto: item.ID_Producto,
          Cantidad: (existing?.Cantidad || 0) + item.Cantidad,
        });
      }

      for (const item of stockPorProducto.values()) {
        const [products] = await connection.query(
          'SELECT Nombre, Stock_Minimo FROM productos WHERE ID_Producto = ? FOR UPDATE',
          [item.ID_Producto],
        );
        if (products.length === 0) {
          throw createOrderError(`El producto ${item.ID_Producto} no existe`, 404);
        }

        const available = Number(products[0].Stock_Minimo || 0);
        if (available < item.Cantidad) {
          throw createOrderError(
            `Stock insuficiente para "${products[0].Nombre}": disponible ${available}, solicitado ${item.Cantidad}`,
            409,
          );
        }
      }

      const [result] = await connection.query(
        `INSERT INTO pedidos
          (Fecha, Estado, Total, Tipo_Entrega, ID_Usuario, Destinatario, Telefono, Torre, Piso, Apartamento, Metodo_Pago)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Fecha || new Date().toISOString().split('T')[0],
          Estado || 'pendiente',
          Total,
          Tipo_Entrega,
          ID_Usuario ?? null,
          Destinatario ?? null,
          Telefono ?? null,
          Torre ?? null,
          Piso ?? null,
          Apartamento ?? null,
          Metodo_Pago ?? null,
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

      for (const item of stockPorProducto.values()) {
        const [result] = await connection.query(
          'UPDATE productos SET Stock_Minimo = Stock_Minimo - ? WHERE ID_Producto = ? AND Stock_Minimo >= ?',
          [item.Cantidad, item.ID_Producto, item.Cantidad],
        );
        if (result.affectedRows !== 1) {
          throw createOrderError(`No se pudo actualizar el stock del producto ${item.ID_Producto}`, 409);
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
