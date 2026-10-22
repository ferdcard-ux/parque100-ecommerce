/** Identifica pedidos claramente marcados por el servidor como demo. */
export function isDemoPaymentMethod(method?: string | null): boolean {
  return method === 'Tarjeta (DEMO)' || method === 'Nequi (DEMO)';
}

export function isApprovedDemoPayment(method?: string | null, state?: string | null): boolean {
  return isDemoPaymentMethod(method) && state === 'aprobada_demo';
}
