/**
 * @fileoverview Consulta del modo y simulacion de pagos demo.
 */
import type { PaymentMode, PaymentMethodType, PaymentResult } from '../models';
import { API_BASE as API, authHeaders } from './api';

export const paymentService = {
  async getMode(): Promise<PaymentMode> {
    const response = await fetch(`${API}/payments/mode`, { cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok || (data?.mode !== 'demo' && data?.mode !== 'disabled')) {
      throw new Error('No fue posible verificar el modo de pagos.');
    }
    return data.mode;
  },

  async simulate(method: Exclude<PaymentMethodType, 'cash'>): Promise<PaymentResult> {
    const response = await fetch(`${API}/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ method }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || 'No fue posible ejecutar la simulacion.');
    }
    if (data?.mode !== 'demo' || data?.simulated !== true || data?.paid !== false
      || typeof data?.simulationId !== 'string') {
      throw new Error('El servidor devolvio un resultado de pago inesperado.');
    }
    return {
      success: true,
      simulated: true,
      paid: false,
      simulationId: data.simulationId,
      message: typeof data.message === 'string' ? data.message : 'Simulacion completada; no hubo cobro.',
    };
  },
};
