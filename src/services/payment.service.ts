import type { CardPaymentData, PaymentResult, PaymentMethodType } from '../models';

export const paymentService = {
  async processCardPayment(data: CardPaymentData, amount: number): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      success: true,
      transactionId: `TXN-${Date.now()}`,
      message: `Pago por $${amount.toLocaleString('es-CO')} aprobado`,
    };
  },

  async processNequiPayment(phone: string, amount: number): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      transactionId: `NEQ-${Date.now()}`,
      message: `Solicitud de pago Nequi por $${amount.toLocaleString('es-CO')} enviada`,
    };
  },

  getMethodLabel(method: PaymentMethodType): string {
    return method === 'card' ? 'Tarjeta' : 'Nequi';
  },
};
