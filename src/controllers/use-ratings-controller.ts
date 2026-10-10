/**
 * @fileoverview Controlador de calificaciones.
 * Hook React para promedios, listados y creacion de calificaciones.
 */
import { useState, useEffect, useCallback } from 'react';
import type { Rating, RatingCreate, RatingSummary } from '../models';
import { ratingService } from '../services';

interface RatingsFilter {
  /** Producto a consultar (ID_Producto). */
  producto?: string;
  /** Pedido a consultar. */
  pedido?: number;
  /** Usuario a consultar. */
  usuario?: number;
}

/**
 * Controlador de calificaciones.
 *
 * @param {RatingsFilter} filters - Filtros del listado/resumen.
 * @returns Objeto con resumen, lista y accion de calificar.
 */
export function useRatingsController(filters: RatingsFilter = {}) {
  const key = `${filters.producto ?? ''}|${filters.pedido ?? ''}|${filters.usuario ?? ''}`;
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    const load = async () => {
      try {
        const [list, sum] = await Promise.all([
          ratingService.list(filters),
          filters.producto ? ratingService.summary(filters.producto) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setRatings(list);
        setSummary(sum);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /**
   * Crea una calificacion y refresca el listado.
   *
   * @param {RatingCreate} data - Datos de la calificacion.
   * @returns {Promise<void>}
   */
  const rate = useCallback(
    async (data: RatingCreate): Promise<void> => {
      setIsSaving(true);
      try {
        await ratingService.create(data);
        const [list, sum] = await Promise.all([
          ratingService.list(filters),
          filters.producto ? ratingService.summary(filters.producto) : Promise.resolve(summary),
        ]);
        setRatings(list);
        setSummary(sum);
      } finally {
        setIsSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return { summary, ratings, isLoading, error, isSaving, rate };
}
