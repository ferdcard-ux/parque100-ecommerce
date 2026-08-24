/**
 * @fileoverview Modelos de pedidos y entrega.
 */
import type { CartItem } from './cart';

/** Direccion de entrega dentro del conjunto Parque 100. */
export interface DeliveryAddress {
  /** Primer nombre del destinatario. */
  firstName: string;
  /** Apellidos del destinatario. */
  lastName: string;
  /** Telefono de contacto. */
  phone: string;
  /** Torre/conjunto. */
  tower: string;
  /** Piso. */
  floor: string;
  /** Apartamento. */
  apartment: string;
  /** Notas adicionales para el domiciliario. */
  notes: string;
}

/** Pedido generado tras confirmar el pago. */
export interface Order {
  /** Identificador legible (prefijo TP + 6 digitos). */
  id: string;
  /** Lineas de producto incluidas. */
  items: CartItem[];
  /** Subtotal sin envio. */
  subtotal: number;
  /** Costo de envio (0 si supera el umbral de envio gratis). */
  shipping: number;
  /** Total a pagar. */
  total: number;
  /** Direccion de entrega. */
  address: DeliveryAddress;
  /** Metodo de pago elegido. */
  paymentMethod: PaymentMethodType;
  /** Estado actual del pedido. */
  status: OrderStatus;
  /** Fecha/hora de creacion. */
  createdAt: Date;
}

/** Metodos de pago soportados por la aplicacion. */
export type PaymentMethodType = 'card' | 'nequi';

/** Ciclo de vida de un pedido. */
export type OrderStatus = 'confirmed' | 'preparing' | 'on_way' | 'delivered';
