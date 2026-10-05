/**
 * @fileoverview Servicio para consultar y actualizar datos de entrega del usuario.
 */
import type { UserDeliveryDetails } from '../models';

const API = 'http://localhost:3001/api';

interface ApiDeliveryDetails {
  Telefono: string | number | null;
  Torre_Bloque: string | null;
  Piso: string | null;
  Apartamento: string | null;
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }
  return fallback;
}

function mapDeliveryDetails(row: ApiDeliveryDetails): UserDeliveryDetails {
  return {
    phone: row.Telefono === null ? '' : String(row.Telefono),
    tower: row.Torre_Bloque ?? '',
    floor: row.Piso ?? '',
    apartment: row.Apartamento ?? '',
  };
}

export const userService = {
  /**
   * Consulta los datos de entrega guardados para un usuario.
   *
   * @param {number} id - Identificador del usuario autenticado.
   * @returns {Promise<UserDeliveryDetails>} Datos persistidos de entrega.
   * @throws {Error} Si el servidor rechaza o no puede completar la consulta.
   */
  async getDeliveryDetails(id: number): Promise<UserDeliveryDetails> {
    const response = await fetch(`${API}/users/${id}`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'No fue posible cargar los datos de entrega.'));
    }
    return mapDeliveryDetails(await response.json() as ApiDeliveryDetails);
  },

  /**
   * Guarda los campos de entrega permitidos para un usuario.
   *
   * @param {number} id - Identificador del usuario autenticado.
   * @param {UserDeliveryDetails} details - Datos de entrega a guardar.
   * @returns {Promise<UserDeliveryDetails>} Datos guardados por el servidor.
   * @throws {Error} Si el servidor rechaza o no puede completar la actualizacion.
   */
  async saveDeliveryDetails(
    id: number,
    details: UserDeliveryDetails,
  ): Promise<UserDeliveryDetails> {
    const response = await fetch(`${API}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Telefono: details.phone,
        Torre_Bloque: details.tower,
        Piso: details.floor,
        Apartamento: details.apartment,
      }),
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'No fue posible guardar los datos de entrega.'));
    }
    return mapDeliveryDetails(await response.json() as ApiDeliveryDetails);
  },
};
