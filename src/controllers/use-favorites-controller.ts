/**
 * @fileoverview Controlador de favoritos.
 * Persiste los IDs de productos favoritos en localStorage.
 */
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'parque100_favorites';

function readStored(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'number') : [];
  } catch {
    return [];
  }
}

/**
 * Hook de favoritos persistido en localStorage.
 *
 * @returns ids favoritos y la accion de alternar.
 */
export function useFavoritesController() {
  const [favorites, setFavorites] = useState<number[]>(readStored);

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* almacenamiento no disponible: se conserva solo en memoria */
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
