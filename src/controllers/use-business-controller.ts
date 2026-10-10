/**
 * @fileoverview Controlador de datos del negocio.
 * Hook React que carga y guarda la ficha del negocio del panel admin.
 */
import { useState, useEffect, useCallback } from 'react';
import type { Business, BusinessUpdate } from '../models';
import { businessService } from '../services';

/**
 * Controlador de la ficha del negocio.
 *
 * @returns Objeto con datos, carga y accion de guardado.
 */
export function useBusinessController() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setBusiness(await businessService.get());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del negocio.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Guarda la ficha del negocio en el backend.
   *
   * @param {BusinessUpdate} data - Campos a guardar.
   * @returns {Promise<Business>} Ficha actualizada.
   */
  const save = useCallback(async (data: BusinessUpdate): Promise<Business> => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const updated = await businessService.update(data);
      setBusiness(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar.';
      setSaveError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { business, isLoading, error, isSaving, saveError, reload: load, save };
}
