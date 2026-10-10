/**
 * @fileoverview Servicio de calificaciones.
 * Acceso a calificaciones de 1 a 5 estrellas contra el backend.
 */
import type { Rating, RatingCreate, RatingSummary } from '../models';

/** URL base de la API REST del backend. */
const API = 'http://localhost:3001/api';

/**
 * Servicio de calificaciones.
 * @namespace ratingService
 */
export const ratingService = {
  /**
   * Lista calificaciones con filtros opcionales.
   *
   * @param {Object} filters - Filtros por producto, pedido o usuario.
   * @returns {Promise<Rating[]>} Calificaciones recientes primero.
   * @throws {Error} Si el servidor no responde correctamente.
   */
  async list(filters: { producto?: string; pedido?: number; usuario?: number } = {}): Promise<Rating[]> {
    const params = new URLSearchParams();
    if (filters.producto) params.set('producto', filters.producto);
    if (filters.pedido !== undefined) params.set('pedido', String(filters.pedido));
    if (filters.usuario !== undefined) params.set('usuario', String(filters.usuario));
    const query = params.toString() ? `?${params.toString()}` : '';
    try {
      const response = await fetch(`${API}/ratings${query}`);
      if (!response.ok) throw new Error('No fue posible cargar las calificaciones.');
      return (await response.json()) as Rating[];
    } catch (err) {
      if (err instanceof TypeError) throw new Error('No fue posible conectar con el servidor.');
      if (err instanceof Error) throw err;
      throw new Error('No fue posible conectar con el servidor.');
    }
  },

  /**
   * Obtiene promedio y total de un producto.
   *
   * @param {string} productId - Identificador del producto.
   * @returns {Promise<RatingSummary>} Resumen del producto.
   * @throws {Error} Si el servidor no responde correctamente.
   */
  async summary(productId: string): Promise<RatingSummary> {
    try {
      const response = await fetch(`${API}/ratings/resumen?producto=${encodeURIComponent(productId)}`);
      if (!response.ok) throw new Error('No fue posible cargar el promedio.');
      return (await response.json()) as RatingSummary;
    } catch (err) {
      if (err instanceof TypeError) throw new Error('No fue posible conectar con el servidor.');
      if (err instanceof Error) throw err;
      throw new Error('No fue posible conectar con el servidor.');
    }
  },

  /**
   * Crea una calificacion de 1 a 5 estrellas.
   *
   * @param {RatingCreate} data - Datos de la calificacion.
   * @returns {Promise<number>} Id generado.
   * @throws {Error} Si el servidor rechaza los datos.
   */
  async create(data: RatingCreate): Promise<number> {
    try {
      const response = await fetch(`${API}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'No fue posible guardar la calificacion.');
      }
      const payload = await response.json().catch(() => null);
      return Number(payload?.id);
    } catch (err) {
      if (err instanceof TypeError) throw new Error('No fue posible conectar con el servidor.');
      if (err instanceof Error) throw err;
      throw new Error('No fue posible conectar con el servidor.');
    }
  },
};
