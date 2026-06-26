import type { Order, DeliveryAddress, PaymentMethodType, CartItem } from '../models';
import { generateOrderId, calculateShipping } from '../utils';

const MOCK_ORDERS: Order[] = [];

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

    MOCK_ORDERS.push(order);
    return order;
  },

  async getById(id: string): Promise<Order | null> {
    return MOCK_ORDERS.find((o) => o.id === id) ?? null;
  },

  async getAll(): Promise<Order[]> {
    return [...MOCK_ORDERS];
  },
};
