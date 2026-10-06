/**
 * @fileoverview Controlador de pedidos del usuario autenticado.
 * Carga el historial desde la API y lo filtra por el usuario activo.
 */
import { useState, useEffect, useCallback } from 'react';
import type { ApiOrder } from '../models';
import { orderService } from '../services';

/**
 * Controlador de pedidos del cliente.
 *
 * @param {number|null} userId - Id del usuario autenticado (null cierra la sesion).
 * @returns Objeto con pedidos del usuario, estado de carga y acciones.
 */
export function useOrdersController(userId: number | null) {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await orderService.getAll();
      setOrders(userId === null ? [] : all.filter((o) => o.ID_Usuario === userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los pedidos.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { orders, isLoading, error, reload: load };
}
