/**
 * @fileoverview Controlador de favoritos.
 * Persiste los IDs de productos favoritos en localStorage como texto,
 * ya que los IDs de producto son cadenas (ej. 'P001').
 */
import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'parque100_favorites';
const CHANGE_EVENT = 'parque100_favorites_changed';

/** Lee los favoritos guardados, aceptando formato nuevo (texto) y legado (numero). */
function readStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
 * @returns ids favoritos y la accion de alternar.
 */
export function useFavoritesController() {
  const [favorites, setFavorites] = useState<string[]>(readStored);

  useEffect(() => {
    const sync = () => setFavorites(readStored());
    window.addEventListener('storage', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const toggleFavorite = useCallback((id: string | number) => {
    const key = String(id);
    setFavorites((prev) => {
      const next = prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* almacenamiento no disponible: se conserva solo en memoria */
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string | number) => favorites.includes(String(id)),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite };
}
