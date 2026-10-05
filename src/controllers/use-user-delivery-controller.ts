/**
 * @fileoverview Controlador React para cargar y guardar datos de entrega del usuario.
 */
import { useCallback, useEffect, useState } from 'react';
import type { UserDeliveryDetails } from '../models';
import { userService } from '../services';

/**
 * Gestiona la consulta y persistencia de datos de entrega de un usuario.
 *
 * @param {number|null} userId - Identificador del usuario autenticado.
 * @returns Estado de carga y acciones para los datos de entrega.
 */
export function useUserDeliveryController(userId: number | null) {
  const [details, setDetails] = useState<UserDeliveryDetails | null>(null);
  const [isLoading, setIsLoading] = useState(userId !== null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (userId === null) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      setDetails(await userService.getDeliveryDetails(userId));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No fue posible cargar los datos de entrega.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId === null) {
      setDetails(null);
      setIsLoading(false);
      setLoadError(null);
      setSaveError(null);
      return;
    }
    void loadDetails();
  }, [userId, loadDetails]);

  const saveDetails = useCallback(async (deliveryDetails: UserDeliveryDetails) => {
    if (userId === null) throw new Error('Debes iniciar sesion para guardar tus datos.');
    setIsSaving(true);
    setSaveError(null);
    try {
      const savedDetails = await userService.saveDeliveryDetails(userId, deliveryDetails);
      setDetails(savedDetails);
      return savedDetails;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No fue posible guardar los datos de entrega.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [userId]);

  return { details, isLoading, isSaving, loadError, saveError, loadDetails, saveDetails };
}
