import assert from 'node:assert/strict';
import test from 'node:test';
import activityController from './activity.controller.js';

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

test('activity endpoint rejects unknown fields and unapproved client events', async () => {
  const invalidBodies = [
    { event: 'cart.add', resourceId: 7, password: 'must-not-log' },
    { event: 'user.login', resourceId: 7 },
    { event: 'cart.add', resourceId: '../private' },
    { event: 'session.logout', resourceId: 7 },
  ];

  for (const body of invalidBodies) {
    const res = response();
    await activityController.recordInteraction({ body }, res);
    assert.equal(res.statusCode, 400);
  }
});
