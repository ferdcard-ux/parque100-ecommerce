/**
 * @fileoverview Controlador de pedidos del panel de administracion.
 * Incluye totales por estado, tomar pedido y cambio de estado.
 */
import { useState, useEffect, useCallback } from 'react';
import type { ApiOrder, OrderEstado } from '../models';
import { orderService } from '../services';

/** Conteo de pedidos agrupado por estado. */
export interface OrderStatusCounts {
  pendiente: number;
  preparando: number;
  enviando: number;
  entregado: number;
}

/**
 * Controlador de pedidos para el panel admin.
 *
 * @returns Objeto con pedidos, conteos, carga y acciones de gestion.
 */
export function useAdminOrdersController() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setOrders(await orderService.getAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los pedidos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts: OrderStatusCounts = {
    pendiente: orders.filter((o) => o.Estado === 'pendiente').length,
    preparando: orders.filter((o) => o.Estado === 'preparando').length,
    enviando: orders.filter((o) => o.Estado === 'enviando').length,
    entregado: orders.filter((o) => o.Estado === 'entregado').length,
  };

  /** Cambia el estado en backend y actualiza el estado local. */
  const changeStatus = useCallback(async (id: number, estado: OrderEstado) => {
    await orderService.updateStatus(id, estado);
    setOrders((prev) => prev.map((o) => (o.ID_Pedido === id ? { ...o, Estado: estado } : o)));
  }, []);

  /** "Tomar pedido": pasa de pendiente a preparando. */
  const takeOrder = useCallback(async (id: number) => {
    await changeStatus(id, 'preparando');
  }, [changeStatus]);

  return { orders, counts, isLoading, error, reload: load, changeStatus, takeOrder };
}
