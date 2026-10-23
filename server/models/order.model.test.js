import assert from 'node:assert/strict';
import test from 'node:test';
import pool from '../config/db.js';
import orderModel from './order.model.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const REFERENCE = `DEMO-${UUID}`;

function setDemoMode() {
  const previousMode = process.env.PAYMENTS_MODE;
  process.env.PAYMENTS_MODE = 'demo';
  return () => {
    if (previousMode === undefined) delete process.env.PAYMENTS_MODE;
    else process.env.PAYMENTS_MODE = previousMode;
  };
}

function createConnection(queryHandler) {
  const queries = [];
  const events = [];
  return {
    queries,
    events,
    async beginTransaction() { events.push('begin'); },
    async commit() { events.push('commit'); },
    async rollback() { events.push('rollback'); },
    release() { events.push('release'); },
    async query(sql, parameters) {
      queries.push({ sql, parameters });
      if (sql.includes("AS total FROM pedidos WHERE ID_Usuario = ? AND Estado = 'pendiente'")) {
        return [[{ total: pendingOrders }], []];
      }
      return queryHandler(sql, parameters);
    },
  };
}

/** Pedidos pendientes que reporta la conexion simulada (tope anti-abuso). */
let pendingOrders = 0;

test('starting a demo payment persists an idempotent reference without an amount', async () => {
  const restoreMode = setDemoMode();
  const originalGetConnection = pool.getConnection;
  const connection = createConnection((sql) => {
    if (sql.includes("SET Estado = 'expirada_demo'")) return [{ affectedRows: 0 }, []];
    if (sql.includes('INSERT INTO transacciones_pago_demo')) return [{ affectedRows: 1 }, []];
    if (sql.includes('SELECT Referencia, Metodo, Estado')) {
      return [[{ Referencia: REFERENCE, Metodo: 'Nequi (DEMO)', Estado: 'iniciada_demo' }], []];
    }
    throw new Error(`Consulta inesperada: ${sql}`);
  });
  pool.getConnection = async () => connection;
  try {
    const transaction = await orderModel.startDemoPayment({
      userId: 1,
      method: 'nequi',
      idempotencyKey: UUID,
    });

    assert.deepEqual(transaction, { reference: REFERENCE, state: 'iniciada_demo' });
    const insert = connection.queries.find(({ sql }) => sql.includes('INSERT INTO transacciones_pago_demo'));
    assert.match(insert.sql, /ON DUPLICATE KEY UPDATE/);
    assert.equal(insert.parameters[0], UUID);
    assert.equal(insert.parameters[2], 1);
    assert.equal(insert.parameters[3], 'Nequi (DEMO)');
    assert.equal(insert.parameters.length, 4);
  } finally {
    pool.getConnection = originalGetConnection;
    restoreMode();
  }
});

test('demo confirmation atomically creates the order, transaction and stock reservation', async () => {
  const restoreMode = setDemoMode();
  const originalGetConnection = pool.getConnection;
  const connection = createConnection((sql) => {
    if (sql.includes('SELECT ID_Transaccion, ID_Pedido')) {
      return [[{
        ID_Transaccion: 3,
        ID_Pedido: null,
        ID_Usuario: 1,
        Metodo: 'Tarjeta (DEMO)',
        Estado: 'iniciada_demo',
        Fecha_Creacion: new Date(),
      }], []];
    }
    if (sql.includes('SELECT Nombre, Precio_Venta')) {
      return [[{ Nombre: 'Producto demo', Precio_Venta: 1000, Stock_Minimo: 5 }], []];
    }
    if (sql.includes('INSERT INTO pedidos')) return [{ insertId: 41 }, []];
    if (sql.includes('INSERT INTO detalle_pedido')) return [{ affectedRows: 1 }, []];
    if (sql.includes('UPDATE productos SET Stock_Minimo = Stock_Minimo -')) return [{ affectedRows: 1 }, []];
    if (sql.includes('UPDATE transacciones_pago_demo')) return [{ affectedRows: 1 }, []];
    throw new Error(`Consulta inesperada: ${sql}`);
  });
  pool.getConnection = async () => connection;
  try {
    const result = await orderModel.confirmDemoPayment({
      reference: REFERENCE,
      userId: 1,
      orderData: { productos: [{ ID_Producto: 'P001', Cantidad: 2 }] },
    });

    assert.deepEqual(result, { id: 41, reference: REFERENCE, total: 2000, existing: false });
    assert.deepEqual(connection.events, ['begin', 'commit', 'release']);
    const orderInsert = connection.queries.find(({ sql }) => sql.includes('INSERT INTO pedidos'));
    assert.equal(orderInsert.parameters[10], 'Tarjeta (DEMO)');
    assert.ok(connection.queries.some(({ sql }) => sql.includes('UPDATE productos SET Stock_Minimo = Stock_Minimo -')));
    const paymentUpdate = connection.queries.find(({ sql }) => sql.includes('UPDATE transacciones_pago_demo'));
    assert.equal(paymentUpdate.parameters[0], 41);
    assert.equal(paymentUpdate.parameters[1], 2000);
  } finally {
    pool.getConnection = originalGetConnection;
    restoreMode();
  }
});

test('cash order creation still persists the order and deducts stock', async () => {
  const originalGetConnection = pool.getConnection;
  const connection = createConnection((sql) => {
    if (sql.includes('SELECT Nombre, Precio_Venta')) {
      return [[{ Nombre: 'Producto demo', Precio_Venta: 1000, Stock_Minimo: 5 }], []];
    }
    if (sql.includes('INSERT INTO pedidos')) return [{ insertId: 51 }, []];
    if (sql.includes('INSERT INTO detalle_pedido')) return [{ affectedRows: 1 }, []];
    if (sql.includes('UPDATE productos SET Stock_Minimo = Stock_Minimo -')) return [{ affectedRows: 1 }, []];
    throw new Error(`Consulta inesperada: ${sql}`);
  });
  pool.getConnection = async () => connection;
  try {
    const id = await orderModel.createWithDetails({
      ID_Usuario: 1,
      Metodo_Pago: 'Efectivo',
      Monto_Recibido: 1500,
      Cambio: 500,
      productos: [{ ID_Producto: 'P001', Cantidad: 1 }],
    });
    assert.equal(id, 51);
    assert.ok(connection.queries.some(({ sql }) => sql.includes('UPDATE productos SET Stock_Minimo = Stock_Minimo -')));
    assert.deepEqual(connection.events, ['begin', 'commit', 'release']);
  } finally {
    pool.getConnection = originalGetConnection;
  }
});

test('cash orders compute the change on the server and ignore the client date', async () => {
  const originalGetConnection = pool.getConnection;
  const connection = createConnection((sql) => {
    if (sql.includes('SELECT Nombre, Precio_Venta')) {
      return [[{ Nombre: 'Producto demo', Precio_Venta: 1000, Stock_Minimo: 5 }], []];
    }
    if (sql.includes('INSERT INTO pedidos')) return [{ insertId: 52 }, []];
    if (sql.includes('INSERT INTO detalle_pedido')) return [{ affectedRows: 1 }, []];
    if (sql.includes('UPDATE productos SET Stock_Minimo = Stock_Minimo -')) return [{ affectedRows: 1 }, []];
    throw new Error(`Consulta inesperada: ${sql}`);
  });
  pool.getConnection = async () => connection;
  try {
    await orderModel.createWithDetails({
      ID_Usuario: 1,
      Metodo_Pago: 'Efectivo',
      Fecha: '1999-01-01',
      Monto_Recibido: 5000,
      Cambio: 999999,
      productos: [{ ID_Producto: 'P001', Cantidad: 2 }],
    });
    const insert = connection.queries.find(({ sql }) => sql.includes('INSERT INTO pedidos'));
    assert.notEqual(insert.parameters[0], '1999-01-01');
    assert.equal(insert.parameters[2], 2000);
    assert.equal(insert.parameters[12], 3000);
  } finally {
    pool.getConnection = originalGetConnection;
  }
});

test('orders over the per-product cap or the pending limit are rejected', async () => {
  const originalGetConnection = pool.getConnection;
  const connection = createConnection((sql) => {
    throw new Error(`La validacion debia rechazar antes de consultar: ${sql}`);
  });
  pool.getConnection = async () => connection;
  try {
    await assert.rejects(
      orderModel.createWithDetails({
        ID_Usuario: 1,
        Metodo_Pago: 'Efectivo',
        productos: [{ ID_Producto: 'P001', Cantidad: 30 }, { ID_Producto: 'P001', Cantidad: 21 }],
      }),
      (error) => error.statusCode === 400 && /como maximo 50 unidades/.test(error.message),
    );
    pendingOrders = 5;
    await assert.rejects(
      orderModel.createWithDetails({
        ID_Usuario: 1,
        Metodo_Pago: 'Efectivo',
        productos: [{ ID_Producto: 'P001', Cantidad: 1 }],
      }),
      (error) => error.statusCode === 429,
    );
  } finally {
    pendingOrders = 0;
    pool.getConnection = originalGetConnection;
  }
});

test('order delivery fields reject invalid phone and non-numeric apartment data', async () => {
  const originalGetConnection = pool.getConnection;
  const connection = createConnection(() => {
    throw new Error('La validacion debe ocurrir antes de consultar la base de datos.');
  });
  pool.getConnection = async () => connection;
  try {
    for (const invalidData of [
      { Telefono: '300123456', Torre: '1', Piso: '4', Apartamento: '401' },
      { Telefono: '3001234567', Torre: '1', Piso: '4', Apartamento: '4A' },
    ]) {
      await assert.rejects(
        orderModel.createWithDetails({
          ID_Usuario: 1,
          Metodo_Pago: 'Efectivo',
          productos: [{ ID_Producto: 'P001', Cantidad: 1 }],
          ...invalidData,
        }),
        (error) => error.statusCode === 400,
      );
    }
    assert.equal(connection.queries.length, 0);
    assert.deepEqual(connection.events, [
      'begin', 'rollback', 'release',
      'begin', 'rollback', 'release',
    ]);
  } finally {
    pool.getConnection = originalGetConnection;
  }
});

test('confirmation retry returns the existing order without reserving stock twice', async () => {
  const restoreMode = setDemoMode();
  const originalGetConnection = pool.getConnection;
  const connection = createConnection((sql) => {
    if (sql.includes('SELECT ID_Transaccion, ID_Pedido')) {
      return [[{
        ID_Transaccion: 3,
        ID_Pedido: 41,
        ID_Usuario: 1,
        Metodo: 'Nequi (DEMO)',
        Estado: 'aprobada_demo',
        Monto: 2000,
      }], []];
    }
    throw new Error(`La repeticion no debia escribir: ${sql}`);
  });
  pool.getConnection = async () => connection;
  try {
    const result = await orderModel.confirmDemoPayment({
      reference: REFERENCE,
      userId: 1,
      orderData: { productos: [{ ID_Producto: 'P001', Cantidad: 2 }] },
    });
    assert.deepEqual(result, { id: 41, reference: REFERENCE, total: 2000, existing: true });
    assert.deepEqual(connection.events, ['begin', 'commit', 'release']);
  } finally {
    pool.getConnection = originalGetConnection;
    restoreMode();
  }
});

test('stock failure rolls back without approving or persisting the transaction', async () => {
  const restoreMode = setDemoMode();
  const originalGetConnection = pool.getConnection;
  const connection = createConnection((sql) => {
    if (sql.includes('SELECT ID_Transaccion, ID_Pedido')) {
      return [[{
        ID_Transaccion: 3,
        ID_Pedido: null,
        ID_Usuario: 1,
        Metodo: 'Nequi (DEMO)',
        Estado: 'iniciada_demo',
        Fecha_Creacion: new Date(),
      }], []];
    }
    if (sql.includes('SELECT Nombre, Precio_Venta')) {
      return [[{ Nombre: 'Producto demo', Precio_Venta: 1000, Stock_Minimo: 1 }], []];
    }
    throw new Error(`Consulta inesperada: ${sql}`);
  });
  pool.getConnection = async () => connection;
  try {
    await assert.rejects(
      orderModel.confirmDemoPayment({
        reference: REFERENCE,
        userId: 1,
        orderData: { productos: [{ ID_Producto: 'P001', Cantidad: 2 }] },
      }),
      (error) => error.statusCode === 409 && /Stock insuficiente/.test(error.message),
    );
    assert.deepEqual(connection.events, ['begin', 'rollback', 'release']);
    assert.ok(!connection.queries.some(({ sql }) => sql.includes('INSERT INTO pedidos')));
    assert.ok(!connection.queries.some(({ sql }) => sql.includes("SET ID_Pedido = ?")));
  } finally {
    pool.getConnection = originalGetConnection;
    restoreMode();
  }
});

test('expired demo attempts are closed without creating an order', async () => {
  const restoreMode = setDemoMode();
  const originalGetConnection = pool.getConnection;
  const connection = createConnection((sql) => {
    if (sql.includes('SELECT ID_Transaccion, ID_Pedido')) {
      return [[{
        ID_Transaccion: 3,
        ID_Pedido: null,
        ID_Usuario: 1,
        Metodo: 'Nequi (DEMO)',
        Estado: 'iniciada_demo',
        Expirada: 1,
      }], []];
    }
    if (sql.includes("SET Estado = 'expirada_demo'")) return [{ affectedRows: 1 }, []];
    throw new Error(`Consulta inesperada: ${sql}`);
  });
  pool.getConnection = async () => connection;
  try {
    const result = await orderModel.confirmDemoPayment({
      reference: REFERENCE,
      userId: 1,
      orderData: { productos: [{ ID_Producto: 'P001', Cantidad: 1 }] },
    });
    assert.deepEqual(result, { expired: true });
    assert.deepEqual(connection.events, ['begin', 'commit', 'release']);
    assert.ok(!connection.queries.some(({ sql }) => sql.includes('INSERT INTO pedidos')));
  } finally {
    pool.getConnection = originalGetConnection;
    restoreMode();
  }
});

test('only a newly approved demo transaction can progress through fulfillment', async () => {
  const originalQuery = pool.query;
  const updates = [];
  pool.query = async (sql) => {
    if (sql.includes('SELECT p.Estado, p.Metodo_Pago')) {
      return [[{ Estado: 'pendiente', Metodo_Pago: 'Nequi (DEMO)', Estado_Pago_DEMO: 'aprobada_demo' }], []];
    }
    updates.push(sql);
    return [{ affectedRows: 1 }, []];
  };
  try {
    assert.equal(await orderModel.updateStatus(41, 'preparando'), true);
    assert.ok(updates.some((sql) => sql.includes('UPDATE pedidos')));

    pool.query = async (sql) => {
      if (sql.includes('SELECT p.Estado, p.Metodo_Pago')) {
        return [[{ Estado: 'pendiente', Metodo_Pago: 'Nequi (DEMO)', Estado_Pago_DEMO: null }], []];
      }
      throw new Error('Un pedido demo historico no debe avanzar.');
    };
    await assert.rejects(
      orderModel.updateStatus(40, 'preparando'),
      (error) => error.statusCode === 409 && /transaccion simulada aprobada/.test(error.message),
    );
  } finally {
    pool.query = originalQuery;
  }
});

test('cancelling an approved demo order restores reserved stock and closes its transaction', async () => {
  const originalGetConnection = pool.getConnection;
  const connection = createConnection((sql) => {
    if (sql.includes('SELECT p.Estado, p.Metodo_Pago')) {
      return [[{
        Estado: 'pendiente',
        Metodo_Pago: 'Tarjeta (DEMO)',
        ID_Transaccion: 3,
        Estado_Pago_DEMO: 'aprobada_demo',
      }], []];
    }
    if (sql.includes('SELECT ID_Producto, Cantidad')) return [[{ ID_Producto: 'P001', Cantidad: 1 }], []];
    if (sql.includes('UPDATE productos SET Stock_Minimo = Stock_Minimo +')) return [{ affectedRows: 1 }, []];
    if (sql.includes("UPDATE pedidos SET Estado = 'cancelado'")) return [{ affectedRows: 1 }, []];
    if (sql.includes("SET Estado = 'cancelada_demo'")) return [{ affectedRows: 1 }, []];
    throw new Error(`Consulta inesperada: ${sql}`);
  });
  pool.getConnection = async () => connection;
  try {
    assert.equal(await orderModel.cancelById(41, 'Prueba demo', 'admin', 1), true);
    assert.ok(connection.queries.some(({ sql }) => sql.includes('UPDATE productos SET Stock_Minimo = Stock_Minimo +')));
    assert.ok(connection.queries.some(({ sql }) => sql.includes("SET Estado = 'cancelada_demo'")));
    assert.deepEqual(connection.events, ['begin', 'commit', 'release']);
  } finally {
    pool.getConnection = originalGetConnection;
  }
});
