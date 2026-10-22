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
  /** Identificador numerico asignado por el backend (null si no se persistio). */
  backendId?: number | null;
  /** Monto en efectivo recibido (solo pago contra entrega). */
  cashTendered?: number | null;
  /** Cambio a devolver (solo pago contra entrega). */
  cashChange?: number | null;
  /** Indica que este checkout simulado no produjo un cobro real. */
  simulatedPayment?: boolean;
  /** Referencia DEMO interna; no es una referencia financiera. */
  paymentSimulationId?: string;
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
export type PaymentMethodType = 'card' | 'nequi' | 'cash';

/** Ciclo de vida de un pedido. */
export type OrderStatus = 'confirmed' | 'preparing' | 'on_way' | 'delivered';

/** Estado de pedido persistido en la base de datos (ciclo del panel admin). */
export type OrderEstado = 'pendiente' | 'preparando' | 'enviando' | 'entregado' | 'cancelado';

/** Linea de detalle de un pedido tal como la expone la API. */
export interface ApiOrderItem {
  /** Identificador del producto. */
  ID_Producto: string;
  /** Nombre del producto (join con productos). */
  Producto_Nombre?: string;
  /** Cantidad solicitada. */
  Cantidad: number;
  /** Subtotal de la linea en COP. */
  Subtotal: number;
}

/** Pedido persistido tal como lo expone la API REST. */
export interface ApiOrder {
  /** Identificador numerico autoincremental. */
  ID_Pedido: number;
  /** Fecha de creacion (YYYY-MM-DD). */
  Fecha: string;
  /** Estado actual del pedido. */
  Estado: OrderEstado | string;
  /** Total del pedido en COP. */
  Total: number;
  /** 'domicilio' o 'recogida'. */
  Tipo_Entrega: string;
  /** Usuario asociado. */
  ID_Usuario: number | null;
  /** Nombre del usuario (solo en el listado). */
  Usuario_Nombre?: string | null;
  /** Destinatario del envio. */
  Destinatario?: string | null;
  /** Telefono de contacto. */
  Telefono?: string | number | null;
  /** Torre/conjunto. */
  Torre?: string | null;
  /** Piso. */
  Piso?: string | null;
  /** Apartamento. */
  Apartamento?: string | null;
  /** Metodo de pago usado. */
  Metodo_Pago?: string | null;
  /** Referencia generada por una transaccion academica, nunca financiera. */
  Referencia_Pago_DEMO?: string | null;
  /** Estado de la transaccion ficticia. */
  Estado_Pago_DEMO?: 'iniciada_demo' | 'aprobada_demo' | 'cancelada_demo' | 'expirada_demo' | null;
  /** Monto en efectivo recibido (solo pago contra entrega). */
  Monto_Recibido?: number | null;
  /** Cambio a devolver (solo pago contra entrega). */
  Cambio?: number | null;
  /** Comprobante historico de pedidos previos; no se aceptan nuevos comprobantes. */
  Comprobante?: string | null;
  /** Motivo de cancelacion (solo pedidos cancelados). */
  Motivo_Cancelacion?: string | null;
  /** Notas adicionales para el domiciliario (solo si el cliente las dejo). */
  Notas?: string | null;
  /** Lineas de detalle (solo en el detalle). */
  detalles?: ApiOrderItem[];
}
