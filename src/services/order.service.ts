/**
 * @fileoverview Servicio de pedidos.
 * Calcula los totales del pedido en el cliente y lo persiste contra
 * el backend antes de devolver la confirmacion.
 */
import type { Order, DeliveryAddress, PaymentMethodType, CartItem, ApiOrder, OrderEstado } from '../models';
import { generateOrderId, calculateShipping } from '../utils';
import { API_BASE as API, authHeaders } from './api';

/** Extras opcionales persistidos junto al pedido. */
export interface OrderExtras {
  /** Monto en efectivo recibido (pago contra entrega). */
  tendered?: number;
  /** Cambio a devolver (pago contra entrega). */
  change?: number;
}

/** Evita crear el mismo pedido dos veces ante doble clic. */
let createInFlight = false;

/**
 * Servicio de pedidos.
 * @namespace orderService
 */
export const orderService = {
  /**
   * Crea un pedido a partir del carrito, la direccion y el metodo de pago.
  * Construye el objeto `Order` local y lo retorna solo si el backend
  * confirma la persistencia.
   *
   * @param {CartItem[]} items - Lineas del carrito.
   * @param {DeliveryAddress} address - Direccion de entrega.
   * @param {PaymentMethodType} paymentMethod - Metodo de pago elegido.
  * @returns {Promise<Order>} Pedido confirmado con id generado localmente.
  * @throws {Error} Si el backend rechaza el pedido o no esta disponible.
   */
  async create(
    items: CartItem[],
    address: DeliveryAddress,
    paymentMethod: PaymentMethodType,
    userId: number | null = null,
    extras: OrderExtras = {},
  ): Promise<Order> {
    if (createInFlight) throw new Error('El pedido ya se esta procesando.');
    createInFlight = true;
    try {
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

    let response: Response;
    try {
      response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          Total: Math.round(order.total),
          Tipo_Entrega: 'domicilio',
          ID_Usuario: userId ?? undefined,
          Destinatario: `${address.firstName} ${address.lastName}`.trim(),
          Telefono: address.phone,
          Torre: address.tower,
          Piso: address.floor,
          Apartamento: address.apartment,
          Metodo_Pago: paymentMethod === 'nequi'
            ? 'Nequi (DEMO)'
            : paymentMethod === 'card'
              ? 'Tarjeta (DEMO)'
              : 'Efectivo',
          Monto_Recibido: extras.tendered ?? null,
          Cambio: extras.change ?? null,
          Notas: address.notes?.trim() ? address.notes.trim() : null,
          productos: items.map((item) => ({
            ID_Producto: item.id,
            Cantidad: item.quantity,
            Subtotal: Math.round(item.price * item.quantity),
          })),
        }),
      });
    } catch {
      throw new Error('No fue posible conectar con el servidor. El pedido no fue creado.');
    }

    const responseData = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(responseData?.error || 'No fue posible crear el pedido.');
    }

    order.backendId = typeof responseData?.id === 'number' ? responseData.id : null;
    order.cashTendered = extras.tendered ?? null;
    order.cashChange = extras.change ?? null;
    return order;
    } finally {
      createInFlight = false;
    }
  },

  /**
   * Lista los pedidos visibles para la sesion (staff: todos; cliente:
   * solo los propios), mas recientes primero.
   *
   * @param {Object} [options] - Opciones.
   * @param {boolean} [options.items=false] - Incluye las lineas de detalle.
   * @returns {Promise<ApiOrder[]>} Pedidos con nombre de usuario.
   * @throws {Error} Si el servidor no responde correctamente.
   */
  async getAll(options: { items?: boolean } = {}): Promise<ApiOrder[]> {
    try {
      const response = await fetch(`${API}/orders${options.items ? '?items=1' : ''}`, { headers: authHeaders() });
      if (!response.ok) throw new Error('No fue posible cargar los pedidos.');
      return (await response.json()) as ApiOrder[];
    } catch (err) {
      if (err instanceof TypeError) throw new Error('No fue posible conectar con el servidor.');
      if (err instanceof Error) throw err;
      throw new Error('No fue posible conectar con el servidor.');
    }
  },

  /**
   * Consulta un pedido por id, con sus lineas de detalle.
   *
   * @param {string|number} id - Identificador del pedido.
   * @returns {Promise<ApiOrder|null>} Pedido con detalles o null si no existe.
   * @throws {Error} Si el servidor falla por razones distintas a 404.
   */
  async getById(id: string | number): Promise<ApiOrder | null> {
    try {
      const response = await fetch(`${API}/orders/${id}`, { headers: authHeaders() });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('No fue posible cargar el pedido.');
      return (await response.json()) as ApiOrder;
    } catch (err) {
      if (err instanceof TypeError) throw new Error('No fue posible conectar con el servidor.');
      if (err instanceof Error) throw err;
      throw new Error('No fue posible conectar con el servidor.');
    }
  },

  /**
   * Cambia el estado de un pedido en el backend.
   *
   * @param {string|number} id - Identificador del pedido.
   * @param {OrderEstado} estado - Nuevo estado.
   * @returns {Promise<void>}
   * @throws {Error} Si el servidor rechaza el cambio.
   */
  async updateStatus(id: string | number, estado: OrderEstado): Promise<void> {
    try {
      const response = await fetch(`${API}/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ Estado: estado }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'No fue posible actualizar el estado.');
      }
    } catch (err) {
      if (err instanceof TypeError) throw new Error('No fue posible conectar con el servidor.');
      if (err instanceof Error) throw err;
      throw new Error('No fue posible conectar con el servidor.');
    }
  },

  /**
   * Cancela un pedido con motivo obligatorio.
   * Reglas por actor (el backend las hace cumplir):
   * cliente solo antes del envio; domiciliario requiere permiso
   * delegado; admin tiene acceso total.
   *
   * @param {string|number} id - Identificador del pedido.
   * @param {string} motivo - Motivo de la cancelacion.
   * @param {string} [actor='cliente'] - 'cliente', 'domiciliario' o 'admin'.
   * @param {number|null} [actorId=null] - Usuario que ejecuta la cancelacion.
   * @returns {Promise<void>}
   * @throws {Error} Sin motivo, sin permiso, estado no cancelable o falla del servidor.
   */
  async cancel(id: string | number, motivo: string, actor: string = 'cliente', actorId: number | null = null): Promise<void> {
    try {
      const response = await fetch(`${API}/orders/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ Motivo: motivo, Actor: actor, ActorId: actorId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'No fue posible cancelar el pedido.');
      }
    } catch (err) {
      if (err instanceof TypeError) throw new Error('No fue posible conectar con el servidor.');
      if (err instanceof Error) throw err;
      throw new Error('No fue posible conectar con el servidor.');
    }
  },
};
