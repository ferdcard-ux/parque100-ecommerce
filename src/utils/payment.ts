/** Identifica pedidos claramente marcados por el servidor como demo. */
export function isDemoPaymentMethod(method?: string | null): boolean {
  return method === 'Tarjeta (DEMO)' || method === 'Nequi (DEMO)';
}
