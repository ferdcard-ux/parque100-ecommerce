/**
 * @fileoverview Modelos de pagos.
 * Contratos intercambiados con el servicio/backend de pagos.
 */

/** Estado del checkout; la referencia DEMO es interna y no representa pago real. */
export interface PaymentResult {
  /** Indica si se completo la accion del flujo, no que exista un cobro real. */
  success: boolean;
  /** Identificador de una pasarela verificada, si se integra en el futuro. */
  transactionId?: string;
  /** Referencia ficticia persistida en la base de datos academica. */
  simulationId?: string;
  /** Indica que el flujo fue simulado. */
  simulated?: boolean;
  /** Indica si se liquido un pago real; permanece en false para simulaciones. */
  paid?: boolean;
  /** Mensaje legible del resultado. */
  message: string;
}

export type PaymentMode = 'demo' | 'disabled';
export type PaymentModeState = PaymentMode | 'loading' | 'error';
