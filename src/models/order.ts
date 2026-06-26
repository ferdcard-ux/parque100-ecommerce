import type { CartItem } from './cart';

export interface DeliveryAddress {
  firstName: string;
  lastName: string;
  phone: string;
  tower: string;
  floor: string;
  apartment: string;
  notes: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address: DeliveryAddress;
  paymentMethod: PaymentMethodType;
  status: OrderStatus;
  createdAt: Date;
}

export type PaymentMethodType = 'card' | 'nequi';

export type OrderStatus = 'confirmed' | 'preparing' | 'on_way' | 'delivered';
