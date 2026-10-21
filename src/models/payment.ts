/**
 * @fileoverview Modelos de pagos.
 * Contratos intercambiados con el servicio/backend de pagos.
 */

/** Estado de la accion de checkout y referencia de pasarela opcional. */
export interface PaymentResult {
  /** Indica si se completó la acción del flujo, no que se haya liquidado un pago contra entrega. */
  success: boolean;
  /** Identificador emitido por una pasarela verificada, si existe. */
  transactionId?: string;
  /** Identificador de simulacion que no representa una transaccion ni un cobro. */
  simulationId?: string;
  /** Indica que el flujo fue simulado. */
  simulated?: boolean;
  /** Indica si el proveedor confirmo un pago real. */
  paid?: boolean;
  /** Mensaje legible del resultado. */
  message: string;
}

export type PaymentMode = 'demo' | 'disabled';
export type PaymentModeState = PaymentMode | 'loading' | 'error';
