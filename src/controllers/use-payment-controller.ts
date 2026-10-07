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
  Order,
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
 * @property {Order|null} lastOrder - Ultimo pedido creado (para la confirmacion).
 * @property {Function} processPayment - Cobra y crea el pedido.
 * @property {Function} reset - Reinicia todo el estado del checkout.
 */
export function usePaymentController() {
  const [method, setMethod] = useState<PaymentMethodType | null>(null);
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

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
      userId: number | null = null,
    ) => {
      setIsProcessing(true);
      try {
        const paymentResult = await paymentService.processCardPayment(
          cardData,
          amount,
        );
        setResult(paymentResult);

        if (address && method) {
          setLastOrder(await orderService.create(items, address, method, userId));
        }

        return paymentResult;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, method],
  );

  /**
   * Limpia metodo, direccion y resultado para un nuevo checkout.
   * Conserva `lastOrder` para que la confirmacion muestre el pedido real. */
  const reset = useCallback(() => {
    setMethod(null);
    setAddress(null);
    setResult(null);
    setIsProcessing(false);
  }, []);

  /**
   * Procesa un pago por Nequi con comprobante adjunto y, si hay
   * direccion y metodo, crea el pedido correspondiente.
   *
   * @param {string} receiptDataUrl - Comprobante en imagen (dataURL).
   * @param {number} amount - Monto total a cobrar.
   * @param {CartItem[]} items - Lineas del carrito.
   * @param {number|null} userId - Id del usuario autenticado.
   * @returns {Promise<PaymentResult>} Resultado devuelto por la pasarela.
   */
  const processNequi = useCallback(
    async (receiptDataUrl: string, amount: number, items: CartItem[], userId: number | null = null) => {
      setIsProcessing(true);
      try {
        const paymentResult = await paymentService.processNequiPayment(receiptDataUrl, amount);
        setResult(paymentResult);
        if (address && method) {
          setLastOrder(await orderService.create(items, address, method, userId, { receipt: receiptDataUrl }));
        }
        return paymentResult;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, method],
  );

  /**
   * Registra un pago en efectivo contra entrega (sin pasarela):
   * calcula el cambio y crea el pedido con monto y cambio.
   *
   * @param {number} tendered - Monto en efectivo que entrega el cliente.
   * @param {number} amount - Monto total de la compra.
   * @param {CartItem[]} items - Lineas del carrito.
   * @param {number|null} userId - Id del usuario autenticado.
   * @returns {Promise<Order>} Pedido creado con cambio calculado.
   * @throws {Error} Si el monto no cubre el total.
   */
  const processCash = useCallback(
    async (tendered: number, amount: number, items: CartItem[], userId: number | null = null) => {
      if (!Number.isFinite(tendered) || tendered < amount) {
        throw new Error('El monto en efectivo debe cubrir el total de la compra.');
      }
      setIsProcessing(true);
      try {
        const change = Math.round(tendered - amount);
        const created = address && method
          ? await orderService.create(items, address, method, userId, { tendered: Math.round(tendered), change })
          : null;
        if (created) setLastOrder(created);
        const paymentResult = { success: true, transactionId: `EFE-${Date.now()}`, message: 'Pago en efectivo registrado' };
        setResult(paymentResult);
        return created;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, method],
  );

  return {
    method,
    selectMethod,
    address,
    saveAddress,
    isProcessing,
    result,
    lastOrder,
    processPayment,
    processNequi,
    processCash,
    reset,
  };
}
