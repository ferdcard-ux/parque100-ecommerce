/**
 * @fileoverview Modelo de pedidos.
 * Encapsula pedidos, inventario y transacciones academicas DEMO,
 * incluyendo confirmaciones atomicas de pedido, pago simulado y stock.
 */
import { randomUUID } from 'node:crypto';
import pool from '../config/db.js';
import { isDemoPaymentMethod, isDemoPaymentsEnabled } from '../config/payment-mode.js';

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
const VALID_PAYMENT = ['Efectivo', 'Tarjeta (DEMO)', 'Nequi (DEMO)'];

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

function orderText(value, max, name) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > max) {
    throw createOrderError(`${name} invalido (maximo ${max} caracteres)`, 400);
  }
  return value;
}

function orderNumberOrNull(value, name) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) throw createOrderError(`${name} invalido`, 400);
  return num;
}

async function insertOrder(connection, data, payMethod) {
  const {
    Fecha, Tipo_Entrega, ID_Usuario, productos,
    Destinatario, Telefono, Torre, Piso, Apartamento,
    Monto_Recibido, Cambio, Comprobante, Notas,
  } = data;
  if (!Array.isArray(productos) || productos.length === 0) {
    throw createOrderError('El pedido debe incluir al menos un producto', 400);
  }
  if (!VALID_PAYMENT.includes(payMethod)) {
    throw createOrderError(`Metodo de pago invalido. Usa: ${VALID_PAYMENT.join(', ')}`, 400);
  }
  const delivery = Tipo_Entrega ?? 'domicilio';
  if (!VALID_DELIVERY.includes(delivery)) {
    throw createOrderError(`Tipo de entrega invalido. Usa: ${VALID_DELIVERY.join(', ')}`, 400);
  }
  const demoPayment = isDemoPaymentMethod(payMethod);
  if (demoPayment && (Monto_Recibido != null || Comprobante != null)) {
    throw createOrderError('Un pedido demo no admite efectivo ni comprobantes de pago.', 400);
  }
  const orderPhone = orderText(Telefono, 20, 'Telefono');
  if (orderPhone !== null && !/^\d{10}$/.test(orderPhone)) {
    throw createOrderError('El telefono debe tener exactamente 10 digitos.', 400);
  }
  const tower = orderText(Torre, 20, 'Torre');
  const floor = orderText(Piso, 20, 'Piso');
  const apartment = orderText(Apartamento, 20, 'Apartamento');
  for (const [value, name] of [[tower, 'Torre'], [floor, 'Piso'], [apartment, 'Apartamento']]) {
    if (value !== null && !/^\d+$/.test(value)) {
      throw createOrderError(`${name} debe contener solo digitos.`, 400);
    }
  }
  if (Comprobante !== undefined && Comprobante !== null && Comprobante !== '') {
    throw createOrderError('Los comprobantes de pago electronico no estan habilitados.', 400);
  }
  const receivedAmount = orderNumberOrNull(Monto_Recibido, 'Monto recibido');
  const changeAmount = orderNumberOrNull(Cambio, 'Cambio');
  for (const [value, name] of [[receivedAmount, 'Monto recibido'], [changeAmount, 'Cambio']]) {
    if (value !== null && (!Number.isInteger(value) || value < 0 || value > 999999)) {
      throw createOrderError(`${name} debe ser un entero entre 0 y 999999.`, 400);
    }
  }

  const stockPorProducto = new Map();
  for (const item of productos) {
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
      tower,
      floor,
      apartment,
      payMethod,
      receivedAmount,
      changeAmount,
      Comprobante || null,
      orderText(Notas, MAX_NOTES_LENGTH, 'Notas'),
    ],
  );
  const pedidoId = result.insertId;

  for (const item of productos) {
    await connection.query(
      'INSERT INTO detalle_pedido (ID_Pedido, ID_Producto, Cantidad, Subtotal) VALUES (?, ?, ?, ?)',
      [
        pedidoId,
        item.ID_Producto,
        item.Cantidad,
        Math.round((orderPrices.get(String(item.ID_Producto)) || 0) * item.Cantidad),
      ],
    );
  }

  for (const item of stockPorProducto.values()) {
    const [stockResult] = await connection.query(
      'UPDATE productos SET Stock_Minimo = Stock_Minimo - ? WHERE ID_Producto = ? AND Stock_Minimo >= ?',
      [item.Cantidad, item.ID_Producto, item.Cantidad],
    );
    if (stockResult.affectedRows !== 1) {
      throw createOrderError(`No se pudo actualizar el stock del producto ${item.ID_Producto}`, 409);
    }
  }

  return { id: pedidoId, total: Math.round(orderTotal) };
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
      SELECT p.*, u.Nombre AS Usuario_Nombre,
        t.Referencia AS Referencia_Pago_DEMO, t.Estado AS Estado_Pago_DEMO
      FROM pedidos p
      LEFT JOIN usuario u ON p.ID_Usuario = u.ID_Usuario
      LEFT JOIN transacciones_pago_demo t ON t.ID_Pedido = p.ID_Pedido
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
    const [rows] = await pool.query(
      `SELECT p.Estado, p.Metodo_Pago, t.Estado AS Estado_Pago_DEMO
       FROM pedidos p
       LEFT JOIN transacciones_pago_demo t ON t.ID_Pedido = p.ID_Pedido
       WHERE p.ID_Pedido = ?`,
      [id],
    );
    if (rows.length === 0) return false;
    const current = rows[0].Estado;
    if (current === 'cancelado' || current === 'entregado') {
      throw createOrderError(`Un pedido ${current} no admite cambios de estado`, 409);
    }
    if (current === estado) return true;
    if (isDemoPaymentMethod(rows[0].Metodo_Pago)
      && rows[0].Estado_Pago_DEMO !== 'aprobada_demo') {
      throw createOrderError('El pedido demo no tiene una transaccion simulada aprobada.', 409);
    }
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
        `SELECT p.Estado, p.Metodo_Pago, t.ID_Transaccion, t.Estado AS Estado_Pago_DEMO
         FROM pedidos p
         LEFT JOIN transacciones_pago_demo t ON t.ID_Pedido = p.ID_Pedido
         WHERE p.ID_Pedido = ? FOR UPDATE`,
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
      const demoReservedStock = isDemoPaymentMethod(orders[0].Metodo_Pago)
        && orders[0].Estado_Pago_DEMO === 'aprobada_demo';
      if (!isDemoPaymentMethod(orders[0].Metodo_Pago) || demoReservedStock) {
        for (const item of details) {
          await connection.query(
            'UPDATE productos SET Stock_Minimo = Stock_Minimo + ? WHERE ID_Producto = ?',
            [item.Cantidad, item.ID_Producto],
          );
        }
      }

      const [result] = await connection.query(
        "UPDATE pedidos SET Estado = 'cancelado', Motivo_Cancelacion = ? WHERE ID_Pedido = ?",
        [motivo, id],
      );
      if (demoReservedStock) {
        await connection.query(
          `UPDATE transacciones_pago_demo
           SET Estado = 'cancelada_demo'
           WHERE ID_Pedido = ? AND Estado = 'aprobada_demo'`,
          [id],
        );
      }

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
    const [rows] = await pool.query(
      `SELECT p.*, t.Referencia AS Referencia_Pago_DEMO, t.Estado AS Estado_Pago_DEMO
       FROM pedidos p
       LEFT JOIN transacciones_pago_demo t ON t.ID_Pedido = p.ID_Pedido
       WHERE p.ID_Pedido = ?`,
      [id],
    );
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

  /** Registra un intento DEMO con referencia e idempotencia por usuario. */
  async startDemoPayment({ userId, method, idempotencyKey }) {
    if (!isDemoPaymentsEnabled()) {
      throw createOrderError('La simulacion de pagos no esta habilitada.', 503);
    }
    if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
      throw createOrderError('Sesion de usuario invalida.', 401);
    }
    if (!['card', 'nequi'].includes(method)
      || typeof idempotencyKey !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
      throw createOrderError('Solicitud de simulacion invalida.', 400);
    }
    const paymentMethod = method === 'card' ? 'Tarjeta (DEMO)' : 'Nequi (DEMO)';
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE transacciones_pago_demo
         SET Estado = 'expirada_demo'
         WHERE ID_Usuario = ? AND Estado = 'iniciada_demo'
           AND Fecha_Creacion <= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 20 MINUTE)`,
        [Number(userId)],
      );
      await connection.query(
        `INSERT INTO transacciones_pago_demo
          (Clave_Idempotencia, Referencia, ID_Usuario, Metodo, Estado)
         VALUES (?, ?, ?, ?, 'iniciada_demo')
         ON DUPLICATE KEY UPDATE ID_Transaccion = LAST_INSERT_ID(ID_Transaccion)`,
        [idempotencyKey, `DEMO-${randomUUID()}`, Number(userId), paymentMethod],
      );
      const [rows] = await connection.query(
        `SELECT Referencia, Metodo, Estado
         FROM transacciones_pago_demo
         WHERE ID_Usuario = ? AND Clave_Idempotencia = ?`,
        [Number(userId), idempotencyKey],
      );
      if (rows.length === 0) throw createOrderError('No fue posible iniciar la simulacion.', 500);
      if (rows[0].Metodo !== paymentMethod) {
        throw createOrderError('La clave de idempotencia ya fue usada con otro metodo.', 409);
      }
      if (rows[0].Estado !== 'iniciada_demo' && rows[0].Estado !== 'aprobada_demo') {
        throw createOrderError('Esta simulacion ya fue cerrada; inicia una nueva.', 409);
      }
      return { reference: rows[0].Referencia, state: rows[0].Estado };
    } finally {
      connection.release();
    }
  },

  async cancelDemoPayment(reference, userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query(
        `SELECT Estado FROM transacciones_pago_demo
         WHERE Referencia = ? AND ID_Usuario = ? FOR UPDATE`,
        [reference, Number(userId)],
      );
      if (rows.length === 0) throw createOrderError('Simulacion no encontrada.', 404);
      if (rows[0].Estado === 'cancelada_demo') {
        await connection.commit();
        return true;
      }
      if (rows[0].Estado !== 'iniciada_demo') {
        throw createOrderError('La simulacion ya fue confirmada o vencio.', 409);
      }
      await connection.query(
        `UPDATE transacciones_pago_demo
         SET Estado = 'cancelada_demo'
         WHERE Referencia = ? AND ID_Usuario = ? AND Estado = 'iniciada_demo'`,
        [reference, Number(userId)],
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async confirmDemoPayment({ reference, userId, orderData }) {
    if (!isDemoPaymentsEnabled()) {
      throw createOrderError('La simulacion de pagos no esta habilitada.', 503);
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [transactions] = await connection.query(
        `SELECT ID_Transaccion, ID_Pedido, ID_Usuario, Metodo, Estado, Monto,
          (Fecha_Creacion <= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 20 MINUTE)) AS Expirada
         FROM transacciones_pago_demo
         WHERE Referencia = ? FOR UPDATE`,
        [reference],
      );
      if (transactions.length === 0 || Number(transactions[0].ID_Usuario) !== Number(userId)) {
        throw createOrderError('Simulacion no encontrada.', 404);
      }
      const transaction = transactions[0];
      if (transaction.Estado === 'aprobada_demo' && transaction.ID_Pedido) {
        await connection.commit();
        return {
          id: Number(transaction.ID_Pedido),
          reference,
          total: Number(transaction.Monto),
          existing: true,
        };
      }
      if (transaction.Estado !== 'iniciada_demo') {
        throw createOrderError('La simulacion ya fue cerrada o vencio.', 409);
      }
      if (Number(transaction.Expirada) === 1) {
        await connection.query(
          `UPDATE transacciones_pago_demo
           SET Estado = 'expirada_demo'
           WHERE ID_Transaccion = ? AND Estado = 'iniciada_demo'`,
          [transaction.ID_Transaccion],
        );
        await connection.commit();
        return { expired: true };
      }

      const { id, total } = await insertOrder(connection, {
        ...orderData,
        ID_Usuario: Number(userId),
      }, transaction.Metodo);
      const [update] = await connection.query(
        `UPDATE transacciones_pago_demo
         SET ID_Pedido = ?, Monto = ?, Estado = 'aprobada_demo'
         WHERE ID_Transaccion = ? AND Estado = 'iniciada_demo'`,
        [id, total, transaction.ID_Transaccion],
      );
      if (update.affectedRows !== 1) {
        throw createOrderError('La simulacion ya no esta disponible para confirmar.', 409);
      }
      await connection.commit();
      return { id, reference, total, existing: false };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async createWithDetails(data) {
    const payMethod = data?.Metodo_Pago ?? 'Efectivo';
    if (isDemoPaymentMethod(payMethod)) {
      throw createOrderError('Confirma los pagos demo mediante el flujo de simulacion.', 400);
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const order = await insertOrder(connection, data ?? {}, payMethod);
      await connection.commit();
      return order.id;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },
};

export default orderModel;
