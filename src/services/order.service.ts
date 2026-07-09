import type { Order, DeliveryAddress, PaymentMethodType, CartItem } from '../models';
import { generateOrderId, calculateShipping } from '../utils';

const API = 'http://localhost:3001/api';

export const orderService = {
  async create(
    items: CartItem[],
    address: DeliveryAddress,
    paymentMethod: PaymentMethodType
  ): Promise<Order> {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
          Tipo_Entrega: address.type || 'domicilio',
          productos: items.map(item => ({
            ID_Producto: item.id,
            Cantidad: item.quantity,
            Subtotal: Math.round(item.price * item.quantity),
          })),
        }),
      });
    } catch {
      // fallback: keep order in memory
    }

    return order;
  },

  async getById(id: string): Promise<Order | null> {
    return null;
  },

  async getAll(): Promise<Order[]> {
    return [];
  },
};
