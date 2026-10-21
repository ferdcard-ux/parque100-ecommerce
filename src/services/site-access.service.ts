import { API_BASE as API } from './api';

async function responseError(response: Response, fallback: string): Promise<Error> {
  const body = await response.json().catch(() => null);
  if (response.status === 401) return new Error('SITE_SESSION_INVALID');
  if (response.status === 403) return new Error('SITE_ACCESS_DENIED');
  return new Error(body?.error || fallback);
}

export const siteAccessService = {
  async getDisclaimerStatus(): Promise<{ authorized: boolean; accepted: boolean; version: string }> {
    const response = await fetch(`${API}/site-access/disclaimer/status`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!response.ok) {
      throw await responseError(response, 'No fue posible verificar la autorización del sitio.');
    }
    return response.json();
  },

  async acceptDisclaimer(version: string): Promise<void> {
    const response = await fetch(`${API}/site-access/disclaimer/accept`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version }),
    });
    if (!response.ok) {
      throw await responseError(response, 'No fue posible guardar la aceptación.');
    }
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API}/site-access/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      throw await responseError(response, 'No fue posible cerrar el acceso al sitio.');
    }
  },
};
