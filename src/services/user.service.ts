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

/** Usuario tal como lo expone GET /api/users. */
export interface ApiUserRow {
  ID_Usuario: number;
  Nombre: string;
  Correo: string;
  Rol: string | null;
  Telefono: string | number | null;
}

/** Datos editables de un usuario desde el panel admin. */
export interface AdminUserData {
  Nombre: string;
  Correo: string;
  Rol: string;
  Telefono: string;
}

/** Datos editables del perfil propio (pantalla "Informacion de tu perfil"). */
export interface ProfileData {
  Nombre: string;
  Correo: string;
  Telefono: string;
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

  /**
   * Actualiza el perfil propio (nombre, correo y telefono).
   *
   * @param {number} id - Identificador del usuario autenticado.
   * @param {ProfileData} data - Datos editados del perfil.
   * @returns {Promise<ApiUserRow>} Perfil actualizado segun el servidor.
   * @throws {Error} Si el correo ya existe o los datos son invalidos.
   */
  async updateProfile(id: number, data: ProfileData): Promise<ApiUserRow> {
    const response = await fetch(`${API}/users/${id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'No fue posible guardar el perfil.'));
    }
    return (await response.json()) as ApiUserRow;
  },

  /**
   * Lista todos los usuarios registrados (panel admin).
   *
   * @returns {Promise<ApiUserRow[]>} Usuarios sin datos sensibles.
   * @throws {Error} Si el servidor rechaza la consulta.
   */
  async getAllUsers(): Promise<ApiUserRow[]> {
    const response = await fetch(`${API}/users`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'No fue posible cargar los clientes.'));
    }
    return (await response.json()) as ApiUserRow[];
  },

  /**
   * Crea un usuario desde el panel admin.
   *
   * @param {AdminUserData & { Contrasena: string }} data - Datos del nuevo usuario.
   * @returns {Promise<number>} Id generado.
   * @throws {Error} Si el correo ya existe o los datos son invalidos.
   */
  async createUser(data: AdminUserData & { Contrasena: string }): Promise<number> {
    const response = await fetch(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.error || 'No fue posible crear el usuario.');
    }
    return body.id;
  },

  /**
   * Actualiza nombre, correo, rol y telefono de un usuario.
   *
   * @param {number} id - Identificador del usuario.
   * @param {AdminUserData} data - Datos editados.
   * @returns {Promise<void>}
   * @throws {Error} Si el correo ya existe o los datos son invalidos.
   */
  async updateUser(id: number, data: AdminUserData): Promise<void> {
    const response = await fetch(`${API}/users/${id}/admin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'No fue posible actualizar el usuario.'));
    }
  },

  /**
   * Elimina un usuario sin pedidos asociados.
   *
   * @param {number} id - Identificador del usuario.
   * @returns {Promise<void>}
   * @throws {Error} Si tiene pedidos (409) o falla la eliminacion.
   */
  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API}/users/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'No fue posible eliminar el usuario.'));
    }
  },
};
