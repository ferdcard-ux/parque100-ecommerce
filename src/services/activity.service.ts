import { API_BASE, authHeaders } from './api';

export type SiteActivityEvent =
  | 'cart.add'
  | 'cart.remove'
  | 'favorite.add'
  | 'favorite.remove'
  | 'session.logout';

export const activityService = {
  recordInteraction(event: SiteActivityEvent, resourceId?: string | number): void {
    const body = resourceId === undefined ? { event } : { event, resourceId };
    void fetch(`${API_BASE}/activity/interactions`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(body),
    }).then(async (response) => {
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }
    }).catch((error: unknown) => {
      console.warn('No se pudo registrar la interacción:', error);
    });
  },
};
