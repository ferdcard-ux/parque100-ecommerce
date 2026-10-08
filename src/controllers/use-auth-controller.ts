/**
 * @fileoverview Controlador de autenticacion con multiples sesiones activas.
 * Hook React que encapsula el estado de sesion y permite mantener varias
 * cuentas activas ("Cambiar de usuario" no cierra la sesion actual).
 */
import { useState, useCallback, useEffect } from 'react';
import type { User, LoginCredentials, RegisterData } from '../models';
import { authService, userService } from '../services';

const SESSION_KEY = 'p100-session';
const SESSIONS_KEY = 'p100-sessions';
const ACTIVE_KEY = 'p100-active-session';

/** Lee un JSON del almacenamiento sin lanzar. */
function readStored<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Estado inicial: migra la sesion unica legacy a la lista de sesiones. */
function loadInitialSessions(): { sessions: User[]; activeId: number | null } {
  const list = readStored<User[]>(localStorage, SESSIONS_KEY) || [];
  const valid = Array.isArray(list) ? list.filter((u) => u && typeof u.id === 'number') : [];
  if (valid.length > 0) {
    const active = readStored<number>(localStorage, ACTIVE_KEY);
    const activeId = valid.some((u) => u.id === active) ? active : valid[0].id;
    return { sessions: valid, activeId };
  }
  const legacy =
    readStored<User>(localStorage, SESSION_KEY) || readStored<User>(sessionStorage, SESSION_KEY);
  if (legacy && typeof legacy.id === 'number') {
    return { sessions: [legacy], activeId: legacy.id };
  }
  return { sessions: [], activeId: null };
}

/**
 * Controlador de autenticacion con multisesion.
 *
 * @returns Objeto con usuario activo, lista de sesiones y acciones.
 */
export function useAuthController() {
  const [initial] = useState(loadInitialSessions);
  const [sessions, setSessions] = useState<User[]>(initial.sessions);
  const [activeId, setActiveId] = useState<number | null>(initial.activeId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Persiste la lista de sesiones y el id activo. */
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      if (activeId !== null) {
        localStorage.setItem(ACTIVE_KEY, JSON.stringify(activeId));
        const active = sessions.find((s) => s.id === activeId) || null;
        if (active) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(active));
          sessionStorage.removeItem(SESSION_KEY);
        }
      } else {
        localStorage.removeItem(ACTIVE_KEY);
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      /* almacenamiento no disponible: sesiones solo en memoria */
    }
  }, [sessions, activeId]);

  const user = sessions.find((s) => s.id === activeId) || null;

  /** Agrega o reactiva una sesion sin cerrar las demas. */
  const activateSession = useCallback((nextUser: User, remember?: boolean) => {
    setSessions((prev) => {
      const without = prev.filter((s) => s.id !== nextUser.id);
      return [...without, nextUser];
    });
    setActiveId(nextUser.id);
    if (remember === false) {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
      } catch {
        /* solo memoria */
      }
    }
  }, []);

  /**
   * Inicia sesion: agrega la cuenta a las sesiones activas y la
   * deja como cuenta en uso, sin cerrar las demas.
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await authService.login(credentials);
      activateSession(loggedInUser, credentials.remember);
      return loggedInUser;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activateSession]);

  /** Registra un usuario nuevo y lo agrega como sesion activa. */
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authService.register(data);
      activateSession(newUser, true);
      return newUser;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al registrarse';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activateSession]);

  /** Cambia la cuenta en uso sin cerrar ninguna sesion. */
  const switchSession = useCallback((id: number) => {
    setActiveId(id);
  }, []);

  /**
   * Actualiza el perfil propio en el backend y refleja los cambios
   * en la sesion activa (y en las demas sesiones de la misma cuenta).
   */
  const updateProfile = useCallback(async (data: { firstName: string; lastName: string; email: string; phone: string }) => {
    if (activeId === null) throw new Error('Sin sesion activa');
    const row = await userService.updateProfile(activeId, {
      Nombre: `${data.firstName} ${data.lastName}`.trim(),
      Correo: data.email.trim(),
      Telefono: data.phone.replace(/\D/g, '').slice(0, 20),
    });
    const parts = (row.Nombre || '').split(' ');
    const updated: User = {
      id: row.ID_Usuario,
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      email: row.Correo,
      isAdmin: row.Rol === 'admin',
    };
    setSessions((prev) => prev.map((s) => (s.id === activeId ? updated : s)));
    return updated;
  }, [activeId]);

  /** Cierra una sesion concreta (por defecto la activa). */
  const closeSession = useCallback((id?: number) => {
    const target = id ?? activeId;
    if (target === null) return;
    const next = sessions.filter((s) => s.id !== target);
    setSessions(next);
    if (activeId === target) {
      setActiveId(next.length > 0 ? next[next.length - 1].id : null);
    }
  }, [sessions, activeId]);

  /** Cierra la sesion activa (las demas siguen disponibles). */
  const logout = useCallback(async () => {
    await authService.logout();
    closeSession();
  }, [closeSession]);

  /** Indicadores derivados del estado del usuario. */
  const isLoggedIn = user !== null;
  const isAdmin = user?.isAdmin ?? false;

  return {
    user,
    sessions,
    isLoggedIn,
    isAdmin,
    isLoading,
    error,
    login,
    register,
    logout,
    switchSession,
    closeSession,
    updateProfile,
  };
}
