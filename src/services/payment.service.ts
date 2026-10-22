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

  async startSimulation(
    method: Exclude<PaymentMethodType, 'cash'>,
    idempotencyKey: string,
  ): Promise<PaymentResult> {
    const response = await fetch(`${API}/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ method, idempotencyKey }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || 'No fue posible iniciar la simulacion.');
    }
    if (data?.mode !== 'demo' || data?.simulated !== true || data?.paid !== false
      || typeof data?.simulationId !== 'string'
      || !['iniciada_demo', 'aprobada_demo'].includes(data?.state)) {
      throw new Error('El servidor devolvio un estado de simulacion inesperado.');
    }
    return {
      success: true,
      simulated: true,
      paid: false,
      simulationId: data.simulationId,
      message: typeof data.message === 'string' ? data.message : 'Simulacion iniciada; no hubo cobro.',
    };
  },

  async cancelSimulation(simulationId: string): Promise<void> {
    const response = await fetch(`${API}/payments/${encodeURIComponent(simulationId)}/cancel`, {
      method: 'PUT',
      headers: authHeaders(),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success !== true) {
      throw new Error(data?.error || 'No fue posible cerrar la simulacion.');
    }
  },
};
