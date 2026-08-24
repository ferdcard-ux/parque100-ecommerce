/**
 * @fileoverview Controlador de autenticacion.
 * Hook React que encapsula el estado de sesion (usuario activo,
 * cargando, error) y expone las operaciones login/register/logout.
 * Actua como capa Controller entre las vistas de auth y el servicio
 * `authService`.
 */
import { useState, useCallback } from 'react';
import type { User, LoginCredentials, RegisterData } from '../models';
import { authService } from '../services';

/**
 * Controlador de autenticacion.
 *
 * @returns Objeto con estado y acciones de sesion.
 * @property {User|null} user - Usuario autenticado o null.
 * @property {boolean} isLoggedIn - true si hay sesion abierta.
 * @property {boolean} isAdmin - true si el usuario es administrador.
 * @property {boolean} isLoading - true durante peticiones en curso.
 * @property {string|null} error - Ultimo mensaje de error ocurrido.
 * @property {Function} login - Inicia sesion con credenciales.
 * @property {Function} register - Registra un usuario nuevo.
 * @property {Function} logout - Cierra la sesion actual.
 */
export function useAuthController() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Inicia sesion: llama al servicio, guarda el usuario y propaga
   * errores con mensaje legible para la vista.
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await authService.login(credentials);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Registra un usuario nuevo e inicia su sesion automaticamente. */
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authService.register(data);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al registrarse';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Cierra la sesion limpiando el estado del usuario. */
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  /** Indicadores derivados del estado del usuario. */
  const isLoggedIn = user !== null;
  const isAdmin = user?.isAdmin ?? false;

  return {
    user,
    isLoggedIn,
    isAdmin,
    isLoading,
    error,
    login,
    register,
    logout,
  };
}
