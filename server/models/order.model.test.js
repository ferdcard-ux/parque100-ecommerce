import assert from 'node:assert/strict';
import test from 'node:test';
import pool from '../config/db.js';
import orderModel from './order.model.js';

function setDemoMode() {
  const previousMode = process.env.PAYMENTS_MODE;
  process.env.PAYMENTS_MODE = 'demo';
  return () => {
    if (previousMode === undefined) delete process.env.PAYMENTS_MODE;
    else process.env.PAYMENTS_MODE = previousMode;
  };
}

test('demo order records its method without reserving inventory', async () => {
  const restoreMode = setDemoMode();
  const originalGetConnection = pool.getConnection;
  const queries = [];
  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async query(sql, parameters) {
      queries.push({ sql, parameters });
      if (sql.includes('SELECT Nombre, Precio_Venta')) {
        return [[{ Nombre: 'Producto demo', Precio_Venta: 1000, Stock_Minimo: 5 }], []];
      }
      if (sql.includes('INSERT INTO pedidos')) return [{ insertId: 41 }, []];
      if (sql.includes('INSERT INTO detalle_pedido')) return [{ affectedRows: 1 }, []];
      throw new Error(`Consulta inesperada: ${sql}`);
    },
  };

  pool.getConnection = async () => connection;
  try {
    const id = await orderModel.createWithDetails({
      ID_Usuario: 1,
      Metodo_Pago: 'Tarjeta (DEMO)',
      productos: [{ ID_Producto: 'P001', Cantidad: 1 }],
    });

    assert.equal(id, 41);
    const orderInsert = queries.find(({ sql }) => sql.includes('INSERT INTO pedidos'));
    assert.ok(orderInsert);
    assert.equal(orderInsert.parameters[10], 'Tarjeta (DEMO)');
    assert.ok(!queries.some(({ sql }) => sql.includes('UPDATE productos')));
  } finally {
    pool.getConnection = originalGetConnection;
    restoreMode();
  }
});

test('demo orders cannot advance to fulfillment', async () => {
  const originalQuery = pool.query;
  let updateQueries = 0;
  pool.query = async (sql) => {
    if (sql.includes('SELECT Estado, Metodo_Pago')) {
      return [[{ Estado: 'pendiente', Metodo_Pago: 'Nequi (DEMO)' }], []];
    }
    updateQueries += 1;
    return [{ affectedRows: 1 }, []];
  };

  try {
    await assert.rejects(
      orderModel.updateStatus(41, 'preparando'),
      (error) => error.statusCode === 409 && /simulacion/.test(error.message),
    );
    assert.equal(updateQueries, 0);
  } finally {
    pool.query = originalQuery;
  }
});

test('cancelling a demo order does not restore or change inventory', async () => {
  const originalGetConnection = pool.getConnection;
  const queries = [];
  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async query(sql, parameters) {
      queries.push({ sql, parameters });
      if (sql.includes('SELECT Estado, Metodo_Pago')) {
        return [[{ Estado: 'pendiente', Metodo_Pago: 'Tarjeta (DEMO)' }], []];
      }
      if (sql.includes('SELECT ID_Producto, Cantidad')) {
        return [[{ ID_Producto: 'P001', Cantidad: 1 }], []];
      }
      if (sql.includes("UPDATE pedidos SET Estado = 'cancelado'")) {
        return [{ affectedRows: 1 }, []];
      }
      throw new Error(`Consulta inesperada: ${sql}`);
    },
  };
  pool.getConnection = async () => connection;

  try {
    assert.equal(await orderModel.cancelById(41, 'Prueba demo', 'admin', 1), true);
    assert.ok(!queries.some(({ sql }) => sql.includes('UPDATE productos')));
  } finally {
    pool.getConnection = originalGetConnection;
  }
});
