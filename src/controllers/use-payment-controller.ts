import { useState, useCallback } from 'react';
import type {
  PaymentMethodType,
  CardPaymentData,
  DeliveryAddress,
  CartItem,
  PaymentResult,
} from '../models';
import { paymentService, orderService } from '../services';

export function usePaymentController() {
  const [method, setMethod] = useState<PaymentMethodType | null>(null);
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const selectMethod = useCallback((m: PaymentMethodType) => {
    setMethod(m);
  }, []);

  const saveAddress = useCallback((addr: DeliveryAddress) => {
    setAddress(addr);
  }, []);

  const processPayment = useCallback(
    async (
      cardData: CardPaymentData,
      amount: number,
      items: CartItem[]
    ) => {
      setIsProcessing(true);
      try {
        const paymentResult = await paymentService.processCardPayment(
          cardData,
          amount
        );
        setResult(paymentResult);

        if (address && method) {
          await orderService.create(items, address, method);
        }

        return paymentResult;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, method]
  );

  const reset = useCallback(() => {
    setMethod(null);
    setAddress(null);
    setResult(null);
    setIsProcessing(false);
  }, []);

  return {
    method,
    selectMethod,
    address,
    saveAddress,
    isProcessing,
    result,
    processPayment,
    reset,
  };
}
