/**
 * @fileoverview Controlador de favoritos.
 * Persiste los IDs de productos favoritos en localStorage como texto,
 * ya que los IDs de producto son cadenas (ej. 'P001').
 *
 * Los favoritos se guardan por cuenta: cada usuario tiene su propia
 * lista y la sesion invitado (sin usuario) usa una lista aparte.
 */
import { useState, useCallback, useEffect } from 'react';

const GUEST_STORAGE_KEY = 'parque100_favorites_guest';
const USER_STORAGE_PREFIX = 'parque100_favorites_user_';
const CHANGE_EVENT = 'parque100_favorites_changed';

/** Clave de almacenamiento para un usuario (o invitado si no hay sesion). */
function storageKeyFor(userId: number | null | undefined): string {
  return userId != null ? `${USER_STORAGE_PREFIX}${userId}` : GUEST_STORAGE_KEY;
}

/** Lee los favoritos guardados en una clave, aceptando texto y numero. */
function readStored(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => (typeof x === 'number' || typeof x === 'string' ? String(x) : ''))
      .filter((x) => x.length > 0);
  } catch {
    return [];
  }
}

/**
 * Hook de favoritos persistido en localStorage y sincronizado entre
 * las distintas vistas (catalogo, navbar, pagina de favoritos).
 *
 * @param {number|null} [userId] - Cuenta activa. Si se omite o es null
 *   se usa la lista de invitado. Al cambiar de cuenta cambia la lista.
 * @returns ids favoritos y la accion de alternar.
 */
export function useFavoritesController(userId?: number | null) {
  const storageKey = storageKeyFor(userId);
  /** Guarda la clave junto con los ids para no mezclar cuentas. */
  const [store, setStore] = useState(() => ({ key: storageKey, ids: readStored(storageKey) }));

  /** Si la cuenta cambia, se lee de inmediato la lista de esa cuenta. */
  const favorites = store.key === storageKey ? store.ids : readStored(storageKey);

  useEffect(() => {
    setStore({ key: storageKey, ids: readStored(storageKey) });
    const sync = (event: Event) => {
      if (event instanceof StorageEvent && event.key !== null && event.key !== storageKey) return;
      setStore({ key: storageKey, ids: readStored(storageKey) });
    };
    window.addEventListener('storage', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, [storageKey]);

  const toggleFavorite = useCallback((id: string | number) => {
    const key = String(id);
    const current = readStored(storageKey);
    const next = current.includes(key) ? current.filter((x) => x !== key) : [...current, key];
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* almacenamiento no disponible: se conserva solo en memoria */
    }
    setStore({ key: storageKey, ids: next });
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [storageKey]);

  const isFavorite = useCallback(
    (id: string | number) => favorites.includes(String(id)),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite };
}
