/**
 * @fileoverview Acceso HTTP centralizado del frontend.
 * Expone la URL base de la API (`VITE_API_URL` o localhost por defecto)
 * y el token JWT de la sesion activa, que los servicios envian en el
 * encabezado `Authorization: Bearer`.
 */

/** URL base de la API REST del backend. */
const envUrl = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  ?.VITE_API_URL;
export const API_BASE = envUrl || 'http://localhost:3001/api';

/** Clave del token de la sesion activa en el almacenamiento local. */
const TOKEN_KEY = 'p100-token';

let cachedToken: string | null = null;
let tokenLoaded = false;

/** Lee el token persistido sin lanzar. */
function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Devuelve el token JWT de la sesion activa (o null sin sesion).
 *
 * @returns {string|null} Token o null.
 */
export function getAuthToken(): string | null {
  if (!tokenLoaded) {
    cachedToken = readStoredToken();
    tokenLoaded = true;
  }
  return cachedToken;
}

/**
 * Fija el token de la sesion activa y lo persiste.
 *
 * @param {string|null} token - Nuevo token o null al cerrar sesion.
 * @returns {void}
 */
export function setAuthToken(token: string | null): void {
  cachedToken = token;
  tokenLoaded = true;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* almacenamiento no disponible: token solo en memoria */
  }
}

/**
 * Construye los encabezados de autorizacion para `fetch`.
 *
 * @param {Record<string,string>} [extra={}] - Encabezados adicionales.
 * @returns {Record<string,string>} Encabezados con `Authorization` si hay sesion.
 */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}
