export const DEMO_PAYMENT_METHODS = Object.freeze({
  card: 'Tarjeta (DEMO)',
  nequi: 'Nequi (DEMO)',
});

export function getPaymentMode() {
  return process.env.PAYMENTS_MODE === 'demo' ? 'demo' : 'disabled';
}

export function isDemoPaymentsEnabled() {
  return getPaymentMode() === 'demo';
}

export function isDemoPaymentMethod(method) {
  return Object.values(DEMO_PAYMENT_METHODS).includes(method);
}
