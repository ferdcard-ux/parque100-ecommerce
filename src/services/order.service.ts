/**
 * @fileoverview Servicio de pedidos.
 * Calcula los totales del pedido en el cliente y lo persiste contra
 * el backend; si la API no esta disponible, degrada gracefully
 * manteniendo el pedido en memoria para mostrar la confirmacion.
 */
import type { Order, DeliveryAddress, PaymentMethodType, CartItem } from '../models';
import { generateOrderId, calculateShipping } from '../utils';

/** URL base de la API REST del backend. */
const API = 'http://localhost:3001/api';

/**
 * Servicio de pedidos.
 * @namespace orderService
 */
export const orderService = {
  /**
   * Crea un pedido a partir del carrito, la direccion y el metodo de pago.
   * Construye el objeto `Order` local, intenta persistirlo en el backend
   * y siempre lo retorna (estrategia offline-friendly).
   *
   * @param {CartItem[]} items - Lineas del carrito.
   * @param {DeliveryAddress} address - Direccion de entrega.
   * @param {PaymentMethodType} paymentMethod - Metodo de pago elegido.
   * @returns {Promise<Order>} Pedido confirmado con id generado localmente.
   */
  async create(
    items: CartItem[],
    address: DeliveryAddress,
    paymentMethod: PaymentMethodType,
  ): Promise<Order> {
    /** Suma de precio * cantidad de todas las lineas. */
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    /** Costo de envio segun umbral de envio gratis. */
    const shipping = calculateShipping(subtotal);

    const order: Order = {
      id: generateOrderId(),
      items: [...items],
      subtotal,
      shipping,
      total: subtotal + shipping,
      address,
      paymentMethod,
      status: 'confirmed',
      createdAt: new Date(),
    };

    try {
      await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Total: Math.round(order.total),
          Tipo_Entrega: 'domicilio',
          productos: items.map((item) => ({
            ID_Producto: item.id,
            Cantidad: item.quantity,
            Subtotal: Math.round(item.price * item.quantity),
          })),
        }),
      });
    } catch {
      // El backend no responde: el pedido se mantiene solo en memoria.
    }

    return order;
  },

  /**
   * Consulta un pedido por id. Reservado para una futura pantalla de
   * historial; hoy devuelve null porque la UI no lo consume aun.
   *
   * @param {string} _id - Identificador del pedido.
   * @returns {Promise<Order|null>} Siempre null en esta version.
   */
  async getById(_id: string): Promise<Order | null> {
    return null;
  },

  /**
   * Lista todos los pedidos. Reservado para el panel admin;
   * hoy devuelve un array vacio porque la UI no lo consume aun.
   *
   * @returns {Promise<Order[]>} Siempre vacio en esta version.
   */
  async getAll(): Promise<Order[]> {
    return [];
  },
};
