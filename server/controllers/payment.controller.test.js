import assert from 'node:assert/strict';
import test from 'node:test';
import paymentController from './payment.controller.js';

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

test('payment simulation returns an unpaid demo result without payment details', async () => {
  const previousMode = process.env.PAYMENTS_MODE;
  process.env.PAYMENTS_MODE = 'demo';
  try {
    const response = createResponse();
    await paymentController.process({ body: { method: 'card' } }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.mode, 'demo');
    assert.equal(response.body.simulated, true);
    assert.equal(response.body.paid, false);
    assert.match(response.body.simulationId, /^DEMO-/);
    assert.equal('transactionId' in response.body, false);
  } finally {
    if (previousMode === undefined) delete process.env.PAYMENTS_MODE;
    else process.env.PAYMENTS_MODE = previousMode;
  }
});

test('payment simulation rejects card data and unsupported methods', async () => {
  const previousMode = process.env.PAYMENTS_MODE;
  process.env.PAYMENTS_MODE = 'demo';
  try {
    const cardDataResponse = createResponse();
    await paymentController.process({
      body: { method: 'card', cardNumber: '4111111111111111', cvv: '123' },
    }, cardDataResponse);
    assert.equal(cardDataResponse.statusCode, 400);

    const methodResponse = createResponse();
    await paymentController.process({ body: { method: 'cash' } }, methodResponse);
    assert.equal(methodResponse.statusCode, 400);
  } finally {
    if (previousMode === undefined) delete process.env.PAYMENTS_MODE;
    else process.env.PAYMENTS_MODE = previousMode;
  }
});

test('payment simulation remains disabled unless explicitly enabled', async () => {
  const previousMode = process.env.PAYMENTS_MODE;
  delete process.env.PAYMENTS_MODE;
  try {
    const response = createResponse();
    await paymentController.process({ body: { method: 'nequi' } }, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.paid, false);
  } finally {
    if (previousMode !== undefined) process.env.PAYMENTS_MODE = previousMode;
  }
});
