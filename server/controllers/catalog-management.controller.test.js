import assert from 'node:assert/strict';
import test from 'node:test';
import categoryController from './category.controller.js';
import unitController from './unit.controller.js';
import categoryModel from '../models/category.model.js';
import unitModel from '../models/unit.model.js';

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('category management rejects duplicate names', async () => {
  const originalFindByName = categoryModel.findByName;
  categoryModel.findByName = async () => ({ ID_Categoria: 1 });
  try {
    const res = response();
    await categoryController.create({ body: { Nombre_Categoria: 'Frutas' } }, res);
    assert.equal(res.statusCode, 409);
    assert.match(res.body.error, /Ya existe/);
  } finally {
    categoryModel.findByName = originalFindByName;
  }
});

test('category management refuses deleting a category linked to products', async () => {
  const originalFindAll = categoryModel.findAll;
  const originalRemove = categoryModel.remove;
  categoryModel.findAll = async () => [{ ID_Categoria: 2, Nombre_Categoria: 'Frutas' }];
  categoryModel.remove = async () => {
    const error = new Error('foreign key');
    error.code = 'ER_ROW_IS_REFERENCED_2';
    throw error;
  };
  try {
    const res = response();
    await categoryController.remove({ params: { id: '2' } }, res);
    assert.equal(res.statusCode, 409);
    assert.match(res.body.error, /productos asociados/);
  } finally {
    categoryModel.findAll = originalFindAll;
    categoryModel.remove = originalRemove;
  }
});

test('unit management refuses deleting a unit used by products', async () => {
  const originalFindAll = unitModel.findAll;
  const originalRemove = unitModel.remove;
  unitModel.findAll = async () => [{ ID_Unidad: 1, Nombre_Unidad: 'g' }];
  unitModel.remove = async () => {
    const error = new Error('No se puede eliminar: hay productos que usan esta unidad.');
    error.code = 'UNIT_IN_USE';
    throw error;
  };
  try {
    const res = response();
    await unitController.remove({ params: { id: '1' } }, res);
    assert.equal(res.statusCode, 409);
    assert.match(res.body.error, /productos que usan/);
  } finally {
    unitModel.findAll = originalFindAll;
    unitModel.remove = originalRemove;
  }
});

test('unit update rejects repeated names before changing product values', async () => {
  const originalFindAll = unitModel.findAll;
  const originalFindByName = unitModel.findByName;
  const originalUpdate = unitModel.update;
  let updated = false;
  unitModel.findAll = async () => [{ ID_Unidad: 1, Nombre_Unidad: 'g' }];
  unitModel.findByName = async () => ({ ID_Unidad: 2 });
  unitModel.update = async () => { updated = true; };
  try {
    const res = response();
    await unitController.update({ params: { id: '1' }, body: { Nombre_Unidad: 'kg' } }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(updated, false);
  } finally {
    unitModel.findAll = originalFindAll;
    unitModel.findByName = originalFindByName;
    unitModel.update = originalUpdate;
  }
});
