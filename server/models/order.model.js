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

/** Transiciones de estado permitidas (hacia adelante, sin saltos). */
const NEXT_STATUS = {
  pendiente: ['preparando'],
  preparando: ['enviando'],
  enviando: ['entregado'],
};

/** Metodos de entrega admitidos. */
const VALID_DELIVERY = ['domicilio', 'recogida'];

/** Metodos de pago admitidos. */
const VALID_PAYMENT = ['Efectivo', 'Nequi', 'Tarjeta'];

/** Tamano maximo aceptado para el comprobante en dataURL (~7 MB). */
const MAX_RECEIPT_LENGTH = 7000000;

/** Longitud maxima de las notas del cliente. */
const MAX_NOTES_LENGTH = 500;

/** Fecha actual en horario del servidor (YYYY-MM-DD), sin desfase UTC. */
function localDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
   * Obtiene todos los pedidos con sus lineas de detalle en dos
   * consultas (evita el N+1 de pedir el detalle uno por uno).
   *
   * @async
   * @returns {Promise<Array<Object>>} Pedidos con `detalles` y `Usuario_Nombre`.
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async findAllWithItems() {
    const orders = await this.findAll();
    if (orders.length === 0) return [];
    const ids = orders.map((order) => order.ID_Pedido);
    const placeholders = ids.map(() => '?').join(',');
    const [details] = await pool.query(
      `SELECT d.*, p.Nombre AS Producto_Nombre
       FROM detalle_pedido d
       LEFT JOIN productos p ON d.ID_Producto = p.ID_Producto
       WHERE d.ID_Pedido IN (${placeholders})`,
      ids,
    );
    const byOrder = new Map();
    for (const item of details) {
      const list = byOrder.get(item.ID_Pedido) || [];
      list.push(item);
      byOrder.set(item.ID_Pedido, list);
    }
    return orders.map((order) => ({ ...order, detalles: byOrder.get(order.ID_Pedido) || [] }));
  },

  /**
   * Actualiza el estado de un pedido existente siguiendo la maquina
   * de estados (pendiente -> preparando -> enviando -> entregado).
   * El mismo estado se acepta (idempotente); retrocesos, saltos y
   * estados terminales responden 409. La cancelacion usa `cancelById`.
   *
   * @async
   * @param {number} id - Identificador del pedido.
   * @param {string} estado - Nuevo estado ('pendiente', 'preparando',
   *   'enviando', 'entregado').
   * @returns {Promise<boolean>} true si se actualizo, false si no existe.
   * @throws {Error} 409 si la transicion no esta permitida.
   */
  async updateStatus(id, estado) {
    const [rows] = await pool.query('SELECT Estado FROM pedidos WHERE ID_Pedido = ?', [id]);
    if (rows.length === 0) return false;
    const current = rows[0].Estado;
    if (current === 'cancelado' || current === 'entregado') {
      throw createOrderError(`Un pedido ${current} no admite cambios de estado`, 409);
    }
    if (current === estado) return true;
    if (!(NEXT_STATUS[current] || []).includes(estado)) {
      throw createOrderError(`No se puede pasar de '${current}' a '${estado}'`, 409);
    }
    const [result] = await pool.query('UPDATE pedidos SET Estado = ? WHERE ID_Pedido = ?', [estado, id]);
    return result.affectedRows === 1;
  },

  /**
   * Cancela un pedido guardando el motivo, devolviendo el stock
   * reservado y marcando el estado como 'cancelado' en transaccion.
   * Reglas por actor:
   *   - cliente: solo pendiente o preparando (antes del envio);
   *     siempre puede cancelar por defecto, sin permisos.
   *   - domiciliario: requiere `puede_cancelar` delegado por el admin.
   *   - admin: acceso total (pendiente, preparando, enviando).
   *
   * @async
   * @param {number} id - Identificador del pedido.
   * @param {string} motivo - Motivo obligatorio de la cancelacion.
   * @param {string} [actor='cliente'] - 'cliente', 'domiciliario' o 'admin'.
   * @param {number|null} [actorUserId=null] - Usuario que ejecuta (permiso domiciliario).
   * @returns {Promise<boolean>} true si cancelo el pedido.
   * @throws {Error} 403 sin permiso, 409 si el estado no lo admite.
   */
  async cancelById(id, motivo, actor = 'cliente', actorUserId = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [orders] = await connection.query(
        'SELECT Estado FROM pedidos WHERE ID_Pedido = ? FOR UPDATE',
        [id],
      );
      if (orders.length === 0) {
        throw createOrderError('Pedido no encontrado', 404);
      }
      const estado = orders[0].Estado;
      if (estado === 'cancelado') {
        throw createOrderError('El pedido ya esta cancelado', 409);
      }

      if (actor === 'domiciliario') {
        const [perms] = await connection.query(
          'SELECT puede_cancelar FROM permisos_usuario WHERE ID_Usuario = ?',
          [actorUserId],
        );
        if (perms.length === 0 || Number(perms[0].puede_cancelar) !== 1) {
          throw createOrderError('No tienes permiso para cancelar pedidos', 403);
        }
      }

      let allowed;
      if (actor === 'cliente') {
        allowed = ['pendiente', 'preparando'];
      } else {
        allowed = ['pendiente', 'preparando', 'enviando'];
      }
      if (!allowed.includes(estado)) {
        if (actor === 'cliente') {
          throw createOrderError('Solo puedes cancelar el pedido antes del envio', 409);
        }
        throw createOrderError(`No se puede cancelar un pedido en estado '${estado}'`, 409);
      }

      const [details] = await connection.query(
        'SELECT ID_Producto, Cantidad FROM detalle_pedido WHERE ID_Pedido = ?',
        [id],
      );
      for (const item of details) {
        await connection.query(
          'UPDATE productos SET Stock_Minimo = Stock_Minimo + ? WHERE ID_Producto = ?',
          [item.Cantidad, item.ID_Producto],
        );
      }

      const [result] = await connection.query(
        "UPDATE pedidos SET Estado = 'cancelado', Motivo_Cancelacion = ? WHERE ID_Pedido = ?",
        [motivo, id],
      );

      await connection.commit();
      return result.affectedRows === 1;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
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
   * @param {string} [data.Tipo_Entrega] - 'domicilio' o 'recogida'.
   * @param {number} data.ID_Usuario - Usuario que realiza el pedido.
   * @param {Array<Object>} [data.productos] - Lineas de detalle:
   *   `{ ID_Producto, Cantidad, Subtotal }`.
   * @param {string} [data.Notas] - Notas adicionales para el domiciliario.
   * @returns {Promise<number>} El `insertId` del pedido creado.
  * @throws {Error} Si falta stock o falla una operacion; revierte todo.
   */
  async createWithDetails({
    Fecha, Tipo_Entrega, ID_Usuario, productos,
    Destinatario, Telefono, Torre, Piso, Apartamento, Metodo_Pago,
    Monto_Recibido, Cambio, Comprobante, Notas,
  }) {
    if (!Array.isArray(productos) || productos.length === 0) {
      throw createOrderError('El pedido debe incluir al menos un producto', 400);
    }
    const delivery = Tipo_Entrega ?? 'domicilio';
    if (!VALID_DELIVERY.includes(delivery)) {
      throw createOrderError(`Tipo de entrega invalido. Usa: ${VALID_DELIVERY.join(', ')}`, 400);
    }
    const payMethod = Metodo_Pago ?? 'Efectivo';
    if (!VALID_PAYMENT.includes(payMethod)) {
      throw createOrderError(`Metodo de pago invalido. Usa: ${VALID_PAYMENT.join(', ')}`, 400);
    }
    const orderText = (value, max, name) => {
      if (value === undefined || value === null || value === '') return null;
      if (typeof value !== 'string' || value.length > max) {
        throw createOrderError(`${name} invalido (maximo ${max} caracteres)`, 400);
      }
      return value;
    };
    const orderPhone = orderText(Telefono, 20, 'Telefono');
    if (orderPhone !== null && !/^[\d+\s-]+$/.test(orderPhone)) {
      throw createOrderError('Telefono invalido', 400);
    }
    if (Comprobante !== undefined && Comprobante !== null && Comprobante !== '') {
      if (
        typeof Comprobante !== 'string' ||
        Comprobante.length > MAX_RECEIPT_LENGTH ||
        !Comprobante.startsWith('data:image/')
      ) {
        throw createOrderError('Comprobante invalido: debe ser una imagen', 400);
      }
    }
    const orderNumberOrNull = (value, name) => {
      if (value === undefined || value === null || value === '') return null;
      const num = Number(value);
      if (!Number.isFinite(num)) throw createOrderError(`${name} invalido`, 400);
      return num;
    };

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

      let orderTotal = 0;
      const orderPrices = new Map();
      for (const item of stockPorProducto.values()) {
        const [products] = await connection.query(
          'SELECT Nombre, Precio_Venta, Stock_Minimo FROM productos WHERE ID_Producto = ? FOR UPDATE',
          [item.ID_Producto],
        );
        if (products.length === 0) {
          throw createOrderError(`El producto ${item.ID_Producto} no existe`, 404);
        }

        const unitPrice = Number(products[0].Precio_Venta);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw createOrderError(`El producto "${products[0].Nombre}" no tiene un precio valido`, 409);
        }
        orderPrices.set(String(item.ID_Producto), unitPrice);
        orderTotal += unitPrice * item.Cantidad;

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
          (Fecha, Estado, Total, Tipo_Entrega, ID_Usuario, Destinatario, Telefono, Torre, Piso, Apartamento, Metodo_Pago, Monto_Recibido, Cambio, Comprobante, Notas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Fecha || localDate(),
          'pendiente',
          Math.round(orderTotal),
          delivery,
          ID_Usuario ?? null,
          orderText(Destinatario, 50, 'Destinatario'),
          orderPhone,
          orderText(Torre, 20, 'Torre'),
          orderText(Piso, 20, 'Piso'),
          orderText(Apartamento, 20, 'Apartamento'),
          payMethod,
          orderNumberOrNull(Monto_Recibido, 'Monto recibido'),
          orderNumberOrNull(Cambio, 'Cambio'),
          Comprobante || null,
          orderText(Notas, MAX_NOTES_LENGTH, 'Notas'),
        ],
      );
      const pedidoId = result.insertId;

      if (productos && productos.length > 0) {
        for (const item of productos) {
          await connection.query(
            'INSERT INTO detalle_pedido (ID_Pedido, ID_Producto, Cantidad, Subtotal) VALUES (?, ?, ?, ?)',
            [pedidoId, item.ID_Producto, item.Cantidad, Math.round((orderPrices.get(String(item.ID_Producto)) || 0) * item.Cantidad)],
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
