import type { CardPaymentData, PaymentResult, PaymentMethodType } from '../models';

const API = 'http://localhost:3001/api';

export const paymentService = {
  async processCardPayment(data: CardPaymentData, amount: number): Promise<PaymentResult> {
    const res = await fetch(`${API}/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardNumber: data.cardNumber,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
        amount,
      }),
    });

    const result = await res.json();
    return result;
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
