/**
 * @fileoverview Controlador de pedidos del usuario autenticado.
 * Carga el historial desde la API (con lineas de detalle) y expone
 * el detalle, la cancelacion propia y el detalle puntual de un pedido.
 */
import { useState, useEffect, useCallback } from 'react';
import type { ApiOrder } from '../models';
import { orderService } from '../services';

/**
 * Controlador de pedidos del cliente.
 *
 * @param {number|null} userId - Id del usuario autenticado (null cierra la sesion).
 * @param {Object} [opts] - Opciones.
 * @param {boolean} [opts.items=false] - Incluir lineas de detalle en la lista.
 * @returns Objeto con pedidos del usuario, estado de carga y acciones.
 */
export function useOrdersController(userId: number | null, { items = false }: { items?: boolean } = {}) {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await orderService.getAll({ items });
      setOrders(userId === null ? [] : all.filter((o) => o.ID_Usuario === userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los pedidos.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, items]);

  useEffect(() => {
    load();
  }, [load]);

  /** Consulta el detalle de un pedido con sus lineas. */
  const fetchDetail = useCallback((id: string | number) => {
    return orderService.getById(id);
  }, []);

  /** Cancela un pedido propio con motivo y recarga la lista. */
  const cancelOwn = useCallback(
    async (id: string | number, motivo: string): Promise<void> => {
      await orderService.cancel(id, motivo);
      await load();
    },
    [load],
  );

  return { orders, isLoading, error, reload: load, fetchDetail, cancelOwn };
}

/**
 * Controlador del detalle puntual de un pedido.
 *
 * @param {string|number|null} orderId - Identificador del pedido.
 * @returns Pedido con detalles, estado de carga y recarga.
 */
export function useOrderDetailController(orderId: string | number | null) {
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [isLoading, setIsLoading] = useState(orderId !== null && orderId !== '');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (orderId === null || orderId === '') {
      setOrder(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getById(orderId);
      if (data === null) setError('Pedido no encontrado.');
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  return { order, isLoading, error, reload: load };
}
