import assert from 'node:assert/strict';
import test from 'node:test';
import pool from '../config/db.js';
import unitModel from './unit.model.js';

test('renaming a unit updates product references in the same transaction', async () => {
  const originalGetConnection = pool.getConnection;
  const calls = [];
  const connection = {
    async beginTransaction() { calls.push('begin'); },
    async query(sql, values) { calls.push({ sql, values }); },
    async commit() { calls.push('commit'); },
    async rollback() { calls.push('rollback'); },
    release() { calls.push('release'); },
  };
  pool.getConnection = async () => connection;
  try {
    await unitModel.update(4, 'kg', 'g');
    assert.deepEqual(calls, [
      'begin',
      { sql: 'UPDATE productos SET Contenido_Unidad = ? WHERE Contenido_Unidad = ?', values: ['kg', 'g'] },
      { sql: 'UPDATE unidades_medida SET Nombre_Unidad = ? WHERE ID_Unidad = ?', values: ['kg', 4] },
      'commit',
      'release',
    ]);
  } finally {
    pool.getConnection = originalGetConnection;
  }
});

test('unit rename rolls back if a database update fails', async () => {
  const originalGetConnection = pool.getConnection;
  const calls = [];
  const connection = {
    async beginTransaction() { calls.push('begin'); },
    async query() { throw new Error('database failure'); },
    async commit() { calls.push('commit'); },
    async rollback() { calls.push('rollback'); },
    release() { calls.push('release'); },
  };
  pool.getConnection = async () => connection;
  try {
    await assert.rejects(unitModel.update(4, 'kg', 'g'), /database failure/);
    assert.deepEqual(calls, ['begin', 'rollback', 'release']);
  } finally {
    pool.getConnection = originalGetConnection;
  }
});
