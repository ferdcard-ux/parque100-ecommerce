import assert from 'node:assert/strict';
import test from 'node:test';
import orderModel from '../models/order.model.js';
import orderController from './order.controller.js';
import paymentController from './payment.controller.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const REFERENCE = `DEMO-${UUID}`;

function createResponse() {
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
    setHeader() {},
  };
}

function setDemoMode() {
  const previousMode = process.env.PAYMENTS_MODE;
  process.env.PAYMENTS_MODE = 'demo';
  return () => {
    if (previousMode === undefined) delete process.env.PAYMENTS_MODE;
    else process.env.PAYMENTS_MODE = previousMode;
  };
}

test('payment start stores a server-generated DEMO reference and never marks it paid', async () => {
  const restoreMode = setDemoMode();
  const originalStart = orderModel.startDemoPayment;
  let received;
  orderModel.startDemoPayment = async (data) => {
    received = data;
    return { reference: REFERENCE, state: 'iniciada_demo' };
  };
  try {
    const response = createResponse();
    await paymentController.process({
      user: { id: 7 },
      body: { method: 'card', idempotencyKey: UUID },
    }, response);

    assert.equal(response.statusCode, 201);
    assert.deepEqual(received, { userId: 7, method: 'card', idempotencyKey: UUID });
    assert.equal(response.body.mode, 'demo');
    assert.equal(response.body.paid, false);
    assert.equal(response.body.simulationId, REFERENCE);
    assert.equal(response.body.state, 'iniciada_demo');
  } finally {
    orderModel.startDemoPayment = originalStart;
    restoreMode();
  }
});

test('payment endpoints reject card, transfer, receipt and client amount data', async () => {
  const restoreMode = setDemoMode();
  const originalStart = orderModel.startDemoPayment;
  orderModel.startDemoPayment = async () => {
    throw new Error('Sensitive request reached persistence');
  };
  try {
    for (const extra of [
      { cardNumber: '4111111111111111' },
      { cvv: '123' },
      { amount: 1000 },
      { receipt: 'data:image/png;base64,not-a-real-receipt' },
    ]) {
      const response = createResponse();
      await paymentController.process({
        user: { id: 7 },
        body: { method: 'card', idempotencyKey: UUID, ...extra },
      }, response);
      assert.equal(response.statusCode, 400);
    }

    const confirmResponse = createResponse();
    await paymentController.confirm({
      user: { id: 7 },
      body: {
        simulationId: REFERENCE,
        order: {
          productos: [{ ID_Producto: 'P001', Cantidad: 1 }],
          cardNumber: '4111111111111111',
        },
      },
    }, confirmResponse);
    assert.equal(confirmResponse.statusCode, 400);
  } finally {
    orderModel.startDemoPayment = originalStart;
    restoreMode();
  }
});

test('payment confirmation returns a persisted order and remains financially unpaid', async () => {
  const restoreMode = setDemoMode();
  const originalConfirm = orderModel.confirmDemoPayment;
  let received;
  orderModel.confirmDemoPayment = async (data) => {
    received = data;
    return { id: 42, reference: REFERENCE, total: 3200, existing: false };
  };
  try {
    const response = createResponse();
    const order = {
      Tipo_Entrega: 'domicilio',
      Destinatario: 'Usuario demo',
      productos: [{ ID_Producto: 'P001', Cantidad: 1 }],
    };
    await paymentController.confirm({
      user: { id: 7 },
      body: { simulationId: REFERENCE, order },
    }, response);

    assert.equal(response.statusCode, 201);
    assert.deepEqual(received, { reference: REFERENCE, userId: 7, orderData: order });
    assert.equal(response.body.id, 42);
    assert.equal(response.body.total, 3200);
    assert.equal(response.body.approvedDemo, true);
    assert.equal(response.body.paid, false);
  } finally {
    orderModel.confirmDemoPayment = originalConfirm;
    restoreMode();
  }
});

test('electronic demo payments stay disabled unless explicitly enabled', async () => {
  const previousMode = process.env.PAYMENTS_MODE;
  delete process.env.PAYMENTS_MODE;
  try {
    const response = createResponse();
    await paymentController.process({
      user: { id: 7 },
      body: { method: 'nequi', idempotencyKey: UUID },
    }, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.paid, false);
  } finally {
    if (previousMode !== undefined) process.env.PAYMENTS_MODE = previousMode;
  }
});

test('demo orders cannot bypass the payment simulation endpoint', async () => {
  const restoreMode = setDemoMode();
  const originalCreate = orderModel.createWithDetails;
  orderModel.createWithDetails = async () => {
    throw new Error('Direct demo order reached persistence');
  };
  try {
    const response = createResponse();
    await orderController.create({
      user: { id: 7 },
      body: {
        Metodo_Pago: 'Tarjeta (DEMO)',
        productos: [{ ID_Producto: 'P001', Cantidad: 1 }],
      },
    }, response);
    assert.equal(response.statusCode, 400);
    assert.match(response.body.error, /flujo \/api\/payments/);
  } finally {
    orderModel.createWithDetails = originalCreate;
    restoreMode();
  }
});
