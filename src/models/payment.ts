export interface CardPaymentData {
  cardNumber: string;
  holder: string;
  expiry: string;
  cvv: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
}
