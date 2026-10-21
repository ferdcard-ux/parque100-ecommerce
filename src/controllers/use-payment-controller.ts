/**
 * @fileoverview Controlador del flujo de pago.
 * Hook React que orquesta el checkout: metodo de pago, direccion de
 * entrega y creacion del pedido contra entrega. Los pagos electronicos
 * permanecen deshabilitados hasta contar con una pasarela verificada.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  PaymentMethodType,
  DeliveryAddress,
  CartItem,
  Order,
  PaymentResult,
  PaymentModeState,
} from '../models';
import { orderService, paymentService } from '../services';

/**
 * Controlador del proceso de pago.
 *
 * @returns Objeto con estado y acciones del checkout.
 * @property {PaymentMethodType|null} method - Metodo seleccionado.
 * @property {Function} selectMethod - Selecciona el metodo de pago.
 * @property {DeliveryAddress|null} address - Direccion guardada.
 * @property {Function} saveAddress - Guarda la direccion de entrega.
 * @property {boolean} isProcessing - true mientras se procesa el cobro.
 * @property {PaymentResult|null} result - Resultado de la ultima accion del checkout.
 * @property {Order|null} lastOrder - Ultimo pedido creado (para la confirmacion).
 * @property {Function} reset - Reinicia todo el estado del checkout.
 */
export function usePaymentController() {
  const [method, setMethod] = useState<PaymentMethodType | null>(null);
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentModeState>('loading');
  /** Evita procesar dos pagos a la vez (doble clic antes del re-render). */
  const busyRef = useRef(false);

  useEffect(() => {
    let active = true;
    paymentService.getMode()
      .then((mode) => active && setPaymentMode(mode))
      .catch(() => active && setPaymentMode('error'));
    return () => { active = false; };
  }, []);

  /** Guarda el metodo de pago elegido en el estado del checkout. */
  const selectMethod = useCallback((m: PaymentMethodType) => {
    setMethod(m);
  }, []);

  /** Persiste la direccion de entrega ingresada en el formulario. */
  const saveAddress = useCallback((addr: DeliveryAddress) => {
    setAddress(addr);
  }, []);

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
      if (busyRef.current) throw new Error('El pago ya se esta procesando.');
      busyRef.current = true;
      setIsProcessing(true);
      try {
        const change = Math.round(tendered - amount);
        const created = address && method
          ? await orderService.create(items, address, method, userId, { tendered: Math.round(tendered), change })
          : null;
        if (created) setLastOrder(created);
        const paymentResult = { success: true, message: 'Pedido confirmado; el pago se realizará al recibirlo.' };
        setResult(paymentResult);
        return created;
      } finally {
        busyRef.current = false;
        setIsProcessing(false);
      }
    },
    [address, method],
  );

  const processDemo = useCallback(
    async (paymentMethod: Exclude<PaymentMethodType, 'cash'>, items: CartItem[], userId: number | null = null) => {
      if (!address) throw new Error('Guarda la direccion antes de continuar con la simulacion.');
      if (paymentMode !== 'demo') throw new Error('El modo de simulacion no esta habilitado.');
      if (busyRef.current) throw new Error('El pago ya se esta procesando.');
      busyRef.current = true;
      setIsProcessing(true);
      try {
        const paymentResult = await paymentService.simulate(paymentMethod);
        const created = await orderService.create(items, address, paymentMethod, userId);
        created.simulatedPayment = true;
        created.paymentSimulationId = paymentResult.simulationId;
        setMethod(paymentMethod);
        setLastOrder(created);
        setResult(paymentResult);
        return created;
      } finally {
        busyRef.current = false;
        setIsProcessing(false);
      }
    },
    [address, paymentMode],
  );

  return {
    method,
    selectMethod,
    address,
    saveAddress,
    isProcessing,
    result,
    lastOrder,
    paymentMode,
    processCash,
    processDemo,
    reset,
  };
}
