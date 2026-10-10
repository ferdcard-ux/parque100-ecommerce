/**
 * @fileoverview Servicio de datos del negocio.
 * Acceso a la ficha del negocio contra el backend (GET/PUT /business).
 */
import type { Business, BusinessUpdate } from '../models';

/** URL base de la API REST del backend. */
const API = 'http://localhost:3001/api';

/**
 * Servicio de datos del negocio.
 * @namespace businessService
 */
export const businessService = {
  /**
   * Obtiene la ficha actual del negocio.
   *
   * @returns {Promise<Business>} Datos del negocio.
   * @throws {Error} Si el servidor no responde correctamente.
   */
  async get(): Promise<Business> {
    try {
      const response = await fetch(`${API}/business`);
      if (!response.ok) throw new Error('No fue posible cargar los datos del negocio.');
      return (await response.json()) as Business;
    } catch (err) {
      if (err instanceof TypeError) throw new Error('No fue posible conectar con el servidor.');
      if (err instanceof Error) throw err;
      throw new Error('No fue posible conectar con el servidor.');
    }
  },

  /**
   * Actualiza la ficha del negocio.
   *
   * @param {BusinessUpdate} data - Campos a guardar.
   * @returns {Promise<Business>} Ficha actualizada.
   * @throws {Error} Si el servidor rechaza los datos.
   */
  async update(data: BusinessUpdate): Promise<Business> {
    try {
      const response = await fetch(`${API}/business`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'No fue posible guardar los datos del negocio.');
      }
      return (await response.json()) as Business;
    } catch (err) {
      if (err instanceof TypeError) throw new Error('No fue posible conectar con el servidor.');
      if (err instanceof Error) throw err;
      throw new Error('No fue posible conectar con el servidor.');
    }
  },
};
