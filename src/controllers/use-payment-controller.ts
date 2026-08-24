/**
 * @fileoverview Controlador del flujo de pago.
 * Hook React que orquesta el checkout: metodo de pago, direccion de
 * entrega, procesamiento del cobro y creacion del pedido resultante.
 * Coordina `paymentService` (pasarela) y `orderService` (persistencia).
 */
import { useState, useCallback } from 'react';
import type {
  PaymentMethodType,
  CardPaymentData,
  DeliveryAddress,
  CartItem,
  PaymentResult,
} from '../models';
import { paymentService, orderService } from '../services';

/**
 * Controlador del proceso de pago.
 *
 * @returns Objeto con estado y acciones del checkout.
 * @property {PaymentMethodType|null} method - Metodo seleccionado.
 * @property {Function} selectMethod - Selecciona el metodo de pago.
 * @property {DeliveryAddress|null} address - Direccion guardada.
 * @property {Function} saveAddress - Guarda la direccion de entrega.
 * @property {boolean} isProcessing - true mientras se procesa el cobro.
 * @property {PaymentResult|null} result - Resultado del ultimo cobro.
 * @property {Function} processPayment - Cobra y crea el pedido.
 * @property {Function} reset - Reinicia todo el estado del checkout.
 */
export function usePaymentController() {
  const [method, setMethod] = useState<PaymentMethodType | null>(null);
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);

  /** Guarda el metodo de pago elegido en el estado del checkout. */
  const selectMethod = useCallback((m: PaymentMethodType) => {
    setMethod(m);
  }, []);

  /** Persiste la direccion de entrega ingresada en el formulario. */
  const saveAddress = useCallback((addr: DeliveryAddress) => {
    setAddress(addr);
  }, []);

  /**
   * Procesa el pago con tarjeta y, si hay direccion y metodo definidos,
   * crea el pedido correspondiente mediante orderService.
   *
   * @param {CardPaymentData} cardData - Datos de la tarjeta.
   * @param {number} amount - Monto total a cobrar.
   * @param {CartItem[]} items - Lineas del carrito para el pedido.
   * @returns {Promise<PaymentResult>} Resultado devuelto por la pasarela.
   */
  const processPayment = useCallback(
    async (
      cardData: CardPaymentData,
      amount: number,
      items: CartItem[],
    ) => {
      setIsProcessing(true);
      try {
        const paymentResult = await paymentService.processCardPayment(
          cardData,
          amount,
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
    [address, method],
  );

  /** Limpia metodo, direccion y resultado para un nuevo checkout. */
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
